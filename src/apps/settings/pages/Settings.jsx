import { useState } from "react";
import { useWorkspace } from "../../../core/workspace/WorkspaceContext";
import {
  createWorkspace,
  updateWorkspace,
  deleteWorkspace
} from "../../../services/workspaceService";
import { Database, Zap, Shield, Layers, Plus, Pencil, Trash2 } from "lucide-react";

const tabs = ["General", "Workspaces", "Backend"];

export default function Settings() {
  const { workspace, workspaces, switchWorkspace, refreshWorkspaces } = useWorkspace();
  const [activeTab, setActiveTab] = useState("General");

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditingId("new");
    setForm({ name: "", description: "" });
  }

  function startEdit(ws) {
    setEditingId(ws.id);
    setForm({ name: ws.name, description: ws.description || "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "", description: "" });
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);

    try {
      if (editingId === "new") {
        const created = await createWorkspace({
          name: form.name.trim(),
          description: form.description.trim()
        });
        await refreshWorkspaces();
        switchWorkspace(created);
      } else {
        await updateWorkspace(editingId, {
          name: form.name.trim(),
          description: form.description.trim()
        });
        await refreshWorkspaces();
      }
      cancelEdit();
    } catch (err) {
      console.error("Save workspace error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (workspaces.length <= 1) return;

    try {
      await deleteWorkspace(id);
      await refreshWorkspaces();
    } catch (err) {
      console.error("Delete workspace error:", err);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="muted">Platform configuration, workspace management, and infrastructure.</p>
      </div>

      <div className="settings-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "General" && (
        <div className="ws-settings">
          <div className="panel" style={{ padding: 24 }}>
            <h2>Platform</h2>
            <p className="muted" style={{ marginBottom: 18 }}>Fractal AI Operating System</p>

            <div className="workspace-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="workspace-stat">
                <strong>{workspaces.length}</strong>
                <span>Workspaces</span>
              </div>
              <div className="workspace-stat">
                <strong>6</strong>
                <span>Active Modules</span>
              </div>
              <div className="workspace-stat">
                <strong>Live</strong>
                <span>System Status</span>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: 24 }}>
            <h2>Active Workspace</h2>
            <p className="muted" style={{ marginBottom: 14 }}>Currently operating in:</p>
            <div className="ws-card active-ws">
              <div className="ws-avatar">{workspace.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}</div>
              <div className="ws-card-info">
                <strong>{workspace.name}</strong>
                <span>{workspace.description || "No description"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Workspaces" && (
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
                  <input
                    placeholder="Workspace name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
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
              {workspaces.map((ws) => (
                <div key={ws.id} className={ws.id === workspace.id ? "ws-card active-ws" : "ws-card"}>
                  <div className="ws-avatar">{ws.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}</div>
                  <div className="ws-card-info">
                    <strong>{ws.name}</strong>
                    <span>{ws.description || "No description"}</span>
                  </div>
                  <div className="ws-card-actions">
                    {ws.id !== workspace.id && (
                      <button className="secondary-btn" style={{ marginTop: 0, padding: "8px 14px" }} onClick={() => switchWorkspace(ws)}>
                        Switch
                      </button>
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

              {workspaces.length === 0 && (
                <p className="muted">No workspaces found. Create one to get started.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Backend" && (
        <div className="ws-settings">
          <div className="panel" style={{ padding: 24 }}>
            <h2>Infrastructure</h2>
            <p className="muted" style={{ marginBottom: 18 }}>Connected services and system configuration.</p>

            <div className="health-list">
              <div className="health-row">
                <div className="health-left">
                  <Database size={18} />
                  <span>Supabase</span>
                </div>
                <strong style={{ color: "#4ade80" }}>Connected</strong>
              </div>

              <div className="health-row">
                <div className="health-left">
                  <Zap size={18} />
                  <span>OpenAI (via Edge Function)</span>
                </div>
                <strong style={{ color: "#4ade80" }}>Ready</strong>
              </div>

              <div className="health-row">
                <div className="health-left">
                  <Shield size={18} />
                  <span>Authentication</span>
                </div>
                <strong style={{ color: "#4ade80" }}>Custom Auth Active</strong>
              </div>

              <div className="health-row">
                <div className="health-left">
                  <Layers size={18} />
                  <span>Workspace Isolation</span>
                </div>
                <strong style={{ color: "#4ade80" }}>Enabled</strong>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: 24 }}>
            <h2>Model Router</h2>
            <p className="muted">Default model: GPT-4.1-mini (via Supabase Edge Function)</p>
          </div>
        </div>
      )}
    </div>
  );
}
