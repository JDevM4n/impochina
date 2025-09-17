import React, { useState } from "react";
import "../styles/Bodega.css";

function BodegaPage() {
  const [productos, setProductos] = useState([
    { id: 1, nombre: "Zapatos deportivos", peso: 1.2, imagen: "https://via.placeholder.com/150" },
    { id: 2, nombre: "Bolso de cuero", peso: 0.8, imagen: "https://via.placeholder.com/150" },
    { id: 3, nombre: "Reloj inteligente", peso: 0.3, imagen: "https://via.placeholder.com/150" },
  ]);

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [peso, setPeso] = useState("");
  const [costo, setCosto] = useState(null);

  // Simulación de tarifa: $5 por kilo
  const calcularEnvio = () => {
    if (!peso) {
      alert("Ingresa el peso del paquete");
      return;
    }
    const tarifaPorKg = 5;
    setCosto(peso * tarifaPorKg);
  };

  return (
    <div className="bodega-container">
      {/* Header */}
      <header className="bodega-header">
        <h1>📦 Mi Bodega</h1>
        <a href="/HomePage">🏠 Volver al Pagina Inicial</a>
      </header>

      {/* Lista de productos */}
      <section className="bodega-list">
        <h2>Mis productos almacenados</h2>
        <div className="bodega-grid">
          {productos.length > 0 ? (
            productos.map((prod) => (
              <div
                key={prod.id}
                className={`bodega-card ${
                  productoSeleccionado?.id === prod.id ? "selected" : ""
                }`}
                onClick={() => setProductoSeleccionado(prod)}
              >
                <img src={prod.imagen} alt={prod.nombre} style={{ width: "100%", borderRadius: "8px" }} />
                <h3>{prod.nombre}</h3>
                <p>Peso estimado: {prod.peso} kg</p>
              </div>
            ))
          ) : (
            <p>No tienes productos en la bodega</p>
          )}
        </div>
      </section>

      {/* Calculadora */}
      <section className="bodega-calculadora">
        <h2>Calculadora de envío</h2>
        <p>Ingrese el peso en kg para el calculo del precio de envio de su pedido</p>

        <input
          type="number"
          placeholder="Ingresa el peso en KG"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", marginRight: "10px" }}
        />
        <button onClick={calcularEnvio}>Calcular costo</button>

        {costo !== null && (
          <p>
            💰 El envío cuesta aproximadamente: <strong>${costo.toFixed(2)} USD</strong>
          </p>
        )}
      </section>

      {/* Acciones */}
      <div className="acciones">
        <button disabled={!productoSeleccionado}>🚀 Enviar ahora</button>
        <button>🛒 Esperar más compras</button>
      </div>
    </div>
  );
}

export default BodegaPage;
