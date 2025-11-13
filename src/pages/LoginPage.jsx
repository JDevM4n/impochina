import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/Auth.css";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!username || !password) {
      setStatus({ type: "error", message: "Por favor, completa todos los campos." });
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      setStatus({ type: "success", message: "Inicio de sesión exitoso. Redirigiendo..." });
      setTimeout(() => nav("/home"), 1200);
    } catch (e) {
      setStatus({
        type: "error",
        message: e.message || "❌ Usuario o contraseña incorrectos. Intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Panel izquierdo */}
      <div className="auth-left">
        <div className="logo">Impochina</div>
        <div className="illustration">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2920/2920323.png"
            alt="Ilustración de login"
          />
        </div>
        <div className="auth-features">
          <h3>Gestiona tus importaciones fácilmente</h3>
          <ul>
            <li>📦 Busca productos en 1688</li>
            <li>🚚 Administra tu bodega</li>
            <li>📊 Supervisa tus pedidos</li>
          </ul>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="auth-right">
        <div className="auth-box">
          <h2>Iniciar Sesión</h2>
          <p className="auth-subtitle">Accede a tu cuenta de Impochina</p>

          {/* Mensaje de estado */}
          {status.message && (
            <div className={`status-banner ${status.type}`}>
              {status.message}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="input-group">
              <span className="icon">👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuario"
                disabled={loading}
                aria-label="Usuario"
              />
            </div>

            <div className="input-group">
              <span className="icon">🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                disabled={loading}
                aria-label="Contraseña"
              />
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Cargando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/register" className="auth-link">
              ¿No tienes cuenta? Regístrate
            </Link>
            <Link to="/recover" className="auth-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Ayuda contextual */}
          <div className="help-text">
            <p>💡 Si tienes problemas para ingresar, verifica tus credenciales o contacta soporte.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
