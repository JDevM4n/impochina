// src/api/Service2.js
import { apiFetch, getOrdersBase } from './apiService';

export async function createOrder(token, { productName, quantity, shippingPrice }) {
  return apiFetch(getOrdersBase(), '/orders', {
    method: 'POST',
    token,
    body: { productName, quantity, shippingPrice },
  });
}

export async function getMyOrders(token) {
  return apiFetch(getOrdersBase(), '/orders/me', { token });
}
