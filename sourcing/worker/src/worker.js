import amqp from "amqplib";

// Usa fetch nativo (Node 18+). Tu Node es 22.x -> OK.
const RABBIT_URL = process.env.RABBIT_URL || "amqp://rabbitmq:5672";
const API_URL = process.env.API_URL || "http://127.0.0.1:3000"; // ajusta al puerto real de tu API (3301)

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`POST ${url} -> ${res.status} ${txt}`);
  }
  return res.json();
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
      console.log(`[worker] received requestId=${requestId} urls=${urls.length}`);

      try {
        // 1) IN_PROGRESS
        await postJSON(`${API_URL}/internal/purchase-requests/${requestId}/status`, {
          status: "IN_PROGRESS",
          message: "Worker arrancó",
        });

        // 2) Simular trabajo (1s). Aquí va tu scraper real.
        await new Promise((r) => setTimeout(r, 1000));
        const items = urls.map((url, idx) => ({
          url,
          title: `Mock item ${idx + 1} (from worker)`,
          price: 0,
          currency: "CNY",
        }));

        // 3) Guardar resultados
        await postJSON(`${API_URL}/internal/purchase-requests/${requestId}/results`, {
          items,
        });

        // 4) COMPLETED
        await postJSON(`${API_URL}/internal/purchase-requests/${requestId}/status`, {
          status: "COMPLETED",
          message: `Listo desde worker (${urls.length} URL(s))`,
        });

        channel.ack(msg);
        console.log(`[worker] done requestId=${requestId}`);
      } catch (err) {
        console.error("[worker] error:", err.message);
        // descartar para evitar loop; en real podrías reencolar con backoff
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );

  conn.on("close", () => {
    console.error("[worker] rabbit connection closed");
    process.exit(1);
  });
  conn.on("error", (e) => {
    console.error("[worker] rabbit error:", e.message);
    process.exit(1);
  });
}

main().catch((e) => {
  console.error("[worker] fatal:", e);
  process.exit(1);
});
