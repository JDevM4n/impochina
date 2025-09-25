// src/api/apiService.js
const AUTH_BASE = 'http://localhost:8001';
const ORDERS_BASE = 'http://localhost:8000';

export function getAuthBase()   { return AUTH_BASE; }
export function getOrdersBase() { return ORDERS_BASE; }

export async function apiFetch(base, path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // intenta parsear JSON siempre (FastAPI responde JSON hasta en error)
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.detail || data?.message || res.statusText;
    throw new Error(msg || 'Request failed');
  }
  return data;
}
