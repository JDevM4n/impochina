import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/Navbar.css";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        {/* Brand */}
        <div className="brand">
          <span className="logo-dot" />
          <span>Impochina</span>
        </div>

        {/* Links */}
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <Link to="/orders" className="nav-link">
                Historial de compra
              </Link>
              <Link to="/bodega" className="nav-link">
                Bodega
              </Link>
              <Link to="/perfil" className="nav-link">
                Perfil
              </Link>
                <Link to="/dashboard">Dashboard</Link> 
              <button className="btn-logout" onClick={handleLogout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Iniciar sesión
              </Link>
              <Link to="/register" className="nav-link">
                Crear cuenta
              </Link>
              <Link to="/home" className="nav-link">
                Pagina Principal
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
