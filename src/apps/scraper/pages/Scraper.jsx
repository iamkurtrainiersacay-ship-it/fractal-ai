import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Globe, Play, RefreshCw, Save, ChevronDown, ChevronRight,
  AlertTriangle, ExternalLink, Database, CheckCircle, Clock, XCircle
} from "lucide-react";
import { listRobots, runRobot, listRuns, isMaxunConnected } from "../../../services/maxunService";
import { createKnowledge } from "../../../services/knowledgeService";

function StatusIcon({ status }) {
  if (status === "success" || status === "completed" || status === "finished")
    return <CheckCircle size={14} style={{ color: "var(--green)" }} />;
  if (status === "running" || status === "pending" || status === "in_progress")
    return <Clock size={14} style={{ color: "var(--amber)" }} />;
  if (status === "failed" || status === "error")
    return <XCircle size={14} style={{ color: "#ef4444" }} />;
  return <Clock size={14} style={{ color: "var(--text-muted)" }} />;
}

function RunResult({ run, onSaveToKnowledge }) {
  const [expanded, setExpanded] = useState(false);
  const data = run.capturedData || run.data || run.result || null;
  const dataStr = data ? (typeof data === "string" ? data : JSON.stringify(data, null, 2)) : null;
  const status = run.status || "unknown";

  return (
    <motion.div
      className="scraper-run-card"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="scraper-run-header" onClick={() => dataStr && setExpanded(!expanded)}>
        <StatusIcon status={status} />
        <span className="scraper-run-id">Run #{(run.id || "").toString().slice(-6)}</span>
        <span className="scraper-run-status">{status}</span>
        <span className="scraper-run-time">
          {run.createdAt || run.created_at
            ? new Date(run.createdAt || run.created_at).toLocaleString()
            : "—"}
        </span>
        {dataStr && (
          <button className="scraper-run-expand">
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {expanded && dataStr && (
          <motion.div
            className="scraper-run-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <pre className="scraper-run-data">{dataStr.slice(0, 4000)}</pre>
            <button
              className="primary-btn"
              style={{ marginTop: "10px", fontSize: "12px", padding: "7px 14px" }}
              onClick={() => onSaveToKnowledge(run)}
            >
              <Save size={13} /> Save to Knowledge Base
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RobotCard({ robot, onRun, running }) {
  const [runs, setRuns] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [showRuns, setShowRuns] = useState(false);

  async function toggleRuns() {
    if (!showRuns && runs.length === 0) {
      setLoadingRuns(true);
      try {
        const data = await listRuns(robot.id);
        setRuns(Array.isArray(data) ? data : (data?.runs || data?.data || []));
      } catch {
        setRuns([]);
      } finally {
        setLoadingRuns(false);
      }
    }
    setShowRuns((v) => !v);
  }

  async function saveToKnowledge(run) {
    const data = run.capturedData || run.data || run.result;
    const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    try {
      await createKnowledge({
        title: `${robot.name || robot.id} — Scraped Data`,
        type: "Research",
        content: `Source: Maxun robot "${robot.name || robot.id}"\nRun ID: ${run.id}\nDate: ${run.createdAt || run.created_at || "unknown"}\n\n${content}`,
        tags: ["maxun", "scraped"],
        agent_id: null
      });
      toast.success("Saved to Knowledge Base!");
    } catch (err) {
      toast.error(err.message || "Failed to save.");
    }
  }

  const isRunning = running === robot.id;

  return (
    <motion.div
      className="scraper-robot-card"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="scraper-robot-top">
        <div className="scraper-robot-icon">
          <Globe size={18} style={{ color: "#f97316" }} />
        </div>
        <div className="scraper-robot-info">
          <strong>{robot.name || `Robot ${robot.id}`}</strong>
          {robot.startUrl && (
            <a
              href={robot.startUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="scraper-robot-url"
            >
              {robot.startUrl.replace(/^https?:\/\//, "").slice(0, 40)}
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        <div className="scraper-robot-actions">
          <button
            className="scraper-runs-btn"
            onClick={toggleRuns}
          >
            <Database size={13} />
            {loadingRuns ? "Loading..." : `Runs ${showRuns ? "▲" : "▼"}`}
          </button>
          <motion.button
            className="primary-btn"
            style={{ fontSize: "12px", padding: "7px 12px" }}
            onClick={() => onRun(robot.id)}
            disabled={isRunning}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isRunning ? (
              <><div className="scraper-spin" /> Running...</>
            ) : (
              <><Play size={13} /> Run</>
            )}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showRuns && (
          <motion.div
            className="scraper-runs-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {runs.length === 0 ? (
              <p className="scraper-runs-empty">No runs yet — click Run to start.</p>
            ) : (
              runs.slice(0, 5).map((run) => (
                <RunResult
                  key={run.id}
                  run={run}
                  onSaveToKnowledge={saveToKnowledge}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Scraper() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(null); // null = loading
  const [robots, setRobots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(null); // robotId currently running
  const [error, setError] = useState(null);

  async function checkAndLoad() {
    setLoading(true);
    setError(null);
    try {
      const ok = await isMaxunConnected();
      setConnected(ok);
      if (!ok) return;
      const data = await listRobots();
      setRobots(Array.isArray(data) ? data : (data?.robots || data?.data || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { checkAndLoad(); }, []);

  async function handleRun(robotId) {
    setRunning(robotId);
    try {
      await runRobot(robotId);
      toast.success("Robot started! Expand Runs to see results.");
    } catch (err) {
      toast.error(err.message || "Failed to start robot.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="sd-eyebrow">Maxun Integration</p>
          <h1>Web Scraper</h1>
          <p className="muted">Run your Maxun robots and save scraped data directly to your Knowledge Base.</p>
        </div>
        <button className="secondary-btn" onClick={checkAndLoad} disabled={loading}>
          <RefreshCw size={15} className={loading ? "scraper-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Not configured banner */}
      {connected === false && (
        <motion.div
          className="scraper-setup-banner"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertTriangle size={18} style={{ color: "#f97316", flexShrink: 0 }} />
          <div className="scraper-setup-text">
            <strong>Maxun not connected.</strong>
            <span>
              You need to expose Maxun publicly (ngrok) and add the URL in Integrations.
              <br />
              1. In your terminal: <code>ngrok http 8080</code> (use whatever port Maxun listens on)
              <br />
              2. Copy the https:// URL ngrok gives you.
              <br />
              3. Go to Integrations → Maxun → paste the URL → Connect.
            </span>
          </div>
          <button className="primary-btn" onClick={() => navigate("/integrations")}>
            Go to Integrations →
          </button>
        </motion.div>
      )}

      {/* Error */}
      {error && connected && (
        <div className="scraper-error-banner">
          <XCircle size={16} />
          <span>{error}</span>
          <span className="scraper-error-hint">
            Make sure Maxun is running and CORS is enabled. See setup instructions below.
          </span>
        </div>
      )}

      {/* CORS setup hint */}
      {connected && (
        <div className="scraper-cors-note">
          <strong>CORS tip:</strong> If robots fail to load, add{" "}
          <code>CORS_ORIGIN=https://your-vercel-app.vercel.app</code> to your Maxun Docker environment,
          or run <code>ngrok http 8080 --request-header-add "Access-Control-Allow-Origin: *"</code>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)", padding: "24px 0" }}>
          <div className="scraper-spin" style={{ width: 18, height: 18, border: "2px solid var(--border)", borderTopColor: "#f97316", borderRadius: "50%" }} />
          Connecting to Maxun...
        </div>
      )}

      {/* Robots grid */}
      {!loading && connected && robots.length === 0 && !error && (
        <div className="panel" style={{ textAlign: "center", padding: "48px" }}>
          <Globe size={32} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
          <p className="muted">No robots found in Maxun.</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>
            Create a robot in your Maxun dashboard first, then come back here to run it.
          </p>
        </div>
      )}

      {robots.length > 0 && (
        <div className="scraper-robots-grid">
          <AnimatePresence>
            {robots.map((robot) => (
              <RobotCard
                key={robot.id}
                robot={robot}
                onRun={handleRun}
                running={running}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* About section */}
      <div className="scraper-about-panel">
        <h3>About Maxun Integration</h3>
        <div className="scraper-about-grid">
          <div className="scraper-about-item">
            <strong>What is Maxun?</strong>
            <p>Maxun is an open-source no-code web scraping platform running in your Docker container. You build "robots" in its UI that scrape any website.</p>
          </div>
          <div className="scraper-about-item">
            <strong>How robots work</strong>
            <p>Click Run on a robot to trigger a scrape. Expand the Runs section to see captured data. Use "Save to Knowledge Base" to feed the data to your AI agents.</p>
          </div>
          <div className="scraper-about-item">
            <strong>Localhost setup</strong>
            <p>Since Maxun runs on localhost and Nexus Prime is on Vercel, you need a tunnel. Install ngrok and run <code>ngrok http 8080</code>, then paste the URL in Integrations.</p>
          </div>
          <div className="scraper-about-item">
            <strong>Workflow integration</strong>
            <p>Add a Maxun Scrape step in Workflows to automatically scrape data as part of an AI pipeline. The scrape output gets passed as context to the next agent step.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
