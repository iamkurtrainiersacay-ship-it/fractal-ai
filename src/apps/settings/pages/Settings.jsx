import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useWorkspace } from "../../../core/workspace/WorkspaceContext";
import {
  createWorkspace, updateWorkspace, deleteWorkspace
} from "../../../services/workspaceService";
import { Database, Zap, Shield, Layers, Plus, Pencil, Trash2, User, Key } from "lucide-react";

const tabs = ["Profile", "General", "Workspaces", "Backend"];

function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

export default function Settings() {
  const { workspace, workspaces, switchWorkspace, refreshWorkspaces } = useWorkspace();
  const [activeTab, setActiveTab] = useState("Profile");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  // Read user from localStorage
  const rawUser = (() => {
    try { return JSON.parse(localStorage.getItem("nexus_user") || "{}"); } catch { return {}; }
  })();
  const user = rawUser?.user || rawUser;
  const displayName = user?.username || user?.email?.split("@")[0] || "User";
  const email = user?.email || "—";
  const isAdmin = rawUser?.is_super_admin || false;

  function startCreate() { setEditingId("new"); setForm({ name: "", description: "" }); }
  function startEdit(ws) { setEditingId(ws.id); setForm({ name: ws.name, description: ws.description || "" }); }
  function cancelEdit() { setEditingId(null); setForm({ name: "", description: "" }); }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId === "new") {
        const created = await createWorkspace({ name: form.name.trim(), description: form.description.trim() });
        await refreshWorkspaces();
        switchWorkspace(created);
      } else {
        await updateWorkspace(editingId, { name: form.name.trim(), description: form.description.trim() });
        await refreshWorkspaces();
      }
      cancelEdit();
      toast.success("Workspace saved.");
    } catch (err) {
      toast.error(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (workspaces.length <= 1) { toast.error("Can't delete your only workspace."); return; }
    try {
      await deleteWorkspace(id);
      await refreshWorkspaces();
      toast.success("Workspace deleted.");
    } catch (err) {
      toast.error(err.message || "Failed to delete.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("nexus_user");
    window.location.hash = "/login";
    window.location.reload();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="muted">Platform configuration, workspace management, and infrastructure.</p>
        </div>
      </div>

      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "Profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <div className="ws-settings">
              <div className="panel" style={{ padding: 24 }}>
                <h2>Your Profile</h2>
                <p className="muted" style={{ marginBottom: 20 }}>Account information from your current session.</p>

                <div className="profile-card">
                  <div className="profile-avatar">
                    <span>{getInitials(displayName)}</span>
                    {isAdmin && <div className="profile-admin-badge">Admin</div>}
                  </div>
                  <div className="profile-info">
                    <strong className="profile-name">{displayName}</strong>
                    <span className="profile-email">{email}</span>
                    <div className="profile-badges">
                      <span className="mp-skill">Active Session</span>
                      {isAdmin && <span className="mp-skill" style={{ color: "var(--primary)", borderColor: "var(--primary)" }}>Super Admin</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 16 }}>
                  <Key size={16} style={{ color: "var(--primary)" }} />
                  <h2>Session</h2>
                </div>
                <p className="muted" style={{ marginBottom: 16 }}>
                  Your session is stored in your browser's local storage under <code style={{ fontSize: "12px", padding: "2px 6px", background: "var(--bg-inset)", borderRadius: "4px" }}>nexus_user</code>.
                </p>
                <div className="health-row" style={{ marginBottom: 12 }}>
                  <div className="health-left">
                    <User size={16} />
                    <span>Session Status</span>
                  </div>
                  <strong style={{ color: "var(--green)" }}>Active</strong>
                </div>
                <button className="danger-btn" onClick={handleLogout} style={{ marginTop: 8 }}>
                  Sign Out
                </button>
              </div>

              <div className="panel" style={{ padding: 24, border: "1px solid rgba(239,68,68,0.2)" }}>
                <h2 style={{ color: "var(--red)" }}>Danger Zone</h2>
                <p className="muted" style={{ marginBottom: 16 }}>Clear local data — this logs you out immediately.</p>
                <button
                  className="danger-btn"
                  onClick={() => {
                    if (window.confirm("Clear all local data and log out?")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                >
                  Clear All Local Data
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "General" && (
          <motion.div key="general" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="ws-settings">
              <div className="panel" style={{ padding: 24 }}>
                <h2>Platform</h2>
                <p className="muted" style={{ marginBottom: 18 }}>Nexus Prime Operating System</p>
                <div className="workspace-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  <div className="workspace-stat">
                    <strong>{workspaces.length}</strong>
                    <span>Workspaces</span>
                  </div>
                  <div className="workspace-stat">
                    <strong>9</strong>
                    <span>Active Modules</span>
                  </div>
                  <div className="workspace-stat">
                    <strong style={{ color: "var(--green)" }}>Live</strong>
                    <span>System Status</span>
                  </div>
                </div>
              </div>
              <div className="panel" style={{ padding: 24 }}>
                <h2>Active Workspace</h2>
                <p className="muted" style={{ marginBottom: 14 }}>Currently operating in:</p>
                <div className="ws-card active-ws">
                  <div className="ws-avatar">{getInitials(workspace.name)}</div>
                  <div className="ws-card-info">
                    <strong>{workspace.name}</strong>
                    <span>{workspace.description || "No description"}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Workspaces" && (
          <motion.div key="workspaces" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="ws-settings">
              <div className="panel" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h2>Workspace Management</h2>
                    <p className="muted">Create, edit, and switch between workspaces.</p>
                  </div>
                  <button className="primary-btn" onClick={startCreate}>
                    <Plus size={16} /> New Workspace
                  </button>
                </div>

                {editingId && (
                  <div className="panel" style={{ padding: 20, marginBottom: 20, background: "rgba(2,6,23,.72)" }}>
                    <h3>{editingId === "new" ? "Create Workspace" : "Edit Workspace"}</h3>
                    <div className="ws-form" style={{ marginTop: 12 }}>
                      <input placeholder="Workspace name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                      <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="primary-btn" onClick={handleSave} disabled={saving}>
                          {saving ? "Saving..." : "Save Workspace"}
                        </button>
                        <button className="secondary-btn" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="ws-settings">
                  {workspaces.map(ws => (
                    <div key={ws.id} className={ws.id === workspace.id ? "ws-card active-ws" : "ws-card"}>
                      <div className="ws-avatar">{getInitials(ws.name)}</div>
                      <div className="ws-card-info">
                        <strong>{ws.name}</strong>
                        <span>{ws.description || "No description"}</span>
                      </div>
                      <div className="ws-card-actions">
                        {ws.id !== workspace.id && (
                          <button className="secondary-btn" style={{ marginTop: 0, padding: "8px 14px" }} onClick={() => switchWorkspace(ws)}>Switch</button>
                        )}
                        <button className="secondary-btn" style={{ marginTop: 0, padding: "8px 14px" }} onClick={() => startEdit(ws)}>
                          <Pencil size={14} />
                        </button>
                        {workspaces.length > 1 && (
                          <button className="danger-btn" style={{ padding: "8px 14px" }} onClick={() => handleDelete(ws.id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {workspaces.length === 0 && <p className="muted">No workspaces found.</p>}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Backend" && (
          <motion.div key="backend" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="ws-settings">
              <div className="panel" style={{ padding: 24 }}>
                <h2>Infrastructure</h2>
                <p className="muted" style={{ marginBottom: 18 }}>Connected services and system configuration.</p>
                <div className="health-list">
                  {[
                    { icon: Database, label: "Supabase", status: "Connected", color: "var(--green)" },
                    { icon: Zap, label: "OpenAI (via Edge Function)", status: "Ready", color: "var(--green)" },
                    { icon: Shield, label: "Authentication", status: "Custom Auth Active", color: "var(--green)" },
                    { icon: Layers, label: "Workspace Isolation", status: "Enabled", color: "var(--green)" }
                  ].map(({ icon: Icon, label, status, color }) => (
                    <div className="health-row" key={label}>
                      <div className="health-left">
                        <Icon size={18} />
                        <span>{label}</span>
                      </div>
                      <strong style={{ color }}>{status}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel" style={{ padding: 24 }}>
                <h2>Model Router</h2>
                <p className="muted">Default model: GPT-4.1-mini (via Supabase Edge Function)</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
