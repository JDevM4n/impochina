import React, { useState } from "react";
import { login } from "../api/authService";

export default function Login({ onLogin, onShowRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    if (result.access_token) onLogin(result.access_token);
    else alert("Usuario o contraseña incorrecta");
  };

  return (
    <div className="login-container">
      <h1>Bienvenido a Imporchina</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Ingresar</button>
      </form>
      <p>
        ¿No tienes cuenta?{" "}
        <button onClick={onShowRegister} style={{ background: "none", color: "#0052cc", border: "none", cursor: "pointer" }}>
          Regístrate aquí
        </button>
      </p>
    </div>
  );
}
