import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";

function App() {
  const [token, setToken] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState({ username: "Usuario demo", email: "demo@imporchina.com" });

  const handleLogout = () => setToken(null);

  const handleRegister = (newUser) => {
    setUser(newUser);
    setShowRegister(false);
    alert("Registro exitoso, ahora inicia sesión");
  };

  return (
    <Router>
      {token && <Navbar onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={
          token 
            ? <Dashboard /> 
            : showRegister 
              ? <Register onRegister={handleRegister} /> 
              : <Login onLogin={setToken} onShowRegister={() => setShowRegister(true)} />
        }/>
        <Route path="/profile" element={token ? <Profile user={user} /> : <Login onLogin={setToken} onShowRegister={() => setShowRegister(true)} />} />
      </Routes>
    </Router>
  );
}

export default App;
