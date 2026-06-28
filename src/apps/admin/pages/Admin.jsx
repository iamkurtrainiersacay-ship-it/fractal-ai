import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Shield,
  ShieldCheck,
  Trash2,
  Users,
  Clock,
  Circle,
  RefreshCw,
  Crown
} from "lucide-react";
import { getUsers, deleteUser, toggleSuperAdmin } from "../../../services/adminService";
import { getSession } from "../../../services/authService";
import { getActivityLogs } from "../../../services/activityService";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("users");

  const currentSession = getSession();
  const currentUserId = currentSession?.user?.id || currentSession?.id;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [userData, logData] = await Promise.all([
        getUsers(),
        getActivityLogs()
      ]);
      setUsers(userData || []);

      const sessionLogs = (logData || []).filter(
        (l) => l.action === "session_start" || l.action === "session_end"
      );
      setSessions(sessionLogs.slice(0, 50));
    } catch (err) {
      toast.error("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(user) {
    if (user.id === currentUserId) {
      toast.error("You can't delete your own account.");
      return;
    }
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;

    try {
      await deleteUser(user.id);
      toast.success(`User "${user.username}" deleted.`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete user.");
    }
  }

  async function handleToggleAdmin(user) {
    if (user.id === currentUserId) {
      toast.error("You can't change your own admin status.");
      return;
    }

    try {
      const newStatus = !user.is_super_admin;
      await toggleSuperAdmin(user.id, newStatus);
      toast.success(`${user.username} is ${newStatus ? "now" : "no longer"} a super admin.`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to update admin status.");
    }
  }

  function timeSince(timestamp) {
    if (!timestamp) return "Never";
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function getSessionStats() {
    const starts = sessions.filter((s) => s.action === "session_start");
    const ends = sessions.filter((s) => s.action === "session_end");

    const today = new Date().toDateString();
    const todaySessions = starts.filter(
      (s) => new Date(s.created_at).toDateString() === today
    ).length;

    const totalMinutes = ends.reduce(
      (sum, s) => sum + (s.metadata?.duration_minutes || 0), 0
    );

    return { todaySessions, totalMinutes, totalSessions: starts.length };
  }

  const stats = getSessionStats();
  const onlineCount = users.filter((u) => u.is_online).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Super Admin</h1>
        <p>Manage users, monitor sessions, and control platform access.</p>
      </div>

      <section className="analytics-summary" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="analytics-summary-card">
          <span>Total Users</span>
          <strong>{users.length}</strong>
        </div>
        <div className="analytics-summary-card">
          <span>Online Now</span>
          <strong style={{ color: "var(--green)", textShadow: "0 0 20px rgba(52,211,153,0.3)" }}>
            {onlineCount}
          </strong>
        </div>
        <div className="analytics-summary-card">
          <span>Sessions Today</span>
          <strong>{stats.todaySessions}</strong>
        </div>
        <div className="analytics-summary-card">
          <span>Total Time Tracked</span>
          <strong>
            {stats.totalMinutes >= 60
              ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`
              : `${stats.totalMinutes}m`}
          </strong>
        </div>
      </section>

      <div className="settings-tabs" style={{ marginBottom: "18px" }}>
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
          <Users size={14} style={{ marginRight: "6px" }} /> Users
        </button>
        <button className={tab === "sessions" ? "active" : ""} onClick={() => setTab("sessions")}>
          <Clock size={14} style={{ marginRight: "6px" }} /> Session History
        </button>
      </div>

      {tab === "users" && (
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0 }}>All Users</h3>
            <button className="secondary-btn" onClick={loadData} disabled={loading}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="skeleton-stack">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          ) : users.length === 0 ? (
            <p className="muted">No users found.</p>
          ) : (
            <div style={{ display: "grid", gap: "8px" }}>
              {users.map((user) => (
                <div
                  key={user.id}
                  className="admin-user-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    background: "var(--bg-glass)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px 16px",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: user.is_super_admin
                      ? "linear-gradient(135deg, #f59e0b, #d97706)"
                      : "linear-gradient(135deg, var(--primary), #6d28d9)",
                    display: "grid",
                    placeItems: "center",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "13px",
                    flexShrink: 0
                  }}>
                    {(user.username || "?").slice(0, 2).toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "14px" }}>{user.username}</strong>
                      {user.is_super_admin && (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "rgba(245,158,11,0.12)",
                          color: "#fbbf24",
                          borderRadius: "var(--radius-pill)",
                          padding: "2px 8px",
                          fontSize: "10px",
                          fontWeight: 700
                        }}>
                          <Crown size={10} /> ADMIN
                        </span>
                      )}
                      {user.id === currentUserId && (
                        <span style={{
                          background: "var(--primary-subtle)",
                          color: "var(--secondary)",
                          borderRadius: "var(--radius-pill)",
                          padding: "2px 8px",
                          fontSize: "10px",
                          fontWeight: 700
                        }}>
                          YOU
                        </span>
                      )}
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "3px",
                      fontSize: "12px",
                      color: "var(--text-muted)"
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Circle
                          size={8}
                          fill={user.is_online ? "var(--green)" : "var(--text-muted)"}
                          stroke="none"
                          style={user.is_online ? { filter: "drop-shadow(0 0 4px rgba(52,211,153,0.5))" } : {}}
                        />
                        {user.is_online ? "Online" : "Offline"}
                      </span>
                      <span>Last seen: {timeSince(user.last_seen)}</span>
                      <span>Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>

                  {user.id !== currentUserId && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="secondary-btn"
                        style={{ padding: "7px 10px", fontSize: "12px" }}
                        onClick={() => handleToggleAdmin(user)}
                        title={user.is_super_admin ? "Remove admin" : "Make admin"}
                      >
                        {user.is_super_admin ? <Shield size={14} /> : <ShieldCheck size={14} />}
                        {user.is_super_admin ? "Revoke" : "Promote"}
                      </button>
                      <button
                        className="danger-btn"
                        style={{ padding: "7px 10px", fontSize: "12px" }}
                        onClick={() => handleDelete(user)}
                        title="Delete user"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "sessions" && (
        <section className="panel">
          <h3 style={{ marginBottom: "16px" }}>Session History</h3>

          {sessions.length === 0 ? (
            <p className="muted">No session data recorded yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "6px" }}>
              {sessions.map((log) => (
                <div key={log.id} className="activity-item">
                  <span style={{
                    color: log.action === "session_start" ? "var(--green)" : "var(--text-muted)",
                    minWidth: "80px"
                  }}>
                    {log.action === "session_start" ? "Login" : "Logout"}
                  </span>
                  <p style={{ flex: 1 }}>
                    {log.metadata?.username || "Unknown"}
                    {log.action === "session_end" && log.metadata?.duration_minutes != null && (
                      <span style={{ color: "var(--secondary)", marginLeft: "8px" }}>
                        ({log.metadata.duration_minutes}m)
                      </span>
                    )}
                  </p>
                  <small style={{ color: "var(--text-muted)", marginLeft: "auto" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
