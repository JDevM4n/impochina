// src/api/apiService.js

// Helper seguro para leer variables de entorno en CRA o Vite
const readEnv = (key) => {
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key];
  }
  // Vite
  if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    return import.meta.env[key];
  }
  // CRA (evitar ReferenceError si process no existe)
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key];
  }
  return null;
};

export const getAuthBase = () =>
  readEnv('VITE_AUTH_BASE') || readEnv('REACT_APP_AUTH_BASE') || 'http://localhost:8001';

export const getOrdersBase = () =>
  readEnv('VITE_ORDERS_BASE') || readEnv('REACT_APP_ORDERS_BASE') || 'http://localhost:8000';

// fetch con buen manejo de errores
export async function apiFetch(base, path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'omit',
    });
  } catch (e) {
    throw new Error(`Network/CORS error: ${e.message}`);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.detail || data?.message || res.statusText || 'Request failed';
    throw new Error(msg);
  }
  return data;
}
