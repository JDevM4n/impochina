import React, { useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";

export default function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div>
      {!user ? (
        showRegister ? (
          <RegisterPage onRegister={() => setShowRegister(false)} />
        ) : (
          <LoginPage
            onLogin={setUser}
            onRegisterClick={() => setShowRegister(true)}
          />
        )
      ) : (
        <HomePage username={user} />
      )}
    </div>
  );
}
