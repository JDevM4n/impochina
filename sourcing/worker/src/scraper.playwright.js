import { chromium } from "playwright";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

function normalizePrice(str) {
  if (!str) return null;
  let s = String(str).replace(/[^\d.,]/g, "").trim();
  if (!s) return null;
  const dot = (s.match(/\./g) || []).length;
  const comma = (s.match(/,/g) || []).length;
  if (dot && comma) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (comma && !dot) s = s.replace(",", ".");
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return null;
  if (n <= 0 || n > 100000) return null;
  return Math.round(n * 100) / 100;
}

function absolutize(baseUrl, maybeUrl) {
  if (!maybeUrl) return null;
  try { return new URL(maybeUrl, baseUrl).toString(); } catch { return null; }
}

export async function scrapeWithPlaywright(url) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: UA,
    locale: "zh-CN",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    // Bloquea solo imágenes y fuentes (dejamos CSS y scripts para que renderice)
    await page.route("**/*", (route) => {
      const t = route.request().resourceType();
      if (t === "image" || t === "font") return route.abort();
      return route.continue();
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });

    // Espera a que aparezca algo que parezca título/precio
    // (las páginas de Taobao varían muchísimo)
    const titleSel = [
      "#J_Title .tb-main-title",
      ".tb-main-title",
      "h1",
      '[data-spm-anchor-id*="title"]'
    ].join(", ");
    await page.waitForTimeout(1500);
    await Promise.race([
      page.waitForSelector(titleSel, { timeout: 6000 }).catch(() => {}),
      page.waitForSelector('.tm-price, .tb-rmb-num, [class*="price"]', { timeout: 6000 }).catch(() => {}),
    ]);

    const result = await page.evaluate(() => {
      function text(el) { return el ? (el.textContent || "").trim() : ""; }

      function pickTitle() {
        const t1 = document.querySelector("#J_Title .tb-main-title");
        if (t1 && text(t1)) return text(t1);
        const t2 = document.querySelector(".tb-main-title");
        if (t2 && text(t2)) return text(t2);
        const h1 = document.querySelector("h1");
        if (h1 && text(h1) && text(h1).length > 2) return text(h1);
        const og = document.querySelector('meta[property="og:title"]');
        if (og?.content) return og.content;
        return document.title || null;
      }

      function pickImage() {
        const og = document.querySelector('meta[property="og:image"]');
        if (og?.content) return og.content;
        const booth = document.querySelector("#J_ImgBooth");
        if (booth?.getAttribute("src")) return booth.getAttribute("src");
        const thumb = document.querySelector("#J_UlThumb img") || document.querySelector("img");
        const src = thumb?.getAttribute("data-src") || thumb?.getAttribute("src");
        return src || null;
      }

      function pickFromLdJson() {
        const ld = document.querySelector('script[type="application/ld+json"]');
        if (!ld) return {};
        try {
          const j = JSON.parse(ld.textContent || "{}");
          const price = j?.offers?.price || (Array.isArray(j?.offers) ? j.offers[0]?.price : null);
          const currency = j?.offers?.priceCurrency || (Array.isArray(j?.offers) ? j.offers[0]?.priceCurrency : null);
          const name = j?.name || null;
          return { price, currency, name };
        } catch { return {}; }
      }

      function pickFromMeta() {
        const mp = document.querySelector('meta[property="og:price:amount"]');
        const mc = document.querySelector('meta[property="product:price:currency"]')
               || document.querySelector('meta[itemprop="priceCurrency"]');
        return { price: mp?.content || null, currency: mc?.content || null };
      }

      function pickFromDom() {
        const priceEl = document.querySelector(".tm-price")
                      || document.querySelector(".tb-rmb-num")
                      || document.querySelector('[class*="price"]');
        return { price: priceEl ? (priceEl.textContent || "").trim() : null, currency: null };
      }

      function pickFromScripts() {
        const scripts = Array.from(document.scripts).map(s => s.textContent || "").join("\n");
        const m = scripts.match(/"reserve_price"\s*:\s*"([\d.,]+)"/)
               || scripts.match(/"price"\s*:\s*"([\d.,]+)"/);
        return { price: m ? m[1] : null, currency: null };
      }

      let title = pickTitle();
      // Evita título genérico "商品详情" si hay alternativas en JSON
      const ld = pickFromLdJson();
      if ((!title || title === "商品详情") && ld?.name) title = ld.name;

      const img = pickImage();

      let price = ld?.price || null;
      let currency = ld?.currency || null;
      if (!price) ({ price, currency } = pickFromMeta());
      if (!price) ({ price } = pickFromDom());
      if (!price) ({ price } = pickFromScripts());
      if (!currency) currency = /[￥¥]/.test(document.body.innerText || "") ? "CNY" : "CNY";

      return { title: title || null, image: img || null, priceStr: price || null, currency };
    });

    const price = normalizePrice(result.priceStr);
    return {
      url,
      title: result.title,
      price,
      currency: result.currency || "CNY",
      image: absolutize(url, result.image),
      httpStatus: 200,
      ok: true,
    };
  } catch (e) {
    return { url, title: null, price: null, currency: null, image: null, httpStatus: 0, ok: false, error: e.message };
  } finally {
    await context.close();
    await browser.close();
  }
}
