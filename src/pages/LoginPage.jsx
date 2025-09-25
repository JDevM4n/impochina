// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setU] = useState('as');
  const [password, setP] = useState('secret123');
  const [err, setErr] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await login(username, password);
      nav('/bodega');
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Login</h2>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      <form onSubmit={onSubmit}>
        <div><input value={username} onChange={e=>setU(e.target.value)} placeholder="usuario" /></div>
        <div><input type="password" value={password} onChange={e=>setP(e.target.value)} placeholder="contraseña" /></div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
