import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import BodegaPage from "./pages/BodegaPage";   // si ya lo tienes
import LoginPage from "./pages/LoginPage";     // opcional
import RegisterPage from "./pages/RegisterPage";// opcional
import { AuthProvider } from "./hooks/useAuth";

// 👉 importa el CSS global de la home (y estilos base si tienes)
import "./styles/Home.css";
import "./styles/Bodega.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/bodega" element={<BodegaPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
