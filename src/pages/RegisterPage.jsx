// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { register } from "../api/authService";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const data = await register({ username, password });
      console.log(data.message); // Usuario registrado
      alert("Usuario registrado correctamente!");
      // Aquí puedes redirigir al login si quieres
    } catch (err) {
      console.error(err.response.data.detail);
      alert(`Error: ${err.response.data.detail}`);
    }
  };

  return (
    <div>
      <h2>Registro</h2>
      <input
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleRegister}>Registrarse</button>
    </div>
  );
};

export default RegisterPage;
