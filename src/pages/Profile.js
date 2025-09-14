import React from "react";

export default function Profile({ user }) {
  return (
    <div className="profile-container">
      <h2>Perfil de usuario</h2>
      <p>Nombre: {user.username}</p>
      <p>Email: {user.email || "No disponible"}</p>
    </div>
  );
}
