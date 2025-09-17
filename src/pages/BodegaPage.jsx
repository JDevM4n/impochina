import React, { useState, useEffect } from "react";
import { getPendingOrders, calculateShipping, createOrder } from "../api/Service2";

function BodegaPage() {
  const [usuario] = useState("usuario_demo"); // en producción debería venir del login
  const [pedidos, setPedidos] = useState([]);
  const [peso, setPeso] = useState("");
  const [precio, setPrecio] = useState(null);
  const [producto, setProducto] = useState("");
  const [direccion, setDireccion] = useState("");
  const [imagen, setImagen] = useState("");

  // 🔹 Cargar pedidos pendientes al iniciar
  useEffect(() => {
    getPendingOrders(usuario).then((data) => setPedidos(data.pedidos || []));
  }, [usuario]);

  // 🔹 Calcular envío
  const handleCalcular = async () => {
    if (!peso) {
      alert("Por favor ingresa el peso");
      return;
    }
    const data = await calculateShipping(peso);
    setPrecio(data.price);
  };

  // 🔹 Crear pedido
  const handleCrearPedido = async () => {
    if (!producto || !direccion || !peso) {
      alert("Completa todos los campos");
      return;
    }

    const pedido = {
      usuario,
      producto,
      direccion,
      imagen,
      peso: parseFloat(peso),
      costo_envio: precio || 0,
    };

    const data = await createOrder(pedido);
    alert(data.mensaje);

    // actualizar lista
    const refreshed = await getPendingOrders(usuario);
    setPedidos(refreshed.pedidos || []);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>📦 Bodega</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>Nuevo pedido</h2>
        <input
          type="text"
          placeholder="Producto"
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
        />
        <br />
        <input
          type="text"
          placeholder="Dirección"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
        />
        <br />
        <input
          type="text"
          placeholder="URL Imagen"
          value={imagen}
          onChange={(e) => setImagen(e.target.value)}
        />
        <br />
        <input
          type="number"
          placeholder="Peso en kg"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
        />
        <br />
        <button onClick={handleCalcular}>Calcular envío</button>
        {precio && <p>💰 Precio estimado: ${precio}</p>}
        <br />
        <button onClick={handleCrearPedido}>Crear pedido</button>
      </div>

      <h2>Pedidos pendientes</h2>
      <ul>
        {pedidos.length > 0 ? (
          pedidos.map((p) => (
            <li key={p.id}>
              {p.producto} - {p.direccion} - {p.peso}kg - ${p.costo_envio}
            </li>
          ))
        ) : (
          <p>No tienes pedidos pendientes</p>
        )}
      </ul>
    </div>
  );
}

export default BodegaPage;
