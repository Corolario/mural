import { useState } from "react";
import LoginPage from "./components/LoginPage.jsx";
import RegisterPage from "./components/RegisterPage.jsx";
import Board from "./components/Board.jsx";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [page, setPage] = useState("login");

  const handleAuth = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setPage("login");
  };

  if (token) {
    return <Board onLogout={handleLogout} />;
  }

  if (page === "register") {
    return <RegisterPage onAuth={handleAuth} onSwitch={() => setPage("login")} />;
  }

  return <LoginPage onAuth={handleAuth} onSwitch={() => setPage("register")} />;
}
