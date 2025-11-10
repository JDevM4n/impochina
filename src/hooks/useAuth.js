// src/hooks/useAuth.js
import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const t = localStorage.getItem('token');
      if (t) {
        setToken(t);
        try {
          // Decodificar el token para obtener info del usuario
          const payload = JSON.parse(atob(t.split('.')[1]));
          setUser({ username: payload.username });
        } catch (e) {
          console.error('Error decoding token:', e);
          // Si el token es inválido, limpiar
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authApi.login(username, password);
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
      
      // Guardar info del usuario
      try {
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));
        setUser({ username: payload.username });
      } catch (e) {
        console.error('Error decoding token:', e);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (username, password) => {
    try {
      await authApi.register(username, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    isAuth: !!token,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}