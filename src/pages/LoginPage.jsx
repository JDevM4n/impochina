import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/Auth.css";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(username, password);
      nav("/home");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="auth-container">
      {/* Columna izquierda */}
      <div className="auth-left">
        <div className="logo">Mi Bodega</div>
        <div className="illustration">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2920/2920323.png"
            alt="illustration"
          />
        </div>
      </div>

      {/* Columna derecha */}
      <div className="auth-right">
        <div className="auth-box">
          <h2>Iniciar Sesión</h2>
          {err && <p style={{ color: "crimson" }}>{err}</p>}
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
            <button className="login-btn" type="submit">
              Entrar
            </button>
          </form>
          <a href="#" className="forgot-link">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>
    </div>
  );
}
