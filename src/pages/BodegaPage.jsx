import React, { useState, useEffect } from "react";
import "../styles/Bodega.css";

function BodegaPage() {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [peso, setPeso] = useState("");
  const [costo, setCosto] = useState(null);
  const usuario = "usuario_auth_demo"; // 👈 este vendrá del microservicio Auth

  // Traer productos pendientes desde el backend
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const res = await fetch(`http://localhost:8002/warehouse/pending-orders/${usuario}`);
        const data = await res.json();
        setProductos(data.pedidos || []);
      } catch (error) {
        console.error("Error al cargar pedidos:", error);
      }
    };
    fetchPedidos();
  }, []);

  // Calcular costo
  const calcularEnvio = async () => {
    if (!peso) {
      alert("Ingresa el peso del paquete");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:8002/warehouse/calculate-shipping?weight=${peso}`
      );
      const data = await res.json();
      setCosto(data.price);
    } catch (error) {
      console.error("Error al calcular el envío:", error);
    }
  };

  // Enviar pedido
  const enviarPedido = async () => {
    if (!productoSeleccionado) {
      alert("Selecciona un producto");
      return;
    }

    const pedido = {
      usuario: usuario,
      producto: productoSeleccionado.producto,
      direccion: "Calle Falsa 123",
      imagen: productoSeleccionado.imagen,
      peso: productoSeleccionado.peso,
      costo_envio: costo || 0,
    };

    try {
      const res = await fetch("http://localhost:8002/warehouse/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido),
      });
      const data = await res.json();
      alert(`✅ Pedido creado: ${data.pedido.producto}`);
    } catch (error) {
      console.error("Error al enviar pedido:", error);
    }
  };

  return (
    <div className="bodega-container">
      <header className="bodega-header">
        <h1>📦 Mi Bodega</h1>
        <a href="/HomePage">🏠 Volver al Pagina Inicial</a>
      </header>

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
                <img src={prod.imagen} alt={prod.producto} />
                <h3>{prod.producto}</h3>
                <p>Peso: {prod.peso} kg</p>
              </div>
            ))
          ) : (
            <p>No tienes productos en la bodega</p>
          )}
        </div>
      </section>

      <section className="bodega-calculadora">
        <h2>Calculadora de envío</h2>
        <input
          type="number"
          placeholder="Peso en kg"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
        />
        <button onClick={calcularEnvio}>Calcular costo</button>
        {costo !== null && (
          <p>💰 Costo: <strong>${costo.toFixed(2)}</strong></p>
        )}
      </section>

      <div className="acciones">
        <button disabled={!productoSeleccionado} onClick={enviarPedido}>
          🚀 Enviar ahora
        </button>
        <button>🛒 Esperar más compras</button>
      </div>
    </div>
  );
}

export default BodegaPage;



