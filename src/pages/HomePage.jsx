// src/pages/HomePage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/Home.css";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const { logout } = useAuth();
  const nav = useNavigate();

  const buscar = (e) => {
    e.preventDefault();
    // TODO: tu lógica de búsqueda
    // console.log("Buscar:", url);
  };

  const onLogout = async () => {
    try {
      await logout?.();
    } finally {
      nav("/login");
    }
  };

  return (
    <>
      {/* Navbar */}
      <header className="navbar">
        <div className="brand">
          <span className="logo-dot" /> Impochina
        </div>
        <nav className="nav-actions">
          <a className="nav-link" href="/bodega">Bodega</a>
          <button className="btn-outline" onClick={onLogout}>
            Cerrar sesión
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Encuentra tus productos de 1688 fácilmente</h1>
          <p className="lead">
            Pega el enlace del producto y nosotros lo buscamos por ti.
          </p>

          <form className="search" onSubmit={buscar}>
            <input
              type="url"
              placeholder="Pega aquí el enlace del producto (ej. https://1688.com/item/...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button className="btn-primary" type="submit">
              Buscar Producto
            </button>
          </form>
        </div>
      </section>

      {/* Inventario de Bodega */}
      <section className="section">
        <div className="section-title">
          <span className="emoji">📦</span>
          <span>Inventario de Bodega</span>
        </div>
        <p className="empty">No hay productos en la bodega.</p>

        {/* Ejemplo futuro:
        <div className="inventory">
          {items.map(p => (
            <article className="card" key={p.id}>
              <strong>{p.nombre}</strong>
              <div className="muted">{p.descripcion}</div>
            </article>
          ))}
        </div> */}
      </section>

      {/* Beneficios */}
      <section className="features">
        <div className="feature">
          <span className="dot fast" />
          <strong>Búsqueda rápida</strong>
        </div>
        <div className="feature">
          <span className="dot ok" />
          <strong>Resultados confiables</strong>
        </div>
        <div className="feature">
          <span className="dot world" />
          <strong>Todo en un solo lugar</strong>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        © 2025 Impochina — Todos los derechos reservados
      </footer>
    </>
  );
}
