// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { register } from "../api/authService";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const { data } = await register({ username, password }); // <-- desestructura data
      console.log(data.message);
      alert("Usuario registrado correctamente!");
      // redirigir a login si quieres
    } catch (err) {
      if (err.response && err.response.data) {
        // error enviado desde el backend
        console.error(err.response.data.detail);
        alert(`Error: ${err.response.data.detail}`);
      } else {
        // error sin respuesta (servidor no disponible, CORS, etc.)
        console.error("Error sin respuesta del servidor:", err.message || err);
        alert("Error: no se pudo conectar con el servidor");
      }
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
