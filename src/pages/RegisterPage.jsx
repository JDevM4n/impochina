// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { register } from "../api/authService";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await register({ username, password });
      const data = resp?.data || {};
      alert(data.message || "Usuario registrado correctamente");
      navigate("/login");
    } catch (err) {
      if (err.response && err.response.data) {
        alert(err.response.data.detail || err.response.data.message || "Error en registro");
      } else {
        alert("No se pudo conectar con el servidor.");
        console.error("Register error:", err);
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
        <form className="auth-box" onSubmit={handleRegister}>
          <h2>Crea tu cuenta</h2>

          <div className="input-group">
            <span className="icon">👤</span>
            <input
              type="text"
              placeholder="Escoge un usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <span className="icon">🔒</span>
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Registrando..." : "Register"}
          </button>

          <p style={{ marginTop: 12, color: "white" }}>
           Ya tienes cuenta? <Link to="/login" style={{ color: "#0b63ff", fontWeight: "600" }}>Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
