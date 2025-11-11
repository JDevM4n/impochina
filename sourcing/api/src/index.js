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
const CART_DB_PATH = path.resolve("/app/data/cart-db.json");

async function readJson(file) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch { return {}; }
}
async function writeJson(file, obj) {
  await fs.writeFile(file, JSON.stringify(obj, null, 2));
}

// Helper functions para el carrito JSON - VERSIÓN CON VOLUMEN
async function readCartDB() {
  try {
    // Asegurar que el directorio existe
    await fs.mkdir(path.dirname(CART_DB_PATH), { recursive: true });
    
    await fs.access(CART_DB_PATH);
    const data = await fs.readFile(CART_DB_PATH, 'utf8');
    
    if (!data || data.trim() === '') {
      throw new Error('Empty file');
    }
    
    const parsed = JSON.parse(data);
    
    // Validar estructura
    if (!parsed.cart || typeof parsed.cart !== 'object') {
      parsed.cart = {};
    }
    if (!parsed.orders || !Array.isArray(parsed.orders)) {
      parsed.orders = [];
    }
    
    console.log('✅ Cart DB loaded from:', CART_DB_PATH);
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT' || error.message === 'Empty file') {
      console.log('🆕 Creating new cart DB at:', CART_DB_PATH);
      const initialData = { 
        orders: [], 
        cart: {} 
      };
      await writeCartDB(initialData);
      return initialData;
    }
    console.error('❌ Error reading cart DB:', error);
    return { orders: [], cart: {} };
  }
}

async function writeCartDB(data) {
  try {
    // Asegurar directorio
    await fs.mkdir(path.dirname(CART_DB_PATH), { recursive: true });
    
    // Validar estructura
    if (!data.cart || typeof data.cart !== 'object') {
      data.cart = {};
    }
    if (!data.orders || !Array.isArray(data.orders)) {
      data.orders = [];
    }
    
    // Escribir archivo
    await fs.writeFile(CART_DB_PATH, JSON.stringify(data, null, 2));
    console.log('💾 Cart DB saved to:', CART_DB_PATH);
  } catch (error) {
    console.error('❌ CRITICAL: Error writing cart DB:', error);
    throw error;
  }
}

// Función para inicializar el archivo del carrito
async function initializeCartDB() {
  try {
    await readCartDB(); // Esto creará el archivo si no existe
    console.log('[api] Cart DB initialized successfully at:', CART_DB_PATH);
  } catch (error) {
    console.error('[api] Cart DB initialization failed:', error);
  }
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
// Carrito de compras (JSON) - VERSIÓN CORREGIDA
// ------------------------------

// Agregar producto al carrito
app.post("/cart/items", maybeRequireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { product } = req.body;
    
    console.log('🛒 Add to cart request:', { userId: user?.id, product: product?.url });
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (!product || !product.url) {
      return res.status(400).json({ error: "Product data with URL is required" });
    }

    const cartDB = await readCartDB();
    const userId = user.id;
    
    // Inicializar estructura de carrito si no existe
    if (!cartDB.cart[userId]) {
      cartDB.cart[userId] = [];
    }
    
    // Buscar si el producto ya está en el carrito
    const existingItemIndex = cartDB.cart[userId].findIndex(
      item => item.product.url === product.url
    );
    
    if (existingItemIndex !== -1) {
      // Actualizar cantidad si ya existe
      cartDB.cart[userId][existingItemIndex].quantity += product.quantity || 1;
      console.log('📈 Updated existing item quantity');
    } else {
      // Agregar nuevo producto al carrito
      const newCartItem = {
        cartItemId: Date.now().toString(),
        product: {
          url: product.url,
          title: product.title || product.title_zh || 'Producto sin nombre',
          title_zh: product.title_zh || product.title || '',
          priceCNY: product.priceCNY || 0,
          priceUSD: product.priceUSD || 0,
          currency: product.currency || 'CNY',
          image: product.image || ''
        },
        quantity: product.quantity || 1,
        addedAt: new Date().toISOString()
      };
      
      cartDB.cart[userId].push(newCartItem);
      console.log('🆕 Added new item to cart');
    }
    
    // Escribir en la base de datos
    await writeCartDB(cartDB);
    
    res.json({
      success: true,
      message: "Producto agregado al carrito"
    });

  } catch (error) {
    console.error("💥 Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add product to cart" });
  }
});

// Obtener carrito del usuario
app.get("/cart/items", maybeRequireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const cartDB = await readCartDB();
    const userCart = (cartDB.cart && cartDB.cart[user.id]) || [];
    
    res.json({ items: userCart });

  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ error: "Failed to get cart items" });
  }
});

// Actualizar cantidad en carrito
app.put("/cart/items/:itemId", maybeRequireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Valid quantity is required" });
    }

    const cartDB = await readCartDB();
    
    if (!cartDB.cart || !cartDB.cart[user.id]) {
      return res.status(404).json({ error: "Cart not found" });
    }
    
    const userCart = cartDB.cart[user.id];
    const itemIndex = userCart.findIndex(item => item.cartItemId === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    
    userCart[itemIndex].quantity = quantity;
    
    await writeCartDB(cartDB);

    res.json({ success: true, message: "Cantidad actualizada" });

  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ error: "Failed to update cart item" });
  }
});

// Eliminar producto del carrito
app.delete("/cart/items/:itemId", maybeRequireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { itemId } = req.params;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const cartDB = await readCartDB();
    
    if (!cartDB.cart || !cartDB.cart[user.id]) {
      return res.status(404).json({ error: "Cart not found" });
    }
    
    const userCart = cartDB.cart[user.id];
    const filteredCart = userCart.filter(item => item.cartItemId !== itemId);
    
    if (filteredCart.length === userCart.length) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    
    cartDB.cart[user.id] = filteredCart;
    await writeCartDB(cartDB);

    res.json({ success: true, message: "Producto eliminado del carrito" });

  } catch (error) {
    console.error("Error deleting from cart:", error);
    res.status(500).json({ error: "Failed to delete cart item" });
  }
});

// Checkout - Mover carrito a bodega (ms2-orders) - VERSIÓN CON DEBUGGING COMPLETO
app.post("/cart/checkout", maybeRequireAuth, async (req, res) => {
  console.log('💰 ===== INICIANDO CHECKOUT =====');
  console.log('👤 Usuario:', req.user?.id);
  console.log('🔑 Authorization header:', req.headers.authorization ? 'Presente' : 'Faltante');
  
  try {
    const user = req.user;
    
    if (!user) {
      console.log('❌ No user found in request');
      return res.status(401).json({ error: "Authentication required" });
    }

    const cartDB = await readCartDB();
    const userCart = (cartDB.cart && cartDB.cart[user.id]) || [];
    
    console.log('🛒 Carrito del usuario:', {
      userId: user.id,
      itemsCount: userCart.length,
      items: userCart.map(item => ({
        product: item.product.title,
        quantity: item.quantity,
        price: item.product.priceUSD
      }))
    });
    
    if (userCart.length === 0) {
      console.log('❌ Carrito vacío');
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Preparar órdenes para ms2-orders
    const ordersToCreate = userCart.map((item, index) => {
      const product = item.product;
      const orderData = {
        item: product.title || 'Producto sin nombre',
        qty: item.quantity,
        shippingPrice: 0,
        scrapedData: {
          originalUrl: product.url,
          originalTitle: product.title_zh || product.title,
          priceCNY: product.priceCNY,
          priceUSD: product.priceUSD,
          currency: product.currency || 'CNY',
          image: product.image
        }
      };
      console.log(`📝 Orden ${index + 1} preparada:`, orderData);
      return orderData;
    });

    console.log('📦 Enviando órdenes a ms2-orders...');
    console.log('🌐 URL destino: http://ms2-orders:8000/orders');

    // Crear órdenes en ms2-orders
    const createdOrders = [];
    const failedOrders = [];
    
    for (const [index, orderData] of ordersToCreate.entries()) {
      try {
        console.log(`\n🔄 Intentando crear orden ${index + 1}/${ordersToCreate.length}...`);
        
        const requestBody = JSON.stringify(orderData);
        console.log('📤 Request body:', requestBody);
        
        const orderResponse = await fetch('http://ms2-orders:8000/orders', {
          method: 'POST',
          headers: {
            'Authorization': req.headers.authorization || '',
            'Content-Type': 'application/json'
          },
          body: requestBody
        });

        console.log(`📡 Response status: ${orderResponse.status}`);
        console.log(`📡 Response headers:`, Object.fromEntries(orderResponse.headers.entries()));
        
        const responseText = await orderResponse.text();
        console.log(`📥 Response body:`, responseText);

        if (orderResponse.ok) {
          const orderResult = JSON.parse(responseText);
          console.log(`✅ Orden ${index + 1} creada exitosamente:`, orderResult);
          createdOrders.push(orderResult);
        } else {
          console.error(`❌ Error HTTP ${orderResponse.status} creando orden ${index + 1}:`, responseText);
          failedOrders.push({
            item: orderData.item,
            status: orderResponse.status,
            error: responseText
          });
        }
      } catch (error) {
        console.error(`💥 Error de red/conexión para orden ${index + 1}:`, error.message);
        failedOrders.push({
          item: orderData.item,
          error: error.message
        });
      }
    }

    console.log('\n📊 RESUMEN DEL CHECKOUT:');
    console.log(`✅ Órdenes exitosas: ${createdOrders.length}`);
    console.log(`❌ Órdenes fallidas: ${failedOrders.length}`);
    console.log(`📦 Total procesado: ${ordersToCreate.length}`);

    // Limpiar carrito solo si algunas órdenes se crearon exitosamente
    if (createdOrders.length > 0) {
      if (cartDB.cart && cartDB.cart[user.id]) {
        delete cartDB.cart[user.id];
        await writeCartDB(cartDB);
        console.log('🧹 Carrito limpiado exitosamente');
      }
    } else {
      console.log('⚠️ No se limpió el carrito - ninguna orden fue exitosa');
    }

    // Preparar respuesta
    const response = {
      success: createdOrders.length > 0,
      message: createdOrders.length > 0 
        ? `Checkout completado - ${createdOrders.length} productos enviados a bodega` 
        : 'Checkout falló - no se pudieron crear órdenes en bodega',
      ordersCount: createdOrders.length,
      createdOrders: createdOrders
    };

    if (failedOrders.length > 0) {
      response.failedOrders = failedOrders;
      response.message += `, ${failedOrders.length} productos fallaron`;
    }

    console.log('📤 Enviando respuesta al cliente:', response);
    res.json(response);

  } catch (error) {
    console.error("💥 ERROR CRÍTICO durante checkout:", error);
    console.error("💥 Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Checkout failed",
      details: error.message 
    });
  }
});

// Obtener órdenes de bodega
app.get("/warehouse/orders", maybeRequireAuth, async (req, res) => {
  try {
    console.log('📦 Obteniendo órdenes de bodega...');
    
    const response = await fetch('http://ms2-orders:8000/orders', {
      method: 'GET',
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const orders = await response.json();
      console.log(`✅ Órdenes obtenidas: ${orders.length}`);
      res.json(orders);
    } else {
      const errorText = await response.text();
      console.error('❌ Error obteniendo órdenes:', errorText);
      res.status(response.status).json({ error: errorText });
    }
  } catch (error) {
    console.error('💥 Error obteniendo órdenes de bodega:', error);
    res.status(500).json({ error: "Failed to get warehouse orders" });
  }
});

// Limpiar carrito completo
app.delete("/cart", maybeRequireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const cartDB = await readCartDB();
    
    if (cartDB.cart && cartDB.cart[user.id]) {
      delete cartDB.cart[user.id];
      await writeCartDB(cartDB);
    }

    res.json({ success: true, message: "Carrito limpiado" });

  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ error: "Failed to clear cart" });
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
    // Inicializar archivo del carrito - DEBE SER LO PRIMERO
    await initializeCartDB();
    await connectRabbit();
  } catch (e) {
    console.error("[api] Initialization failed:", e.message);
    process.exit(1);
  }
});