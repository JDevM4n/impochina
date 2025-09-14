import React from "react";

export default function Navbar({ username, onLogout }) {
  return (
    <nav className="bg-blue-700 text-white p-4 flex justify-between">
      <span className="font-bold text-lg">ImporChina</span>
      <div>
        <span className="mr-4">{username}</span>
        <button
          onClick={onLogout}
          className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
