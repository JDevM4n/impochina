import React, { useEffect, useState } from "react";
import { getHealth, createOrder, getMyOrders } from "../api/Service2";

export default function BodegaPage() {
  const [health, setHealth] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const [form, setForm] = useState({
    productName: "",
    quantity: 1,
    shippingPrice: 0
  });

  async function load() {
    setErr(null);
    try {
      const h = await getHealth();
      setHealth(h);
      const list = await getMyOrders();
      setOrders(list);
    } catch (e) {
      setErr(e.message || "Error cargando datos");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      const payload = {
        productName: form.productName,
        quantity: Number(form.quantity),
        shippingPrice: Number(form.shippingPrice),
      };
      const created = await createOrder(payload);
      setMsg(`Pedido creado: ${created.id}`);
      setForm({ productName: "", quantity: 1, shippingPrice: 0 });
      const list = await getMyOrders();
      setOrders(list);
    } catch (e) {
      setErr(e.message || "Error creando pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>BodegaPage</h2>
      <p style={{marginTop: 4, opacity: 0.8}}>MS2 → Mongo</p>

      <section style={styles.card}>
        <div style={{display: "flex", justifyContent: "space-between"}}>
          <strong>Estado del backend</strong>
          <button onClick={load} style={styles.secondaryBtn}>Refrescar</button>
        </div>
        <pre style={styles.pre}>
          {health ? JSON.stringify(health, null, 2) : "—"}
        </pre>
      </section>

      <section style={styles.card}>
        <h3 style={{marginTop: 0}}>Crear pedido</h3>

        <form onSubmit={onSubmit} style={styles.form}>
          <label style={styles.label}>
            Nombre del producto
            <input
              style={styles.input}
              type="text"
              required
              value={form.productName}
              placeholder="Ej: Teclado mecánico"
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
            />
          </label>

          <label style={styles.label}>
            Cantidad
            <input
              style={styles.input}
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </label>

          <label style={styles.label}>
            Precio de envío
            <input
              style={styles.input}
              type="number"
              min="0"
              step="0.01"
              required
              value={form.shippingPrice}
              onChange={(e) => setForm({ ...form, shippingPrice: e.target.value })}
            />
          </label>

          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading ? "Guardando..." : "Guardar pedido"}
          </button>
        </form>

        {msg && <div style={{ color: "green", marginTop: 8 }}>{msg}</div>}
        {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
      </section>

      <section style={styles.card}>
        <h3 style={{marginTop: 0}}>Mis pedidos</h3>
        {orders.length === 0 ? (
          <i>No hay pedidos aún.</i>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {orders.map((o) => (
              <div key={o.id} style={styles.orderItem}>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                  <strong>{o.productName}</strong>
                  <small>{new Date(o.createdAt).toLocaleString()}</small>
                </div>
                <div>Cantidad: {o.quantity}</div>
                <div>Envío: {o.shippingPrice}</div>
                <div>Total: {o.totalPrice}</div>
                <div>Usuario: {o.userEmail || o.userId}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  container: { maxWidth: 860, margin: "24px auto", padding: 16, fontFamily: "system-ui, sans-serif" },
  title: { margin: 0 },
  card: { border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginTop: 16 },
  form: { display: "grid", gap: 12, marginTop: 8 },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 },
  primaryBtn: { padding: "10px 14px", borderRadius: 10, border: "none", background: "#111827", color: "white", cursor: "pointer" },
  secondaryBtn: { padding: "6px 10px", borderRadius: 8, border: "1px solid #d1d5db", background: "white", cursor: "pointer" },
  pre: { background: "#f9fafb", padding: 10, borderRadius: 8, overflowX: "auto" },
  orderItem: { border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }
};
