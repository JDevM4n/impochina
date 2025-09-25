import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "../styles/Auth.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await register(username, password);
      setMsg("✅ Usuario creado, ahora inicia sesión.");
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <div className="auth-container">
      {/* Columna izquierda */}
      <div className="auth-left">
        <div className="logo">Mi Bodega</div>
        <div className="illustration">
          <img
            src="https://cdn-icons-png.flaticon.com/512/747/747376.png"
            alt="register illustration"
          />
        </div>
      </div>

      {/* Columna derecha */}
      <div className="auth-right">
        <div className="auth-box">
          <h2>Registro</h2>
          {msg && <p style={{ color: msg.startsWith("✅") ? "green" : "crimson" }}>{msg}</p>}
          <form onSubmit={onSubmit}>
            <div className="input-group">
              <span className="icon">👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setU(e.target.value)}
                placeholder="Usuario"
              />
            </div>
            <div className="input-group">
              <span className="icon">🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setP(e.target.value)}
                placeholder="Contraseña"
              />
            </div>
            <button className="register-btn" type="submit">
              Crear cuenta
            </button>
          </form>
          <a href="/login" className="login-link">
            ¿Ya tienes cuenta? Inicia sesión
          </a>
        </div>
      </div>
    </div>
  );
}
