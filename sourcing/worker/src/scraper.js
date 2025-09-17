// sourcing/worker/src/scraper.js
import * as cheerio from "cheerio";
import iconv from "iconv-lite";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// -------- Charset detection & decoding --------
function normalizeCharset(cs) {
  if (!cs) return "utf-8";
  cs = cs.trim().toLowerCase();
  if (["gbk", "gb2312", "gb-2312", "gb18030"].includes(cs)) return "gb18030";
  if (cs === "utf8") return "utf-8";
  return cs;
}

function detectCharsetFromHeaders(ct) {
  if (!ct) return null;
  const m = /charset=([^;]+)/i.exec(ct);
  return m ? normalizeCharset(m[1]) : null;
}

function detectCharsetFromMeta(buf) {
  // leemos solo el comienzo como latin1 para encontrar el meta (caracteres ASCII)
  const head = Buffer.from(buf).subarray(0, 8192).toString("latin1");
  let m = head.match(/<meta[^>]+charset=["']?\s*([a-zA-Z0-9_-]+)/i);
  if (m) return normalizeCharset(m[1]);
  m = head.match(/<meta[^>]+content=["'][^"']*charset=([a-zA-Z0-9_-]+)/i);
  if (m) return normalizeCharset(m[1]);
  return null;
}

function decodeBody(buf, headers) {
  const hCharset = detectCharsetFromHeaders(headers?.get?.("content-type"));
  const mCharset = detectCharsetFromMeta(buf);
  const charset = normalizeCharset(hCharset || mCharset || "utf-8");
  try {
    const html = iconv.decode(Buffer.from(buf), charset);
    return { html, charset };
  } catch (e) {
    // fallback a utf-8
    return { html: Buffer.from(buf).toString("utf-8"), charset: "utf-8(fallback)" };
  }
}

// ---- fetch con timeout y 1 reintento + decode ----
async function fetchHtml(url, timeoutMs = 12000, attempt = 1) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": UA,
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,es;q=0.7",
        "cache-control": "no-cache",
        pragma: "no-cache",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        referer: "https://www.taobao.com/",
      },
      redirect: "follow",
      signal: ctrl.signal,
    });

    const ab = await res.arrayBuffer();
    const { html, charset } = decodeBody(ab, res.headers);

    return { ok: res.ok, status: res.status, html, charset };
  } catch (e) {
    // 1 reintento si abortó o fue error transitorio
    if (attempt === 1) {
      await delay(600);
      return fetchHtml(url, timeoutMs, 2);
    }
    return { ok: false, status: 0, html: "", error: e.message || String(e) };
  } finally {
    clearTimeout(t);
  }
}

export async function scrapeUrl(url) {
  console.log(`[worker] scraping: ${url}`);
  const { ok, status, html, error, charset } = await fetchHtml(url, 12000);

  if (!ok) {
    console.log(`[worker] scrape fail: ${url} http=${status} err=${error || "N/A"}`);
    return {
      url, title: null, price: null, currency: null, image: null,
      httpStatus: status, ok, error: error || `http_${status}`,
    };
  }

  console.log(`[worker] decoded charset=${charset}`);
  const $ = cheerio.load(html);

  // --- TITLE ---
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").first().text().trim() ||
    null;

  // --- IMAGE ---
  const image =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    $("img").first().attr("src") ||
    null;

  // --- PRICE / CURRENCY ---
  let priceStr =
    extractFromJson(html, /"reserve_price"\s*:\s*"([\d.,]+)"/) ||
    extractFromJson(html, /"price"\s*:\s*"([\d.,]+)"/) ||
    extractFromJson(html, /"priceText"\s*:\s*"([\d.,]+)"/) ||
    null;

  if (!priceStr) priceStr = findPriceInText($);

  let currency =
    extractFromJson(html, /"priceCurrency"\s*:\s*"([A-Z]{3})"/) ||
    detectCurrencySymbol(html) ||
    "CNY";

  const price = normalizePrice(priceStr);

  console.log(
    `[worker] scraped: ${url} http=${status} title=${title ? "y" : "n"} price=${price ?? "n"}`
  );

  return cleanItem({
    url,
    title,
    price,
    currency,
    image: absolutize(url, image),
    httpStatus: status,
    ok,
  });
}

// ----------------- helpers -----------------

function extractFromJson(html, regex) {
  const m = html.match(regex);
  return m ? m[1] : null;
}

function findPriceInText($) {
  const text = $("body").text().replace(/\s+/g, " ");
  const cn = text.match(/(?:￥|¥)\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/);
  if (cn) return cn[0];
  const usd = text.match(/\$\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/);
  if (usd) return usd[0];
  const generic = text.match(
    /(\d{1,3}(?:[.,]\d{3}){1,3}(?:[.,]\d{1,2})?)|(\d{2,})(?:[.,]\d{1,2})?/
  );
  if (!generic) return null;
  const n = normalizePrice(generic[0]);
  return n && n <= 100000 ? String(n) : null;
}

function detectCurrencySymbol(html) {
  if (/CNY|RMB/i.test(html)) return "CNY";
  if (/[￥¥]/.test(html)) return "CNY";
  if (/USD|\$/.test(html)) return "USD";
  return null;
}

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
  if (n <= 0 || n > 100000) return null; // filtro anti-ruido
  return Number(Math.round(n * 100) / 100);
}

function absolutize(baseUrl, maybeUrl) {
  if (!maybeUrl) return null;
  try {
    return new URL(maybeUrl, baseUrl).toString();
  } catch {
    return null;
  }
}

function cleanItem(item) {
  const out = { ...item };
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) out[k] = null;
    if (typeof out[k] === "string") out[k] = out[k].trim();
  }
  return out;
}
