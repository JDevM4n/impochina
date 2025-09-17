// src/api.js
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const getPendingOrders = (usuario) =>
  fetch(`${API_BASE}/warehouse/pending-orders/${usuario}`).then((res) => res.json());

export const calculateShipping = (peso) =>
  fetch(`${API_BASE}/warehouse/calculate-shipping?weight=${peso}`).then((res) => res.json());

export const createOrder = (pedido) =>
  fetch(`${API_BASE}/warehouse/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido),
  }).then((res) => res.json());
