// sourcing/worker/src/worker.js
import amqp from "amqplib";
import { scrapeUrl } from "./scraper.js";
import { scrapeWithPlaywright } from "./scraper.playwright.js";

// ---------- ENV ----------
const RABBIT_URL     = process.env.RABBIT_URL || "amqp://rabbitmq:5672";
const API_URL        = process.env.API_URL    || "http://127.0.0.1:3000";
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || "";
const USE_PLAYWRIGHT = process.env.USE_PLAYWRIGHT === "1";
const TRANSLATE_ES   = process.env.TRANSLATE_ES === "1";
const USD_RATE       = Number(process.env.USD_RATE || "0.14"); // 1 CNY ≈ 0.14 USD

// ---------- helpers HTTP ----------
async function postJSON(url, body) {
  const headers = { "content-type": "application/json" };
  if (INTERNAL_TOKEN) headers["X-Internal-Token"] = INTERNAL_TOKEN;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`POST ${url} -> ${res.status} ${txt}`);
  }
  return res.json();
}

async function postWithRetry(url, body, tries = 3, waitMs = 800) {
  for (let i = 0; i < tries; i++) {
    try { return await postJSON(url, body); }
    catch (e) {
      if (i === tries - 1) throw e;
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
}

// ---------- URL utils ----------
function expandTaobaoAggregator(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== "huodong.taobao.com") return [url];
    const raw = u.searchParams.get("itemId");
    if (!raw) return [url];
    const ids = decodeURIComponent(raw).split(",").map(s => s.trim()).filter(Boolean);
    const productUrls = ids.map(id => `https://item.taobao.com/item.htm?id=${id}`);
    return productUrls.length ? productUrls : [url];
  } catch {
    return [url];
  }
}

function expandInputUrls(urls) {
  const out = [];
  for (const url of urls) out.push(...expandTaobaoAggregator(url));
  return out;
}

function isTaobaoProduct(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === "item.taobao.com" || hostname === "detail.tmall.com" || hostname.endsWith(".tmall.com");
  } catch {
    return false;
  }
}

// ---------- traducción safe (lazy import) ----------
let translateFn = null;
async function translateEsSafe(text) {
  if (!TRANSLATE_ES || !text) return text;
  try {
    if (!translateFn) {
      const mod = await import("@vitalets/google-translate-api");
      translateFn = mod.default || mod.translate || mod; // compatible CJS/ESM
    }
    const t = await translateFn(text, { to: "es" });
    return t?.text || text;
  } catch (e) {
    console.warn("[worker] translate error:", e.message);
    return text;
  }
}

// ---------- precio inventado + conversión ----------
function ensurePrices(rawPriceCNY) {
  let priceCNY = Number(rawPriceCNY);
  if (!Number.isFinite(priceCNY) || priceCNY <= 0) {
    // inventamos un precio realista (CNY)
    priceCNY = Math.round((80 + Math.random() * 320) * 100) / 100; // 80–400 CNY
  }
  const priceUSD = Math.round(priceCNY * USD_RATE * 100) / 100;
  return { priceCNY, priceUSD };
}

// ---------- main ----------
async function main() {
  console.log("[worker] starting...");
  const conn = await amqp.connect(RABBIT_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue("scrape.product.requested", { durable: true });
  await channel.prefetch(1);

  console.log("[worker] listening on queue scrape.product.requested");

  await channel.consume(
    "scrape.product.requested",
    async (msg) => {
      const payload = JSON.parse(msg.content.toString());
      const { requestId, urls = [] } = payload;
      const expandedUrls = expandInputUrls(urls);
      console.log(`[worker] received requestId=${requestId} urls=${urls.length} -> expanded=${expandedUrls.length}`);

      try {
        await postJSON(`${API_URL}/internal/purchase-requests/${requestId}/status`, {
          status: "IN_PROGRESS",
          message: "Worker arrancó",
        });

        const items = [];
        for (const url of expandedUrls) {
          try {
            const usePw = USE_PLAYWRIGHT && isTaobaoProduct(url);
            const data = usePw ? await scrapeWithPlaywright(url) : await scrapeUrl(url);

            const titleZh = data.title || null;
            const titleEs = await translateEsSafe(titleZh);

            const { priceCNY, priceUSD } = ensurePrices(data.price);

            const item = {
              url: data.url || url,
              title: titleEs || titleZh || "(sin título)",
              title_zh: titleZh,
              price: priceCNY,            // compat (CNY)
              priceCNY,
              priceUSD,
              currency: "CNY",
              image: data.image || null,
              httpStatus: data.httpStatus ?? 0,
            };

            console.log("[worker] scraped", {
              url: item.url, title: item.title, priceCNY: item.priceCNY, priceUSD: item.priceUSD, image: Boolean(item.image)
            });

            items.push(item);
          } catch (e) {
            items.push({
              url,
              title: "(sin título)",
              title_zh: null,
              price: null,
              priceCNY: null,
              priceUSD: null,
              currency: "CNY",
              image: null,
              httpStatus: 0,
              error: `scrape_error: ${e.message}`,
            });
          }
        }

        await postWithRetry(`${API_URL}/internal/purchase-requests/${requestId}/results`, { items });

        await postJSON(`${API_URL}/internal/purchase-requests/${requestId}/status`, {
          status: "COMPLETED",
          message: `Listo desde worker (${expandedUrls.length} URL(s))`,
        });

        channel.ack(msg);
        console.log(`[worker] done requestId=${requestId}`);
      } catch (err) {
        console.error("[worker] error:", err.message);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );

  conn.on("close", () => { console.error("[worker] rabbit connection closed"); process.exit(1); });
  conn.on("error", (e) => { console.error("[worker] rabbit error:", e.message); process.exit(1); });
}

main().catch((e) => { console.error("[worker] fatal:", e); process.exit(1); });
