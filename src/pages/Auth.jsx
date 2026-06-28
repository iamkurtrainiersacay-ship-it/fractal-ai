import { useState } from "react";
import { Lock, User, ArrowRight, Sparkles } from "lucide-react";
import {
  loginUser,
  registerUser,
  saveSession
} from "../services/authService";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result =
        mode === "login"
          ? await loginUser(username, password)
          : await registerUser(username, password);

      if (!result.success) {
        setMessage(result.message || "Request failed.");
        setLoading(false);
        return;
      }

      saveSession(result);
      setMessage("Authenticated. Launching Fractal...");
      setTimeout(() => {
        window.location.href = "/";
      }, 600);
    } catch (error) {
      console.error(error);
      setMessage(error?.message || "Authentication failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-grid" />

      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-orb">
            <Sparkles size={28} />
          </div>
          <h1 className="auth-title">Fractal AI</h1>
          <p className="auth-subtitle">AI Operating System</p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
            <p>{mode === "login" ? "Sign in to your workspace" : "Set up your Fractal identity"}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Username</label>
              <div className="auth-input-wrap">
                <User size={16} />
                <input
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <Lock size={16} />
                <input
                  placeholder="Enter password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              <span>{loading ? "Authenticating..." : mode === "login" ? "Sign In" : "Create Account"}</span>
              {!loading && <ArrowRight size={16} />}
              {loading && <div className="auth-spinner" />}
            </button>
          </form>

          {message && (
            <div className={message.includes("failed") ? "auth-message error" : "auth-message success"}>
              {message}
            </div>
          )}

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            className="auth-switch"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setMessage("");
            }}
          >
            {mode === "login"
              ? "Don’t have an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <p className="auth-footer">
          Secured by Supabase &middot; End-to-end encrypted
        </p>
      </div>
    </div>
  );
}
