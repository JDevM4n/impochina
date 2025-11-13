import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getMyOrders, createOrder } from "../api/ordersService";
import "../styles/Bodega.css";

export default function BodegaPage() {
  const { token, user } = useAuth();
  const nav = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Formulario
  const [item, setItem] = useState("");
  const [qty, setQty] = useState(1);
  const [shippingPrice, setShippingPrice] = useState(0);

  const money = useMemo(
    () =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }),
    []
  );

  const usd = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }),
    []
  );

  useEffect(() => {
    let cancel = false;
    const loadOrders = async () => {
      if (!token) {
        setMessage({ type: "error", text: "No hay token de autenticación." });
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage({ type: "", text: "" });

      try {
        const list = await getMyOrders(token);
        if (!cancel) setOrders(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancel) {
          setMessage({
            type: "error",
            text: e?.message || "❌ No se pudieron cargar los pedidos.",
          });
          setOrders([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    loadOrders();
    return () => {
      cancel = true;
    };
  }, [token]);

  // Validación de campos antes de crear un pedido manual
  const validate = () => {
    if (!item.trim()) return "El nombre del producto es obligatorio.";
    if (!Number.isFinite(qty) || qty <= 0)
      return "La cantidad debe ser un número entero mayor a 0.";
    if (!Number.isFinite(shippingPrice) || shippingPrice < 0)
      return "El costo de envío no puede ser negativo.";
    return "";
  };

  const onCreate = async (e) => {
    e.preventDefault();
    const validationError = validate();

    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    if (!token) {
      setMessage({ type: "error", text: "No estás autenticado." });
      return;
    }

    // Confirmación antes de crear
    const confirm = window.confirm(
      `¿Deseas agregar el producto "${item}" a tu bodega?`
    );
    if (!confirm) return;

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const created = await createOrder(token, {
        item: item.trim(),
        qty: Number(qty),
        shippingPrice: Number(shippingPrice),
      });

      setOrders((prev) => [created, ...prev]);
      setMessage({
        type: "success",
        text: `✅ "${item}" fue agregado correctamente a tu bodega.`,
      });

      // Limpieza del formulario
      setItem("");
      setQty(1);
      setShippingPrice(0);
    } catch (e) {
      setMessage({
        type: "error",
        text: e?.message || "❌ No se pudo crear el pedido.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const goToHome = () => nav("/home");

  return (
    <div className="bodega-container">
      <header className="bodega-header">
        <div className="brand">
          <span className="logo-dot" />
          <span>Impochina</span>
        </div>
        <div className="header-actions">
          <button className="link" onClick={goToHome}>
            Inicio
          </button>
          <span className="user-info">👋 Hola, {user?.username}</span>
        </div>
      </header>

      <main className="bodega-main">
        <section className="panel">
          <h1 className="panel-title">Mi Bodega</h1>
          <p className="panel-sub">
            Aquí puedes gestionar tus productos importados manualmente.
          </p>

          {message.text && (
            <div className={`status-banner ${message.type}`}>
              {message.text}
            </div>
          )}

          <form className="form-grid" onSubmit={onCreate}>
            <div className="field">
              <label>Producto</label>
              <input
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="Ej. Teclado mecánico"
                maxLength={80}
                disabled={submitting}
              />
              <small className="hint">
                💡 Ingresa el nombre completo del producto.
              </small>
            </div>

            <div className="field small">
              <label>Cantidad</label>
              <input
                type="number"
                min={1}
                step={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                disabled={submitting}
              />
            </div>

            <div className="field small">
              <label>Envío (COP)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={shippingPrice}
                onChange={(e) => setShippingPrice(Number(e.target.value))}
                disabled={submitting}
              />
            </div>

            <div className="actions">
              <button
                className="btn-primary"
                type="submit"
                disabled={submitting || !token}
              >
                {submitting ? "Guardando..." : "Agregar a bodega"}
              </button>
            </div>
          </form>
        </section>

        <section className="list-section">
          <div className="section-title">
            <span className="emoji">📦</span>
            <span>Mis Productos ({orders.length})</span>
          </div>

          {loading ? (
            <div className="skeleton-grid">
              <div className="skeleton card" />
              <div className="skeleton card" />
              <div className="skeleton card" />
            </div>
          ) : orders.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <p>No tienes productos en tu bodega aún.</p>
              <p>Puedes agregarlos manualmente desde el formulario de arriba.</p>
            </div>
          ) : (
            <div className="grid">
              {orders.map((o, idx) => {
                const key = o.id ?? idx;
                const hasScrapedData = o.scrapedData;
                const productName = o.item || o.productName;

                return (
                  <article className={`card ${hasScrapedData ? "scraped" : ""}`} key={key}>
                    <div className="card-head">
                      <strong className="card-title">{productName}</strong>
                      <span className="badge">En bodega</span>
                    </div>

                    {hasScrapedData && o.scrapedData?.image && (
                      <div className="product-image">
                        <img src={o.scrapedData.image} alt={productName} />
                      </div>
                    )}

                    <dl className="meta">
                      <div>
                        <dt>Cantidad</dt>
                        <dd>{o.qty}</dd>
                      </div>
                      <div>
                        <dt>Envío</dt>
                        <dd>{money.format(o.shippingPrice || 0)}</dd>
                      </div>
                      {hasScrapedData && o.scrapedData?.priceUSD && (
                        <div>
                          <dt>Precio USD</dt>
                          <dd>{usd.format(o.scrapedData.priceUSD)}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="card-footer">
                      <small className="created-at">
                        Agregado:{" "}
                        {new Date(o.createdAt).toLocaleDateString("es-CO")}
                      </small>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
