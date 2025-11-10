/// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/Auth.css";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    console.log('🔐 Intentando login...', { username });

    try {
      await login(username, password);
      console.log('✅ Login exitoso, redirigiendo a /home');
      nav("/home");
    } catch (e) {
      console.error('❌ Error en login:', e);
      setError(e.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Columna izquierda */}
      <div className="auth-left">
        <div className="logo">Impochina</div>
        <div className="illustration">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2920/2920323.png"
            alt="Ilustración de login"
          />
        </div>
        <div className="auth-features">
          <h3>Gestiona tus importaciones</h3>
          <ul>
            <li>📦 Busca productos en 1688</li>
            <li>🚚 Gestiona tu bodega</li>
            <li>📊 Sigue tus pedidos</li>
          </ul>
        </div>
      </div>

      {/* Columna derecha */}
      <div className="auth-right">
        <div className="auth-box">
          <h2>Iniciar Sesión</h2>
          <p className="auth-subtitle">Accede a tu cuenta de Impochina</p>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="input-group">
              <span className="icon">👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuario"
                required
                disabled={loading}
              />
            </div>
            
            <div className="input-group">
              <span className="icon">🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                disabled={loading}
              />
            </div>
            
            <button 
              className="login-btn" 
              type="submit" 
              disabled={loading}
            >
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
            <a href="#" className="auth-link">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}