import React from "react";

export default function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <h1>Imporchina</h1>
      <button onClick={onLogout}>Salir</button>
    </nav>
  );
}
