// src/components/Navbar.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { isAuth, logout } = useAuth();

  return (
    <nav style={{ padding: 12, borderBottom: '1px solid #eee' }}>
      <Link to="/" style={{ marginRight: 12 }}>Home</Link>
      {isAuth && <Link to="/bodega" style={{ marginRight: 12 }}>Bodega</Link>}
      {!isAuth ? (
        <>
          <Link to="/login" style={{ marginRight: 12 }}>Login</Link>
          <Link to="/register">Register</Link>
        </>
      ) : (
        <button onClick={logout} style={{ marginLeft: 12 }}>Salir</button>
      )}
    </nav>
  );
}
