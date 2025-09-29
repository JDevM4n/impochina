// sourcing/api/src/index.js
import express from "express";
import cors from "cors";
import amqp from "amqplib";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

import { pool } from "./db.js";
import { maybeRequireAuth } from "./auth.js";
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

const PORT = process.env.PORT || 3301;
const RABBIT_URL = process.env.RABBIT_URL || "amqp://rabbitmq:5672";
const EMBEDDED_CONSUMER = process.env.EMBEDDED_CONSUMER === "1";

// ---- util paths (JSON legacy por compatibilidad) ----
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CART_DB_PATH = path.resolve("/app/cart-db.json");

async function readJson(file) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch { return {}; }
}
async function writeJson(file, obj) {
  await fs.writeFile(file, JSON.stringify(obj, null, 2));
}

// -------------------------------------
// RabbitMQ
// -------------------------------------
let channel;

async function connectRabbit() {
  const conn = await amqp.connect(RABBIT_URL);
  channel = await conn.createChannel();

  // Colas
  await channel.assertQueue("scrape.product.requested", { durable: true });
  await channel.assertQueue("warehouse.order.ready", { durable: true });

  // (Opcional) Consumer embebido de mock para scraping
  if (EMBEDDED_CONSUMER) {
    await channel.consume(
      "scrape.product.requested",
      async (msg) => {
        try {
          const payload = JSON.parse(msg.content.toString());
          const { requestId, urls = [] } = payload;

          updateStatus(requestId, Status.IN_PROGRESS, { message: "Procesando..." });

          setTimeout(() => {
            const items = urls.map((url, idx) => ({
              url,
              title: `Mock item ${idx + 1}`,
              price: 0,
              currency: "CNY",
              image: "",
            }));

            setResults(requestId, items);
            updateStatus(requestId, Status.COMPLETED, {
              message: `Procesadas ${urls.length} URL(s)`,
            });

            channel.ack(msg);
          }, 800);
        } catch (err) {
          console.error("[api] Consumer error:", err?.message);
          channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
    console.log("[api] Embedded consumer ON");
  } else {
    console.log("[api] Embedded consumer OFF");
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

// -------------------------------------
// Health
// -------------------------------------
app.get("/health", (_, res) => res.json({ ok: true, service: "sourcing-api" }));

// -------------------------------------
// Proxy de imágenes (evita hotlink)
// -------------------------------------
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

    res.setHeader("content-type", r.headers.get("content-type") || "image/jpeg");
    res.setHeader("cache-control", "public, max-age=86400");
    return r.body.pipe(res);
  } catch {
    res.status(500).end();
  }
});

// -------------------------------------
// Crear solicitud de scraping
// -------------------------------------
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

// Estado público
app.get("/purchase-requests/:id", (req, res) => {
  const { id } = req.params;
  const state = getStatus(id);
  if (!state) {
    return res.status(404).json({ error: `purchase-request ${id} not found` });
  }
  return res.json(state);
});

// Resultados públicos
app.get("/purchase-requests/:id/results", (req, res) => {
  const { id } = req.params;
  const items = getResults(id);
  return res.json({ requestId: id, count: items.length, items });
});

// ------------------------------
// Endpoints internos (worker)
// ------------------------------
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
  console.log(`[api] [internal] status -> id=${id} ${status} msg="${message || ""}"`);
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

// ------------------------------
// Checkout + órdenes (PostgreSQL)
// ------------------------------
app.post("/checkout", maybeRequireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    // user de token (si vino) o del body (legacy)
    const tokenUser = req.user; // { id, name } si Authorization: Bearer <JWT>
    const {
      userId: bodyUserId,
      userName: bodyUserName,
      items = [],
      status = "READY_IN_WAREHOUSE",
    } = req.body ?? {};

    const userId = tokenUser?.id || bodyUserId;
    const userName = tokenUser?.name || bodyUserName;

    if (!userId || !userName) {
      return res.status(400).json({
        error: "missing_user",
        details: "Envía Authorization: Bearer <JWT> o userId/userName en el body",
      });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items_required" });
    }

    // normaliza items y calcula total
    const normItems = items.map((x) => ({
      id: String(x.id || ""),
      title: String(x.title || ""),
      qty: Math.max(1, parseInt(x.qty ?? 1, 10)),
      priceUsd: Number(x.priceUsd || 0),
      url: String(x.url || ""),
    }));
    const totalUsd = normItems.reduce((s, x) => s + x.priceUsd * x.qty, 0);

    await client.query("BEGIN");

    // upsert user
    await client.query(
      `INSERT INTO users(user_id, user_name)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET user_name = EXCLUDED.user_name`,
      [userId, userName]
    );

    // crea orden
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders(user_id, status, total_usd)
       VALUES ($1, $2, $3)
       RETURNING order_id, created_at`,
      [userId, status, totalUsd]
    );
    const orderId = orderRows[0].order_id;

    // upsert productos + snapshot
    for (const it of normItems) {
      await client.query(
        `INSERT INTO products(product_id, title, url)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id) DO UPDATE
           SET title = EXCLUDED.title, url = EXCLUDED.url, updated_at = NOW()`,
        [it.id, it.title || null, it.url || null]
      );
      await client.query(
        `INSERT INTO order_items(order_id, product_id, title, url, price_usd, qty)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, it.id, it.title || null, it.url || null, it.priceUsd, it.qty]
      );
    }

    await client.query("COMMIT");

    // evento para el otro microservicio
    const orderPayload = {
      msgType: "checkout.created",
      msgVersion: "v1",
      orderId,
      status,
      user: { id: userId, name: userName },
      items: normItems,
      totalUsd,
      createdAt: orderRows[0].created_at,
    };
    try {
      if (channel) {
        channel.sendToQueue(
          "warehouse.order.ready",
          Buffer.from(JSON.stringify(orderPayload)),
          { persistent: true }
        );
      }
    } catch (e) {
      console.warn("[api] publish warehouse.order.ready failed:", e.message);
    }

    return res.status(201).json({
      ok: true,
      order: {
        orderId,
        status,
        items: normItems,
        totalUsd,
        createdAt: orderRows[0].created_at,
        userId,
        userName,
      },
    });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    return res.status(500).json({ error: "checkout_failed" });
  } finally {
    client.release();
  }
});

// ------------------------------
// Lista de órdenes (opcional por usuario)
// ------------------------------
app.get("/orders", async (req, res) => {
  try {
    const { userId } = req.query;

    const baseOrderSql = `
      SELECT o.order_id, o.user_id, o.status, o.total_usd, o.created_at, u.user_name
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      ${userId ? "WHERE o.user_id = $1" : ""}
      ORDER BY o.created_at DESC
      LIMIT 100
    `;

    const { rows: orders } = await pool.query(
      baseOrderSql,
      userId ? [userId] : []
    );

    const result = [];
    for (const o of orders) {
      const { rows: items } = await pool.query(
        `SELECT product_id, title, url, price_usd, qty
         FROM order_items WHERE order_id = $1
         ORDER BY product_id`,
        [o.order_id]
      );
      result.push({ ...o, items });
    }

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "orders_query_failed" });
  }
});

// ------------------------------
// (Opcional) sirve un viewer
// ------------------------------
app.use(express.static(path.join(__dirname, "..", "public")));
app.get("/", (_, res) =>
  res.type("text").send("OK - sourcing-api. Usa /health o abre el viewer.")
);

// ------------------------------
// Boot
// ------------------------------
app.listen(PORT, async () => {
  console.log(`[api] listening on :${PORT}`);
  try {
    await connectRabbit();
  } catch (e) {
    console.error("[api] Rabbit connection failed:", e.message);
    process.exit(1);
  }
});
