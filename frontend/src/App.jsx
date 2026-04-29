import { useState } from "react";
import LoginPage from "./components/LoginPage.jsx";
import Board from "./components/Board.jsx";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const handleAuth = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (token) {
    return <Board onLogout={handleLogout} />;
  }

  return <LoginPage onAuth={handleAuth} />;
}
