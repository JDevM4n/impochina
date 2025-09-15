import amqp from "amqplib";

const RABBIT_URL = process.env.RABBIT_URL;
const BROWSER_WS = process.env.BROWSER_WS; // por ahora solo lo mostramos

async function main() {
  console.log("[worker] starting...");
  console.log("[worker] broker:", RABBIT_URL);
  console.log("[worker] headless ws:", BROWSER_WS);

  const conn = await amqp.connect(RABBIT_URL);
  const ch = await conn.createChannel();
  await ch.assertQueue("scrape.product.requested", { durable: true });
  ch.prefetch(1);

  ch.consume("scrape.product.requested", async (msg) => {
    const job = JSON.parse(msg.content.toString());
    console.log("[worker] received job:", job);

    // Simulación de trabajo (aquí luego irá Playwright/Puppeteer)
    await new Promise((r) => setTimeout(r, 1500));
    console.log("[worker] done (simulado) for requestId:", job.requestId);

    ch.ack(msg);
  });

  console.log("[worker] waiting for messages...");
}

main().catch((e) => {
  console.error("[worker] fatal:", e);
  process.exit(1);
});
