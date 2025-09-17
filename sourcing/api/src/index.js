// sourcing/api/src/index.js
import express from "express";
import { v4 as uuidv4 } from "uuid";
import amqp from "amqplib";
import { initPending, Status } from "./state.js"; // ← usamos tu store en memoria

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const RABBIT_URL = process.env.RABBIT_URL || "amqp://rabbitmq:5672";

let channel;

async function connectRabbit() {
  const conn = await amqp.connect(RABBIT_URL);
  channel = await conn.createChannel();
  await channel.assertQueue("scrape.product.requested", { durable: true });
  console.log("[api] Connected to RabbitMQ");

  // Opcional: si se cae Rabbit, salimos para que el orquestador reinicie el contenedor
  conn.on("close", () => {
    console.error("[api] Rabbit connection closed");
    process.exit(1);
  });
  conn.on("error", (err) => {
    console.error("[api] Rabbit connection error:", err?.message);
    process.exit(1);
  });
}

app.get("/health", (_, res) =>
  res.json({ ok: true, service: "sourcing-api" })
);

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

    // 1) Registrar estado inicial en memoria (PENDING)
    initPending(requestId, "Scrape job encolado");

    // 2) Enviar a la cola
    channel.sendToQueue(
      "scrape.product.requested",
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );

    // 3) Responder
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

app.listen(PORT, async () => {
  console.log(`[api] listening on :${PORT}`);
  try {
    await connectRabbit();
  } catch (e) {
    console.error("[api] Rabbit connection failed:", e.message);
    process.exit(1);
  }
});
