// sourcing/api/src/index.js
import express from "express";
import cors from "cors";
import { Readable } from "node:stream";
import { v4 as uuidv4 } from "uuid";
import amqp from "amqplib";
import {
  initPending,
  getStatus,
  updateStatus,
  Status,
  setResults,
  getResults,
} from "./state.js";

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const RABBIT_URL = process.env.RABBIT_URL || "amqp://rabbitmq:5672";

let channel;

/* ------------------------------ RabbitMQ ------------------------------ */
async function connectRabbit() {
  const conn = await amqp.connect(RABBIT_URL);
  channel = await conn.createChannel();
  await channel.assertQueue("scrape.product.requested", { durable: true });

  // Consumidor embebido SOLO si está habilitado (modo demo)
  if (process.env.EMBEDDED_CONSUMER === "1") {
    await channel.consume(
      "scrape.product.requested",
      async (msg) => {
        try {
          const payload = JSON.parse(msg.content.toString());
          const { requestId, urls = [] } = payload;

          updateStatus(requestId, Status.IN_PROGRESS, {
            message: "Procesando...",
          });

          setTimeout(() => {
            const items = urls.map((url, idx) => ({
              url,
              title: `Mock item ${idx + 1}`,
              price: 0,
              currency: "CNY",
            }));

            console.log(
              `[api] setResults -> requestId=${requestId} items=${items.length}`
            );

            setResults(requestId, items);
            updateStatus(requestId, Status.COMPLETED, {
              message: `Procesadas ${urls.length} URL(s)`,
            });

            channel.ack(msg);
          }, 1000);
        } catch (err) {
          console.error("[api] Consumer error:", err?.message);
          channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
    console.log("[api] Consumer attached to scrape.product.requested");
  } else {
    console.log("[api] Embedded consumer disabled (EMBEDDED_CONSUMER != 1)");
  }

  console.log("[api] Connected to RabbitMQ");

  conn.on("close", () => {
    console.error("[api] Rabbit connection closed");
    process.exit(1);
  });
  conn.on("error", (err) => {
    console.error("[api] Rabbit connection error:", err?.message);
    process.exit(1);
  });
}

/* ------------------------------ Health ------------------------------ */
app.get("/health", (_, res) => res.json({ ok: true, service: "sourcing-api" }));

/* ------------------------------ Proxy de imágenes ------------------------------ */
// Evita hotlink y añade UA/Referer de Alibaba. Compatible con Node 18/20/22.
app.get("/image", async (req, res) => {
  try {
    const u = req.query.u;
    if (!u) return res.status(400).json({ error: "missing u" });

    const r = await fetch(u, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        referer: "https://detail.tmall.com/",
      },
    });

    if (!r.ok) return res.status(r.status).end();

    res.setHeader(
      "content-type",
      r.headers.get("content-type") || "image/jpeg"
    );
    res.setHeader("cache-control", "public, max-age=86400");

    // body es WebReadableStream en Node >=18 -> conviértelo a stream de Node
    if (r.body && typeof r.body.getReader === "function") {
      Readable.fromWeb(r.body).pipe(res);
    } else {
      const buf = Buffer.from(await r.arrayBuffer());
      res.end(buf);
    }
  } catch (e) {
    console.error("/image error:", e);
    res.status(500).end();
  }
});

/* ------------------------------ API pública ------------------------------ */
app.post("/purchase-requests", async (req, res) => {
  try {
    const { urls = [] } = req.body ?? {};
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "urls (array) es requerido" });
    }
    if (!channel) {
      return res.status(503).json({ error: "queue_unavailable" });
    }

    const requestId = uuidv4();
    const payload = { requestId, urls, ts: Date.now() };

    initPending(requestId, "Scrape job encolado");

    channel.sendToQueue(
      "scrape.product.requested",
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );

    return res.status(202).json({
      requestId,
      status: Status.PENDING,
      message: "Scrape job encolado",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal_error" });
  }
});

app.get("/purchase-requests/:id", (req, res) => {
  const { id } = req.params;
  const state = getStatus(id);
  if (!state) {
    return res.status(404).json({ error: `purchase-request ${id} not found` });
  }
  return res.json(state);
});

app.get("/purchase-requests/:id/results", (req, res) => {
  const { id } = req.params;
  const items = getResults(id);
  return res.json({ requestId: id, count: items.length, items });
});

/* ------------------------------ Endpoints internos (worker) ------------------------------ */
app.post("/internal/purchase-requests/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, message, error } = req.body ?? {};

  const allowed = new Set(Object.values(Status));
  if (!allowed.has(status)) {
    return res.status(400).json({ error: "invalid_status", allowed: [...allowed] });
  }

  const current = getStatus(id);
  if (!current) {
    return res.status(404).json({ error: `purchase-request ${id} not found` });
  }

  const updated = updateStatus(id, status, { message, error });
  console.log(
    `[api] [internal] status -> id=${id} ${status} msg="${message || ""}"`
  );
  return res.json(updated);
});

app.post("/internal/purchase-requests/:id/results", (req, res) => {
  const { id } = req.params;
  const { items } = req.body ?? {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items_must_be_array" });
  }

  const current = getStatus(id);
  if (!current) {
    return res.status(404).json({ error: `purchase-request ${id} not found` });
  }

  setResults(id, items);
  console.log(`[api] [internal] setResults -> id=${id} count=${items.length}`);
  return res.json({ requestId: id, saved: items.length });
});

/* ------------------------------ Boot ------------------------------ */
app.listen(PORT, async () => {
  console.log(`[api] listening on :${PORT}`);
  try {
    await connectRabbit();
  } catch (e) {
    console.error("[api] Rabbit connection failed:", e.message);
    process.exit(1);
  }
});
