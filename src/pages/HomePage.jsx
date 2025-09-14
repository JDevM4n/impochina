import React from "react";
import Navbar from "../components/Navbar";

export default function HomePage() {
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/login";
  };

  return (
    <div>
      <Navbar username={username} onLogout={handleLogout} />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-blue-700">Bienvenido, {username}</h1>
        <p className="mt-4">Aquí irá la página principal del proyecto.</p>
      </div>
    </div>
  );
}
