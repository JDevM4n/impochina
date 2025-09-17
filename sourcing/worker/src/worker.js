// sourcing/worker/src/worker.js
import amqp from "amqplib";
import { scrapeUrl } from "./scraper.js";

const RABBIT_URL = process.env.RABBIT_URL || "amqp://rabbitmq:5672";
const API_URL = process.env.API_URL || "http://127.0.0.1:3000";
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || "";

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

// 👇 NUEVO: expande agregadores de huodong.taobao.com en URLs de producto
function expandTaobaoAggregator(url) {
  try {
    const u = new URL(url);
    // Solo nos interesa el host 'huodong.taobao.com'
    if (u.hostname !== "huodong.taobao.com") return [url];

    // Ej: itemId=574575426373%2C642099861838%2C640341374829%2C545428572834
    const raw = u.searchParams.get("itemId");
    if (!raw) return [url];

    const decoded = decodeURIComponent(raw);
    const ids = decoded.split(",").map(s => s.trim()).filter(Boolean);

    // Normalizamos a páginas de producto de Taobao
    const productUrls = ids.map(id => `https://item.taobao.com/item.htm?id=${id}`);
    return productUrls.length ? productUrls : [url];
  } catch {
    return [url];
  }
}

function expandInputUrls(urls) {
  const out = [];
  for (const url of urls) {
    const expanded = expandTaobaoAggregator(url);
    out.push(...expanded);
  }
  return out;
}

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

      // 👇 EXPANSIÓN aquí
      const expandedUrls = expandInputUrls(urls);
      console.log(`[worker] received requestId=${requestId} urls=${urls.length} -> expanded=${expandedUrls.length}`);

      try {
        // 1) IN_PROGRESS
        await postJSON(`${API_URL}/internal/purchase-requests/${requestId}/status`, {
          status: "IN_PROGRESS",
          message: "Worker arrancó",
        });

        // 2) Scrape MVP (usa tu scraper.js actual)
        const items = [];
        for (const url of expandedUrls) {
          try {
            const data = await scrapeUrl(url);
            items.push({
              url: data.url,
              title: data.title,
              price: data.price,
              currency: data.currency || "CNY",
              image: data.image,
              httpStatus: data.httpStatus,
            });
          } catch (e) {
            items.push({
              url,
              title: null,
              price: null,
              currency: null,
              image: null,
              error: `scrape_error: ${e.message}`,
            });
          }
        }

        // 3) Guardar resultados
        await postJSON(`${API_URL}/internal/purchase-requests/${requestId}/results`, { items });

        // 4) COMPLETED
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

  conn.on("close", () => {
    console.error("[worker] rabbit connection closed"); process.exit(1);
  });
  conn.on("error", (e) => {
    console.error("[worker] rabbit error:", e.message); process.exit(1);
  });
}

main().catch((e) => { console.error("[worker] fatal:", e); process.exit(1); });
