// src/api/authService.js
import axios from "axios";

const API_BASE = "http://localhost:8001/auth"; // ajusta si tu backend usa otro puerto o prefijo

export const register = (user) => {
  return axios.post(`${API_BASE}/register`, user);
};

export const login = (user) => {
  return axios.post(`${API_BASE}/login`, user);
};

