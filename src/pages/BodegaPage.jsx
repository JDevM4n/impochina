// src/pages/BodegaPage.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as ordersApi from '../api/Service2';

export default function BodegaPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [f, setF] = useState({ productName: 'Teclado', quantity: 2, shippingPrice: 15000 });
  const [msg, setMsg] = useState('');

  const load = async () => {
    setMsg('');
    try {
      const data = await ordersApi.getMyOrders(token);
      setOrders(data || []);
    } catch (e) {
      setMsg(e.message);
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const create = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await ordersApi.createOrder(token, f);
      await load();
      setMsg('Pedido creado.');
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Mis pedidos</h2>
      {msg && <p>{msg}</p>}

      <form onSubmit={create} style={{ marginBottom: 16 }}>
        <input value={f.productName} onChange={e=>setF({...f, productName:e.target.value})} placeholder="Producto" />
        <input type="number" value={f.quantity} onChange={e=>setF({...f, quantity:Number(e.target.value)})} placeholder="Cantidad" />
        <input type="number" value={f.shippingPrice} onChange={e=>setF({...f, shippingPrice:Number(e.target.value)})} placeholder="Envío" />
        <button type="submit">Crear pedido</button>
      </form>

      <ul>
        {orders.map(o => (
          <li key={o._id || JSON.stringify(o)}>{o.productName} x{o.quantity} – envío {o.shippingPrice}</li>
        ))}
      </ul>
    </div>
  );
}
