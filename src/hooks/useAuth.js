// src/hooks/useAuth.js
import React, { createContext, useContext, useState, useEffect } from "react";

const API_URL = "http://localhost:8001"; // 🔧 cambia si tu backend usa otro puerto
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  useEffect(() => {
    if (token) {
      // podrías hacer un fetch aquí para validar el token si tu API lo permite
      setUser({ username: "usuario" });
    }
  }, [token]);

  const login = async (username, password) => {
    console.log("🔐 Intentando login...");
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Error en login:", errorData);
      throw new Error(errorData.detail || "Credenciales inválidas");
    }

    const data = await response.json();
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    setUser({ username });
    return data;
  };

  const register = async (username, password) => {
    console.log("🧾 Intentando registro...");
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Error en registro:", errorData);
      throw new Error(errorData.detail || "Error al registrar");
    }

    const data = await response.json();
    return data;
  };

  const logout = () => {
    console.log("👋 Cerrando sesión...");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para acceder fácilmente al contexto
export const useAuth = () => useContext(AuthContext);
