import { useState } from "react";
import { register } from "../api/authService";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await register(form);
      alert(res.data.message);
      window.location.href = "/login"; // ir a login
    } catch (err) {
      alert(err.response?.data?.detail || "Error en el registro");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-blue-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-6 w-96"
      >
        <h2 className="text-2xl font-bold text-center mb-4 text-blue-700">Registro</h2>
        <input
          type="text"
          placeholder="Usuario"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full p-2 mb-3 border rounded"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-2 mb-3 border rounded"
        />
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Registrarse
        </button>
      </form>
    </div>
  );
}
