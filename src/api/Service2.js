const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

/**
 * Obtiene headers de autenticación:
 * - Si existe localStorage.authToken => Authorization: Bearer ...
 * - Si no, usa headers de DEV para pasar el usuario (X-User-Id / X-User-Email)
 */
function authHeaders() {
  const token = localStorage.getItem("authToken");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    // Modo dev: deben coincidir con lo que acepta tu back
    headers["X-User-Id"] = "dev-user-123";
    headers["X-User-Email"] = "dev@example.com";
  }
  return headers;
}

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function createOrder(payload) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Error ${res.status}`);
  }
  return res.json();
}

export async function getMyOrders() {
  const res = await fetch(`${API_BASE}/orders/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Error ${res.status}`);
  }
  return res.json();
}
