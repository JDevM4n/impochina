// src/api/ordersService.js
import { apiFetch, getOrdersBase } from './apiService';

export async function createOrder(token, orderData) {
  return apiFetch(getOrdersBase(), '/orders', {
    method: 'POST',
    token,
    body: orderData,
  });
}

export async function getMyOrders(token) {
  return apiFetch(getOrdersBase(), '/orders/me', {
    method: 'GET',
    token,
  });
}