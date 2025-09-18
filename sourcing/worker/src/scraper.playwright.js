// sourcing/worker/src/scraper.playwright.js
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
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (comma && !dot) {
    s = s.replace(",", ".");
  }

  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return null;
  if (n <= 0 || n > 100000) return null;
  return Math.round(n * 100) / 100;
}

function absolutize(baseUrl, maybeUrl) {
  if (!maybeUrl) return null;
  try {
    return new URL(maybeUrl, baseUrl).toString();
  } catch {
    return null;
  }
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
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Pequeños "gestos" para forzar render de partes dinámicas
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Espera básica a algo que parezca título o precio
    const titleCandidates = [
      "#J_Title .tb-main-title",
      ".tb-main-title",
      "#J_DetailMeta .tb-detail-hd h1",
      ".ItemTitle--container_, h1",
      'meta[property="og:title"]',
    ].join(", ");
    await Promise.race([
      page.waitForSelector(titleCandidates, { timeout: 8000 }).catch(() => {}),
      page.waitForSelector(".tm-price, .tb-rmb-num, [class*='price']", {
        timeout: 8000,
      }).catch(() => {}),
    ]);

    const result = await page.evaluate(() => {
      function txt(el) {
        return el ? (el.textContent || "").trim() : "";
      }
      const getMeta = (p, n) =>
        document.querySelector(`meta[property="${p}"]`)?.content ||
        document.querySelector(`meta[name="${n}"]`)?.content ||
        null;

      // --- TShop.Setup parser (Tmall/Taobao) ---
      function pickFromTShopSetup() {
        try {
          const txtAll = Array.from(document.scripts)
            .map((s) => s.textContent || "")
            .join("\n");
          const m = txtAll.match(/TShop\.Setup\(\s*(\{[\s\S]*?\})\s*\)/);
          if (!m) return {};
          const raw = m[1]
            .replace(/(['"])([a-zA-Z0-9_]+)\1\s*:/g, '"$2":') // keys sin comillas -> comillas
            .replace(/,\s*}/g, "}"); // trailing commas
          const j = JSON.parse(raw);
          const title =
            j?.itemDO?.title || j?.itemDO?.itemDO?.title || null;
          const reserve = j?.itemDO?.reservePrice || j?.itemDO?.price || null;
          return { title, price: reserve };
        } catch {
          return {};
        }
      }

      function pickTitle() {
        const a = document.querySelector("#J_Title .tb-main-title");
        if (txt(a)) return txt(a);
        const b = document.querySelector(".tb-main-title");
        if (txt(b)) return txt(b);
        const c = document.querySelector("#J_DetailMeta .tb-detail-hd h1");
        if (txt(c)) return txt(c);
        const og = getMeta("og:title");
        if (og) return og;
        const kw = getMeta(null, "keywords");
        if (kw && kw.length > 3) return kw;
        return (document.title || "").trim() || null;
      }

      function pickImage() {
        const og = getMeta("og:image");
        if (og) return og;
        const booth = document.querySelector("#J_ImgBooth");
        if (booth?.getAttribute("src")) return booth.getAttribute("src");
        const thumb =
          document.querySelector("#J_UlThumb img") ||
          document.querySelector("img");
        const src =
          thumb?.getAttribute("data-src") || thumb?.getAttribute("src");
        return src || null;
      }

      function pickFromLdJson() {
        const ld = document.querySelector(
          'script[type="application/ld+json"]'
        );
        if (!ld) return {};
        try {
          const j = JSON.parse(ld.textContent || "{}");
          const price =
            j?.offers?.price ||
            (Array.isArray(j?.offers) ? j.offers[0]?.price : null);
          const currency =
            j?.offers?.priceCurrency ||
            (Array.isArray(j?.offers) ? j.offers[0]?.priceCurrency : null);
          const name = j?.name || null;
          return { price, currency, name };
        } catch {
          return {};
        }
      }

      function pickFromMeta() {
        const price = getMeta("og:price:amount", "price");
        const currency =
          getMeta("product:price:currency", "priceCurrency") || "CNY";
        return { price, currency };
      }

      function pickFromDom() {
        const priceEl =
          document.querySelector(".tm-price") ||
          document.querySelector(".tb-rmb-num") ||
          document.querySelector('[class*="price"]');
        return { price: txt(priceEl), currency: null };
      }

      function pickFromScripts() {
        const scripts = Array.from(document.scripts)
          .map((s) => s.textContent || "")
          .join("\n");
        const m =
          scripts.match(/"reserve_price"\s*:\s*"([\d.,]+)"/) ||
          scripts.match(/"price"\s*:\s*"([\d.,]+)"/);
        return { price: m ? m[1] : null, currency: null };
      }

      const ld = pickFromLdJson();
      const tshop = pickFromTShopSetup();

      // título
      let title = pickTitle();
      if ((!title || title === "商品详情") && ld?.name) title = ld.name;
      if ((!title || title === "商品详情") && tshop?.title) title = tshop.title;

      // imagen
      const img = pickImage();

      // precio
      let price = ld?.price || null;
      let currency = ld?.currency || null;
      if (!price && tshop?.price) price = tshop.price;
      if (!price) ({ price, currency } = pickFromMeta());
      if (!price) ({ price } = pickFromDom());
      if (!price) ({ price } = pickFromScripts());
      if (!currency) currency = "CNY";

      return {
        title: title || null,
        image: img || null,
        priceStr: price || null,
        currency,
      };
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
    return {
      url,
      title: null,
      price: null,
      currency: null,
      image: null,
      httpStatus: 0,
      ok: false,
      error: e.message,
    };
  } finally {
    await context.close();
    await browser.close();
  }
}
