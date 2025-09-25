// src/context/AuthContext.js
import { createContext, useEffect, useMemo, useState } from "react";
import { login as loginApi, register as registerApi } from "../api/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  const login = async (username, password) => {
    const t = await loginApi({ username, password });
    setToken(t);
    return t;
  };

  const register = async (username, password) => {
    return registerApi({ username, password });
  };

  const logout = () => setToken(null);

  const value = useMemo(
    () => ({ token, isAuth: Boolean(token), login, register, logout }),
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
