import { useState } from "react";
import {
  loginUser,
  registerUser,
  saveSession
} from "../services/authService";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("Processing...");

    try {
      const result =
        mode === "login"
          ? await loginUser(username, password)
          : await registerUser(username, password);

      if (!result.success) {
        setMessage(result.message || "Request failed.");
        return;
      }

      saveSession(result);
      setMessage("Success. Redirecting...");
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      setMessage("Auth failed. Check console.");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Fractal AI</h1>
        <p className="muted">
          {mode === "login" ? "Login to continue." : "Create a new account."}
        </p>

        <form onSubmit={handleSubmit} className="form-grid">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="primary-btn" type="submit">
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <button
          className="secondary-btn"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setMessage("");
          }}
        >
          {mode === "login"
            ? "Need an account? Register"
            : "Already have an account? Login"}
        </button>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}
