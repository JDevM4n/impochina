// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { login } from "../api/authService";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // importante
    setLoading(true);
    try {
      const resp = await login({ username, password });
      // axios devuelve el objeto en resp.data
      const data = resp?.data || {};
      // varios backends usan 'access_token' o 'token'
      const token = data.access_token || data.token || data?.accessToken;
      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("username", username);
        navigate("/HomePage"); // o /home según tu app
      } else {
        // si el backend devuelve solo un mensaje de bienvenida
        alert(data.message || "Login exitoso (sin token)");
        navigate("/dashboard");
      }
    } catch (err) {
      // manejo seguro de errores
      if (err.response && err.response.data) {
        alert(err.response.data.detail || err.response.data.message || "Error en login");
      } else {
        alert("No se pudo conectar con el servidor. Revisa que el backend esté corriendo.");
        console.error("Login error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <h2 className="logo">IMPOCHINA</h2>
        <div className="illustration">
          <img src=".//img/logo.png" alt="" />
        </div>
      </div>

      <div className="auth-right">
        <form className="auth-box" onSubmit={handleLogin}>
          <h2>Inicia sesion con tu cuenta</h2>

          <div className="input-group">
            <span className="icon">👤</span>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <span className="icon">🔒</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Entrando..." : "Login"}
          </button>

          {/* Reemplazamos "Forgot password?" por link a registro */}
          <p style={{ marginTop: 12, color: "white" }}>
            No tienes cuenta? <Link to="/register" style={{ color: "#0b63ff", fontWeight: "600" }}>Registrate</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
