// src/api/Service2.js
import { apiFetch, getOrdersBase } from './apiService';

const ORDERS_BASE = getOrdersBase(); // <- ya no importamos una constante inexistente

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (data?.orders && Array.isArray(data.orders)) return data.orders;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export async function getMyOrders(token) {
  const data = await apiFetch(ORDERS_BASE, '/orders/me', { token });
  return normalizeList(data);
}

export async function createOrder(token, body) {
  const data = await apiFetch(ORDERS_BASE, '/orders', {
    method: 'POST',
    token,
    body,
  });
  // algunos backends devuelven {order: {...}}
  return data?.order ?? data;
}
