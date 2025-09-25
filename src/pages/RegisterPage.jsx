// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [msg, setMsg] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await register(username, password);
      setMsg('Usuario creado, ahora inicia sesión.');
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Registro</h2>
      {msg && <p>{msg}</p>}
      <form onSubmit={onSubmit}>
        <div><input value={username} onChange={e=>setU(e.target.value)} placeholder="usuario" /></div>
        <div><input type="password" value={password} onChange={e=>setP(e.target.value)} placeholder="contraseña" /></div>
        <button type="submit">Crear</button>
      </form>
    </div>
  );
}
