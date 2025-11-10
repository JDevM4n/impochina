// src/pages/BodegaPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getMyOrders, createOrder } from '../api/ordersService';
import "../styles/Bodega.css";

export default function BodegaPage() {
  const { token, user } = useAuth();
  const nav = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // form
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
        setError("No hay token de autenticación");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const list = await getMyOrders(token);
        if (!cancel) {
          setOrders(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        if (!cancel) {
          setError(e?.message || "No se pudieron cargar los pedidos.");
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

  const validate = () => {
    if (!item?.trim()) return "El nombre del producto es obligatorio.";
    if (!Number.isFinite(qty) || qty <= 0)
      return "La cantidad debe ser un número entero mayor a 0.";
    if (!Number.isFinite(shippingPrice) || shippingPrice < 0)
      return "El costo de envío no puede ser negativo.";
    return "";
  };

  const onCreate = async (e) => {
    e?.preventDefault?.();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    
    if (!token) {
      setError("No estás autenticado");
      return;
    }

    setError("");
    setSubmitting(true);

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      item: item.trim(),
      qty: Number(qty),
      shippingPrice: Number(shippingPrice),
      _optimistic: true,
    };
    setOrders((prev) => [optimistic, ...prev]);

    try {
      const created = await createOrder(token, {
        item: item.trim(),
        qty: Number(qty),
        shippingPrice: Number(shippingPrice),
      });

      // Reemplaza el temporal por el definitivo
      setOrders((prev) =>
        prev.map((o) =>
          o.id === tempId ? { ...created, _optimistic: false } : o
        )
      );

      // Limpia el formulario
      setItem("");
      setQty(1);
      setShippingPrice(0);
    } catch (e) {
      // Revierte el optimista
      setOrders((prev) => prev.filter((o) => o.id !== tempId));
      setError(e?.message || "No se pudo crear el pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToHome = () => {
    nav("/home");
  };

  const list = Array.isArray(orders) ? orders : [];

  return (
    <div className="bodega-container">
      <header className="bodega-header">
        <div className="brand">
          <span className="logo-dot" />
          <span>Impochina</span>
        </div>
        <div className="header-actions">
          <button className="link" onClick={goToHome}>Inicio</button>
          <span className="user-info">Hola, {user?.username}</span>
        </div>
      </header>

      <main className="bodega-main">
        <section className="panel">
          <h1 className="panel-title">Mi Bodega</h1>
          <p className="panel-sub">Gestiona tus productos importados.</p>

          {error && (
            <div className="error">
              {typeof error === 'object' ? JSON.stringify(error) : error}
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
                {submitting ? "Creando..." : "Crear pedido"}
              </button>
            </div>
          </form>
        </section>

        <section className="list-section">
          <div className="section-title">
            <span className="emoji">📦</span>
            <span>Mis Productos ({list.length})</span>
          </div>

          {loading ? (
            <div className="skeleton-grid">
              <div className="skeleton card" />
              <div className="skeleton card" />
              <div className="skeleton card" />
            </div>
          ) : list.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <p>Aún no tienes productos en tu bodega.</p>
              <p>Agrega productos desde la búsqueda o crea uno manualmente arriba.</p>
            </div>
          ) : (
            <div className="grid">
              {list.map((o, idx) => {
                const key = o.id ?? o._id ?? `${o.item}-${o.qty}-${idx}`;
                const hasScrapedData = o.scrapedData;
                const productName = o.item || o.productName;
                
                return (
                  <article className={`card ${o._optimistic ? "optimistic" : ""} ${hasScrapedData ? "scraped-product" : ""}`} key={key}>
                    <div className="card-head">
                      <strong className="card-title">
                        {productName}
                      </strong>
                      <div className="badges">
                        {hasScrapedData && <span className="badge scraped">🔄 Scrapeado</span>}
                        <span className="badge status">
                          {o._optimistic ? "Guardando..." : "En bodega"}
                        </span>
                      </div>
                    </div>

                    {/* Imagen del producto si existe */}
                    {hasScrapedData && o.scrapedData?.image && (
                      <div className="product-image">
                        <img 
                          src={o.scrapedData.image} 
                          alt={productName}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <dl className="meta">
                      <div>
                        <dt>Cantidad</dt>
                        <dd>{o.qty || o.quantity}</dd>
                      </div>
                      <div>
                        <dt>Envío</dt>
                        <dd>{money.format(o.shippingPrice || 0)}</dd>
                      </div>
                      
                      {/* Precios del producto scrapeado */}
                      {hasScrapedData && o.scrapedData?.priceUSD && (
                        <div>
                          <dt>Precio Producto</dt>
                          <dd className="price-usd">{usd.format(o.scrapedData.priceUSD)}</dd>
                        </div>
                      )}
                      
                      {hasScrapedData && o.scrapedData?.priceCNY && (
                        <div>
                          <dt>Precio Original</dt>
                          <dd className="price-cny">{o.scrapedData.priceCNY} CNY</dd>
                        </div>
                      )}

                      {/* Total */}
                      <div className="total-price">
                        <dt>Total Aprox.</dt>
                        <dd>
                          {money.format(
                            (o.shippingPrice || 0) + 
                            (hasScrapedData && o.scrapedData?.priceUSD ? 
                             o.scrapedData.priceUSD * 4000 * (o.qty || o.quantity) : 0)
                          )}
                        </dd>
                      </div>

                      {/* URL original */}
                      {hasScrapedData && o.scrapedData?.originalUrl && (
                        <div className="full-width">
                          <dt>Enlace Original</dt>
                          <dd>
                            <a 
                              href={o.scrapedData.originalUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="url-link"
                            >
                              🔗 Ver en tienda original
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>

                    {/* Título original en chino */}
                    {hasScrapedData && o.scrapedData?.originalTitle && o.scrapedData.originalTitle !== productName && (
                      <div className="original-title">
                        <small>
                          <strong>Original:</strong> {o.scrapedData.originalTitle}
                        </small>
                      </div>
                    )}

                    {/* Fecha de creación */}
                    <div className="card-footer">
                      <small className="created-at">
                        Agregado: {new Date(o.createdAt).toLocaleDateString('es-CO')}
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