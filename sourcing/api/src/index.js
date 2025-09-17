// sourcing/api/src/index.js
import express from "express";
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

const PORT = process.env.PORT || 3000;
const RABBIT_URL = process.env.RABBIT_URL || "amqp://rabbitmq:5672";

let channel;

async function connectRabbit() {
  const conn = await amqp.connect(RABBIT_URL);
  channel = await conn.createChannel();
  await channel.assertQueue("scrape.product.requested", { durable: true });

  // Consumidor para simular el worker dentro de la API (placeholder)
  // Consumidor para simular el worker dentro de la API (placeholder)
if (process.env.EMBEDDED_CONSUMER === "1") {
  await channel.consume(
    "scrape.product.requested",
    async (msg) => {
      try {
        const payload = JSON.parse(msg.content.toString());
        const { requestId, urls = [] } = payload;

        // IN_PROGRESS
        updateStatus(requestId, Status.IN_PROGRESS, { message: "Procesando..." });

        // Simulación de trabajo (1s). Aquí irá tu scraper real.
        setTimeout(() => {
          const items = urls.map((url, idx) => ({
            url,
            title: `Mock item ${idx + 1}`,
            price: 0,
            currency: "CNY",
          }));

          console.log(`[api] setResults -> requestId=${requestId} items=${items.length}`);

          // Guardar resultados y cerrar como COMPLETED
          setResults(requestId, items);
          updateStatus(requestId, Status.COMPLETED, {
            message: `Procesadas ${urls.length} URL(s)`,
          });

          channel.ack(msg);
        }, 1000);
      } catch (err) {
        console.error("[api] Consumer error:", err?.message);
        channel.nack(msg, false, false); // descartar para no quedar en loop
      }
    },
    { noAck: false }
  );
  console.log("[api] Consumer attached to scrape.product.requested");
} else {
  console.log("[api] Embedded consumer disabled (EMBEDDED_CONSUMER != 1)");
}


  console.log("[api] Consumer attached to scrape.product.requested");
  console.log("[api] Connected to RabbitMQ");

  // Resiliencia básica
  conn.on("close", () => {
    console.error("[api] Rabbit connection closed");
    process.exit(1);
  });
  conn.on("error", (err) => {
    console.error("[api] Rabbit connection error:", err?.message);
    process.exit(1);
  });
}

// Health
app.get("/health", (_, res) =>
  res.json({ ok: true, service: "sourcing-api" })
);

// Crear solicitud
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

    // Estado inicial
    initPending(requestId, "Scrape job encolado");

    // Encolar
    channel.sendToQueue(
      "scrape.product.requested",
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );

    // Respuesta
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

// Estado público del request
app.get("/purchase-requests/:id", (req, res) => {
  const { id } = req.params;
  const state = getStatus(id);
  if (!state) {
    return res.status(404).json({ error: `purchase-request ${id} not found` });
  }
  return res.json(state);
});

// Resultados públicos del request
app.get("/purchase-requests/:id/results", (req, res) => {
  const { id } = req.params;
  const items = getResults(id);
  return res.json({ requestId: id, count: items.length, items });
});

// =========================
// Endpoints internos (para el worker separado)
// =========================

// Actualizar estado (INTERNAL)
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
  return res.json(updated);
});

// Guardar resultados (INTERNAL)
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
  return res.json({ requestId: id, saved: items.length });
});

app.listen(PORT, async () => {
  console.log(`[api] listening on :${PORT}`);
  try {
    await connectRabbit();
  } catch (e) {
    console.error("[api] Rabbit connection failed:", e.message);
    process.exit(1);
  }
});
