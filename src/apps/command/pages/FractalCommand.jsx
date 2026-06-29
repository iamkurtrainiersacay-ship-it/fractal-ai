import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
  Brain,
  Terminal
} from "lucide-react";
import { orchestrate } from "../../../services/orchestratorService";
import { FadeIn, StaggerContainer, StaggerItem } from "../../../shared/components/PageTransition";

const SUGGESTIONS = [
  "Create a LinkedIn campaign for VMware renewals",
  "Show me analytics for this week",
  "List all my AI agents and their roles",
  "Add a research SOP to the knowledge base about competitor analysis",
  "Create a new project called Client Portal and set it to active",
  "Run the Sales Agent to draft a cold outreach email for a cybersecurity company",
  "What social posts are scheduled right now?",
  "Create a workflow for lead qualification"
];

function ToolBadge({ name }) {
  const colors = {
    run_agent: "#8b5cf6",
    list_agents: "#6366f1",
    create_agent: "#7c3aed",
    search_knowledge: "#10b981",
    add_knowledge: "#059669",
    create_content_asset: "#38bdf8",
    list_social_posts: "#06b6d4",
    get_analytics: "#f59e0b",
    get_activity: "#d97706",
    create_project: "#ef4444",
    list_projects: "#f87171",
    create_workflow: "#a855f7",
    list_workflows: "#9333ea",
    create_workspace: "#14b8a6",
    list_workspaces: "#2dd4bf"
  };

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      background: `${colors[name] || "#8b5cf6"}18`,
      color: colors[name] || "#8b5cf6",
      border: `1px solid ${colors[name] || "#8b5cf6"}30`,
      borderRadius: "var(--radius-pill)",
      padding: "3px 10px",
      fontSize: "11px",
      fontWeight: 700,
      fontFamily: "monospace"
    }}>
      <Zap size={10} />{name}
    </span>
  );
}

function ResultCard({ step, result, index }) {
  const isError = result.status === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.35 }}
      style={{
        background: "var(--bg-glass)",
        border: `1px solid ${isError ? "rgba(248,113,113,0.2)" : "var(--border)"}`,
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start"
      }}
    >
      <div style={{ paddingTop: "2px" }}>
        {isError
          ? <XCircle size={18} style={{ color: "var(--red)" }} />
          : <CheckCircle2 size={18} style={{ color: "var(--green)" }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
          <ToolBadge name={step.tool} />
          <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{step.reason}</span>
        </div>
        <pre style={{
          background: "var(--bg-inset)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 12px",
          fontSize: "12px",
          lineHeight: "1.5",
          color: "var(--text-secondary)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          margin: 0,
          maxHeight: "200px",
          overflowY: "auto"
        }}>
          {JSON.stringify(result.result, null, 2)}
        </pre>
      </div>
    </motion.div>
  );
}

export default function FractalCommand() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [liveStatus, setLiveStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollTop = resultsRef.current.scrollHeight;
    }
  }, [history, liveStatus]);

  async function handleRun(input) {
    const text = input || prompt;
    if (!text.trim() || running) return;

    setRunning(true);
    setPrompt("");
    setLiveStatus(null);

    const entry = { prompt: text, plan: null, results: [], answer: null, timestamp: Date.now() };
    setHistory(prev => [...prev, entry]);

    try {
      const result = await orchestrate(text, (step) => {
        setLiveStatus(step);
      });

      setHistory(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        last.plan = result.plan;
        last.results = result.results;
        last.steps = result.steps;
        last.answer = result.answer;
        return updated;
      });
    } catch (err) {
      toast.error(err.message || "Command failed.");
      setHistory(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        last.plan = "Command failed";
        last.answer = err.message;
        return updated;
      });
    } finally {
      setRunning(false);
      setLiveStatus(null);
    }
  }

  return (
    <div className="command-page">
      <FadeIn>
        <section className="command-hero">
          <motion.div
            className="command-orb"
            animate={{
              boxShadow: [
                "0 0 30px rgba(139,92,246,0.3), 0 0 60px rgba(139,92,246,0.1)",
                "0 0 50px rgba(139,92,246,0.5), 0 0 100px rgba(139,92,246,0.15)",
                "0 0 30px rgba(139,92,246,0.3), 0 0 60px rgba(139,92,246,0.1)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={28} />
          </motion.div>
          <h1 className="command-title">Fractal Command Center</h1>
          <p className="command-subtitle">
            One prompt. Multiple modules. Tell Fractal what you need and it orchestrates everything.
          </p>
        </section>
      </FadeIn>

      <div className="command-shell" ref={resultsRef}>
        {history.length === 0 && !running && (
          <FadeIn delay={0.2}>
            <div className="command-empty">
              <Brain size={36} style={{ color: "var(--primary)", marginBottom: "12px" }} />
              <h3>What would you like to do?</h3>
              <p>Type a natural language command — Fractal will figure out which tools to use.</p>

              <StaggerContainer className="command-suggestions" stagger={0.04}>
                {SUGGESTIONS.map((s) => (
                  <StaggerItem key={s}>
                    <motion.button
                      className="command-suggestion"
                      onClick={() => handleRun(s)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <ArrowRight size={12} />{s}
                    </motion.button>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </FadeIn>
        )}

        {history.map((entry, hi) => (
          <div key={entry.timestamp} className="command-entry">
            <div className="command-user-msg">
              <Terminal size={14} />
              <span>{entry.prompt}</span>
            </div>

            {entry.plan && (
              <motion.div
                className="command-plan"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Sparkles size={14} />
                <span>{entry.plan}</span>
              </motion.div>
            )}

            {entry.answer && (
              <motion.div
                className="command-answer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {entry.answer}
              </motion.div>
            )}

            {entry.results && entry.results.length > 0 && (
              <div className="command-results">
                {entry.results.map((r, i) => (
                  <ResultCard key={i} step={entry.steps[i]} result={r} index={i} />
                ))}
              </div>
            )}

            {hi < history.length - 1 && <div className="command-divider" />}
          </div>
        ))}

        <AnimatePresence>
          {liveStatus && (
            <motion.div
              className="command-live"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 size={16} className="command-spin" />
              <span>
                {liveStatus.type === "thinking" && liveStatus.message}
                {liveStatus.type === "plan" && `Plan: ${liveStatus.message} (${liveStatus.stepCount} steps)`}
                {liveStatus.type === "executing" && `Step ${liveStatus.index + 1}/${liveStatus.total}: ${liveStatus.tool} — ${liveStatus.reason}`}
                {liveStatus.type === "completed" && `✓ ${liveStatus.tool} completed`}
                {liveStatus.type === "error" && `✗ ${liveStatus.tool}: ${liveStatus.error}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form className="command-input" onSubmit={(e) => { e.preventDefault(); handleRun(); }}>
        <div className="command-input-wrap">
          <Sparkles size={18} className="command-input-icon" />
          <input
            ref={inputRef}
            placeholder="Tell Fractal what to do..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={running}
          />
          <motion.button
            type="submit"
            disabled={!prompt.trim() || running}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {running ? <Loader2 size={18} className="command-spin" /> : <Send size={18} />}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
