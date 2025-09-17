import React, { useState, useEffect } from "react";
import "../styles/Home.css";

function HomePage() {
  const [link, setLink] = useState("");
  const [bodega, setBodega] = useState([]);
  const [loading, setLoading] = useState(false);

  // Simulación de traer datos desde el Microservicio 2
  useEffect(() => {
    const fetchBodega = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5002/bodega"); 
        // 👆 Aquí va la ruta real del microservicio 2
        const data = await response.json();
        setBodega(data);
      } catch (error) {
        console.error("Error al traer bodega:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBodega();
  }, []);

  const handleSearch = () => {
    if (!link) {
      alert("Por favor pega un enlace válido");
      return;
    }
    console.log("Buscando producto con link:", link);
    // Aquí iría la conexión al backend/microservicio 1
  };

  const handleDeleteProfile = () => {
    if (window.confirm("¿Seguro que deseas eliminar tu perfil?")) {
      console.log("Perfil eliminado");
      // Aquí se llama al microservicio para borrar usuario
    }
  };

  return (
    <div className="home-container">
      {/* Header con menú */}
      <header className="home-header">
        <h1>Impochina</h1>
        <nav className="menu">
          <a href="#pedidos">Historial de compra</a>
          <a href="/BodegaPage">Bodega</a>
          <a href="#perfil">Perfil</a>
          <button onClick={handleDeleteProfile} className="delete-btn">
            Eliminar Perfil
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="home-hero">
        <h2>Encuentra tus productos de 1688 fácilmente</h2>
        <p>Pega el enlace del producto y nosotros lo buscamos por ti.</p>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Pega aquí el enlace del producto (ej. https://1688.com/item/...)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <button onClick={handleSearch}>Buscar Producto</button>
        </div>
      </section>

      {/* Sección Microservicio 2 - Bodega */}
      <section id="ms2" className="bodega-section">
        <h2>📦 Inventario de Bodega</h2>
        {loading ? (
          <p>Cargando bodega...</p>
        ) : (
          <div className="bodega-list">
            {bodega.length > 0 ? (
              bodega.map((item, index) => (
                <div key={index} className="bodega-card">
                  <h3>{item.nombre}</h3>
                  <p>Cantidad: {item.cantidad}</p>
                  <p>Precio: ${item.precio}</p>
                </div>
              ))
            ) : (
              <p>No hay productos en la bodega.</p>
            )}
          </div>
        )}
      </section>

      {/* Beneficios */}
      <section className="benefits">
        <div className="card">⚡ Búsqueda rápida</div>
        <div className="card">✅ Resultados confiables</div>
        <div className="card">🌎 Todo en un solo lugar</div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2025 Impochina - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}

export default HomePage;
