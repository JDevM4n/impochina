import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/Auth.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    // Expresión regular: mínimo 8 caracteres, una mayúscula y un número
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

    if (!username.trim() || !password.trim()) {
      setStatus({
        type: "error",
        message: "Por favor completa todos los campos.",
      });
      return;
    }

    if (!passwordRegex.test(password)) {
      setStatus({
        type: "error",
        message:
          "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.",
      });
      return;
    }

    setLoading(true);
    try {
      await register(username, password);
      setStatus({
        type: "success",
        message: "✅ Usuario creado exitosamente. Ahora puedes iniciar sesión.",
      });
      setUsername("");
      setPassword("");
    } catch (e) {
      setStatus({
        type: "error",
        message: e.message || "❌ Error al crear la cuenta. Intenta nuevamente.",
      });
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

          {/* Mensajes de estado */}
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
                aria-label="Usuario"
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
                aria-label="Contraseña"
                disabled={loading}
              />
            </div>

            {/* Pista visual de la contraseña */}
            <div className="password-hint">
              <small>🔐 Debe tener mínimo 8 caracteres, una mayúscula y un número.</small>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
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

          {/* Ayuda contextual */}
          <div className="help-text">
            <p>💡 Usa una contraseña segura y recuerda no compartir tus credenciales.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
