import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, ArrowRight, Sparkles, Shield, Zap, Brain, Bot } from "lucide-react";
import {
  loginUser,
  registerUser,
  saveSession
} from "../services/authService";

const FEATURES = [
  { icon: Bot, label: "AI Agents", desc: "Run specialized AI agents with persistent memory" },
  { icon: Zap, label: "Workflows", desc: "Chain agents into automated pipelines" },
  { icon: Brain, label: "Knowledge", desc: "Smart context injected into every conversation" },
  { icon: Shield, label: "Enterprise", desc: "Role-based access with session tracking" }
];

function FloatingOrbs() {
  return (
    <div className="auth-orbs-container">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="auth-floating-orb"
          style={{
            width: 100 + i * 60,
            height: 100 + i * 60,
            left: `${10 + i * 15}%`,
            top: `${15 + (i % 3) * 25}%`
          }}
          animate={{
            x: [0, 30 - i * 10, -20 + i * 5, 0],
            y: [0, -20 + i * 8, 25 - i * 6, 0],
            scale: [1, 1.05, 0.95, 1]
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

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
      <FloatingOrbs />
      <div className="auth-bg-grid" />

      <div className="auth-layout">
        <motion.div
          className="auth-left"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="auth-orb"
            animate={{
              boxShadow: [
                "0 0 40px rgba(139,92,246,0.3), 0 0 80px rgba(139,92,246,0.1)",
                "0 0 60px rgba(139,92,246,0.5), 0 0 120px rgba(139,92,246,0.15)",
                "0 0 40px rgba(139,92,246,0.3), 0 0 80px rgba(139,92,246,0.1)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={28} />
          </motion.div>

          <motion.h1
            className="auth-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Fractal AI
          </motion.h1>

          <motion.p
            className="auth-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            AI Operating System
          </motion.p>

          <motion.p
            className="auth-hero-desc"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            One platform to orchestrate AI agents, automate workflows,
            distribute content, and run your entire operation.
          </motion.p>

          <motion.div
            className="auth-features"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } }
            }}
          >
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.label}
                  className="auth-feature"
                  variants={{
                    hidden: { opacity: 0, x: -16 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
                  }}
                >
                  <div className="auth-feature-icon"><Icon size={16} /></div>
                  <div>
                    <strong>{feat.label}</strong>
                    <span>{feat.desc}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        <motion.div
          className="auth-right"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              className="auth-card"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="auth-card-header">
                <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
                <p>{mode === "login" ? "Sign in to your workspace" : "Set up your Fractal identity"}</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                <motion.div
                  className="auth-field"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
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
                </motion.div>

                <motion.div
                  className="auth-field"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                >
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
                </motion.div>

                <motion.button
                  className="auth-submit"
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <span>{loading ? "Authenticating..." : mode === "login" ? "Sign In" : "Create Account"}</span>
                  {!loading && <ArrowRight size={16} />}
                  {loading && <div className="auth-spinner" />}
                </motion.button>
              </form>

              <AnimatePresence>
                {message && (
                  <motion.div
                    className={message.includes("failed") || message.includes("Failed") ? "auth-message error" : "auth-message success"}
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="auth-divider"><span>or</span></div>

              <motion.button
                className="auth-switch"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setMessage("");
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {mode === "login"
                  ? "Don't have an account? Create one"
                  : "Already have an account? Sign in"}
              </motion.button>
            </motion.div>
          </AnimatePresence>

          <motion.p
            className="auth-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Secured by Supabase &middot; End-to-end encrypted
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
