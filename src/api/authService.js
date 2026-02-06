// src/api/authService.js
import { apiFetch, getAuthBase } from './apiService';

export async function register(username, password) {
  return apiFetch(getAuthBase(), '/auth/register', {
    method: 'POST',
    body: { username, password },
  });
}

export async function login(username, password) {
  const data = await apiFetch(getAuthBase(), '/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  // guarda token
  if (data?.access_token) localStorage.setItem('token', data.access_token);
  return data;
}

export function logout() {
  localStorage.removeItem('token');
}
