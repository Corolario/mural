import { useState } from "react";
import api from "../api.js";

export default function RegisterPage({ onAuth, onSwitch }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", { username, password });
      onAuth(res.data.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Mural de Recados</h1>
        <h2>Criar Conta</h2>
        {error && <div className="auth-error">{error}</div>}
        <input
          type="text"
          placeholder="Usuário (mín. 3 caracteres)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Senha (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar Conta"}
        </button>
        <p className="auth-switch">
          Já tem conta?{" "}
          <button type="button" onClick={onSwitch}>
            Fazer login
          </button>
        </p>
      </form>
    </div>
  );
}
