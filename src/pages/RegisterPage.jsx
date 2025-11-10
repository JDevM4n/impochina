// src/pages/RegisterPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/Auth.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    
    try {
      await register(username, password);
      setMessage("✅ Usuario creado exitosamente. Ahora puedes iniciar sesión.");
      // Limpiar formulario
      setUsername("");
      setPassword("");
    } catch (e) {
      setMessage(e.message || "Error al crear la cuenta");
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
            src="https://cdn-icons-png.flaticon.com/512/747/747376.png"
            alt="Ilustración de registro"
          />
        </div>
        <div className="auth-features">
          <h3>Únete a Impochina</h3>
          <ul>
            <li>🔍 Búsqueda inteligente de productos</li>
            <li>📦 Gestión de bodega personal</li>
            <li>💼 Herramientas para importadores</li>
          </ul>
        </div>
      </div>

      {/* Columna derecha */}
      <div className="auth-right">
        <div className="auth-box">
          <h2>Crear Cuenta</h2>
          <p className="auth-subtitle">Regístrate para comenzar a usar Impochina</p>
          
          {message && (
            <div className={message.startsWith("✅") ? "success-message" : "error-message"}>
              {message}
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
                minLength={3}
              />
            </div>
            
            <button 
              className="register-btn" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/login" className="auth-link">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}