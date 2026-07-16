import { useState, useEffect, useRef } from "react";
import { LogOut, Clock, User, Bell, X, Bot, Workflow, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "../../core/workspace/WorkspaceContext";
import { getSession, logoutUser } from "../../services/authService";
import { endSessionTracking, getSessionDuration } from "../../services/sessionService";
import { supabase } from "../../core/database/supabase";

const MAX_NOTIFICATIONS = 20;

function formatNotiTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNotiIcon(action) {
  if (action?.includes("agent")) return Bot;
  if (action?.includes("workflow")) return Workflow;
  if (action?.includes("session")) return User;
  return Zap;
}

function getNotiColor(action) {
  if (action?.includes("agent")) return "var(--primary)";
  if (action?.includes("workflow")) return "var(--green)";
  if (action?.includes("session")) return "#f59e0b";
  return "var(--text-muted)";
}

function formatNotiText(log) {
  const action = log.action || "";
  const meta = log.metadata || {};
  if (action === "agent_run") return `Agent "${meta.agent_name || "Unknown"}" finished running`;
  if (action === "orchestrator_run") return `Command executed: ${(meta.prompt || "").slice(0, 50)}`;
  if (action === "session_start") return `New session started`;
  if (action === "session_end") return `Session ended — ${meta.duration_minutes || 0}m`;
  if (action === "workflow_run") return `Workflow completed`;
  return action.replace(/_/g, " ");
}

export default function Topbar() {
  const { workspace } = useWorkspace();
  const session = getSession();
  const username = session?.user?.username || session?.username || "User";
  const [duration, setDuration] = useState(getSessionDuration());

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => setDuration(getSessionDuration()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Supabase Realtime subscription + initial load
  useEffect(() => {
    // Load last 10 notifications on mount
    supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data?.length) setNotifications(data);
      });

    // Subscribe to new inserts
    const channel = supabase
      .channel("nexus-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        (payload) => {
          const newLog = payload.new;
          setNotifications((prev) => [newLog, ...prev].slice(0, MAX_NOTIFICATIONS));
          setUnread((n) => n + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Close bell dropdown on outside click
  useEffect(() => {
    function onOutsideClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  function openBell() {
    setBellOpen((o) => !o);
    setUnread(0);
  }

  function clearAll() {
    setNotifications([]);
    setBellOpen(false);
  }

  function handleLogout() {
    endSessionTracking();
    logoutUser();
    window.location.href = "/";
  }

  return (
    <header className="topbar">
      <div className="workspace-badge">
        <span>Current Workspace</span>
        <strong>{workspace.name}</strong>
      </div>

      <div className="topbar-right">
        <span className="topbar-status">● System Live</span>

        <div className="topbar-session">
          <Clock size={13} />
          <span>{duration}</span>
        </div>

        <div className="topbar-user">
          <User size={13} />
          <span>{username}</span>
        </div>

        {/* Notification bell */}
        <div className="topbar-bell-wrap" ref={bellRef}>
          <button
            className="topbar-bell-btn"
            onClick={openBell}
            title="Notifications"
          >
            <Bell size={15} />
            <AnimatePresence>
              {unread > 0 && (
                <motion.span
                  className="bell-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  {unread > 9 ? "9+" : unread}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {bellOpen && (
              <motion.div
                className="bell-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="bell-header">
                  <h4>Notifications</h4>
                  {notifications.length > 0 && (
                    <button className="bell-clear" onClick={clearAll}>
                      Clear all
                    </button>
                  )}
                </div>

                <div className="bell-list">
                  {notifications.length === 0 ? (
                    <div className="bell-empty">
                      <Bell size={24} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
                      <p>No notifications yet</p>
                      <span>Agent runs, workflow completions, and sessions appear here in real time.</span>
                    </div>
                  ) : (
                    notifications.map((log, i) => {
                      const Icon = getNotiIcon(log.action);
                      const color = getNotiColor(log.action);
                      return (
                        <div key={log.id || i} className="bell-item">
                          <div
                            className="bell-item-icon"
                            style={{ background: `${color}18`, color }}
                          >
                            <Icon size={14} />
                          </div>
                          <div className="bell-item-body">
                            <p>{formatNotiText(log)}</p>
                            <span>{formatNotiTime(log.created_at)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="topbar-logout" onClick={handleLogout} title="Log out">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
