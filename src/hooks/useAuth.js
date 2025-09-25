// src/hooks/useAuth.js
import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) setToken(t);
  }, []);

  const login = async (username, password) => {
    const { access_token } = await authApi.login(username, password);
    setToken(access_token);
  };

  const register = async (username, password) => {
    await authApi.register(username, password);
  };

  const logout = () => {
    authApi.logout();
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isAuth: !!token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// si en algún componente usas default import, esto evita errores:
export default useAuth;
