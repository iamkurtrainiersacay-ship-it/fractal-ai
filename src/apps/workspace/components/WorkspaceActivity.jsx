import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Bot, FileText, Workflow, RefreshCw } from "lucide-react";
import { getActivityLogs } from "../../../services/activityService";

function getIcon(action = "") {
  const a = action.toLowerCase();
  if (a.includes("agent")) return Bot;
  if (a.includes("knowledge") || a.includes("file")) return FileText;
  if (a.includes("workflow")) return Workflow;
  return Activity;
}

function getColor(action = "") {
  const a = action.toLowerCase();
  if (a.includes("agent")) return "var(--primary)";
  if (a.includes("workflow")) return "var(--accent)";
  if (a.includes("knowledge")) return "var(--green)";
  return "var(--text-muted)";
}

function relTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function dayLabel(iso) {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function WorkspaceActivity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await getActivityLogs();
      setLogs((data || []).slice(0, 20));
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Group by day
  const grouped = logs.reduce((acc, log) => {
    const label = dayLabel(log.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(log);
    return acc;
  }, {});

  return (
    <section className="workspace-panel wt-panel">
      <div className="wt-header">
        <h2>Activity Timeline</h2>
        <button
          className="secondary-btn"
          onClick={load}
          disabled={loading}
          style={{ padding: "6px 12px", fontSize: "12px" }}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {loading ? (
        <div className="wt-loading">
          <div className="wf-spinner" />
          <span>Loading activity...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="wt-empty">
          <Activity size={24} style={{ color: "var(--text-muted)" }} />
          <p className="muted">No activity yet.</p>
        </div>
      ) : (
        <div className="wt-timeline">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day} className="wt-day-group">
              <div className="wt-day-label">{day}</div>
              {items.map((log, i) => {
                const Icon = getIcon(log.action);
                const color = getColor(log.action);
                const meta = log.metadata || {};
                const label = meta.agent_name || log.action || "Activity";
                const sub = meta.total_tokens
                  ? `${meta.total_tokens.toLocaleString()} tokens · ${meta.estimated_cost != null ? `$${Number(meta.estimated_cost).toFixed(4)}` : ""}`
                  : log.entity_type || "";

                return (
                  <motion.div
                    key={log.id}
                    className="wt-entry"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className="wt-line-col">
                      <div className="wt-dot" style={{ background: color, boxShadow: `0 0 0 3px ${color}20` }}>
                        <Icon size={10} color="white" />
                      </div>
                      {i < items.length - 1 && <div className="wt-connector" />}
                    </div>
                    <div className="wt-content">
                      <div className="wt-content-row">
                        <strong>{label}</strong>
                        <span className="wt-time">{relTime(log.created_at)}</span>
                      </div>
                      {sub && <span className="wt-sub">{sub}</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
