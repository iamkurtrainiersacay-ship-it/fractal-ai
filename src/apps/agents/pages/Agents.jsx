import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonRow } from "../../../shared/components/Skeleton";
import toast from "react-hot-toast";
import {
  Bot, Plus, Trash2, Brain, Shield, Zap, ChevronRight,
  X, Edit2, Save, Play, Store, Copy, Activity, ChevronDown, ChevronUp
} from "lucide-react";
import { getAgents, createAgent, updateAgent, deleteAgent } from "../../../services/agentService";
import {
  getAgentMemory,
  createAgentMemory,
  deleteAgentMemory
} from "../services/agentMemoryService";
import { getActivityLogsByAgent } from "../../../services/activityService";

const MODELS = [
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini — Fast & efficient" },
  { value: "gpt-4.1",      label: "GPT-4.1 — Highest capability" },
  { value: "gpt-4o",       label: "GPT-4o — Multimodal" },
  { value: "gpt-3.5-turbo",label: "GPT-3.5 Turbo — Economy" }
];

const STATUS_OPTIONS = ["active", "draft", "paused"];

const EMPTY_FORM = {
  name: "", description: "", role: "",
  model: "gpt-4.1-mini", system_prompt: "", status: "active"
};

// ─── Slide-over panel ──────────────────────────────────────────────────────────

function AgentSlideOver({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM);
  }, [open, initialData]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Agent name is required."); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  const isEdit = !!initialData?.id;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="slideover-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="slideover-panel"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="slideover-header">
              <div className="slideover-title">
                <Bot size={18} />
                <h2>{isEdit ? "Edit Agent" : "Create Agent"}</h2>
              </div>
              <button className="slideover-close" onClick={onClose}><X size={18} /></button>
            </div>

            <form className="slideover-body" onSubmit={handleSave}>
              <div className="slideover-field">
                <label>Name <span className="field-required">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Sales Qualifier Agent"
                  autoFocus
                />
              </div>
              <div className="slideover-field">
                <label>Description</label>
                <input
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="What does this agent do?"
                />
              </div>
              <div className="slideover-field">
                <label>Role / Purpose</label>
                <input
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  placeholder="e.g. Lead Qualification & Outreach"
                />
              </div>
              <div className="slideover-row">
                <div className="slideover-field">
                  <label>Model</label>
                  <select value={form.model} onChange={(e) => set("model", e.target.value)}>
                    {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="slideover-field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="slideover-field grow">
                <label>System Prompt / Instructions</label>
                <textarea
                  className="slideover-textarea"
                  value={form.system_prompt}
                  onChange={(e) => set("system_prompt", e.target.value)}
                  placeholder={`Describe how this agent should behave...\n\nExample:\nYou are a B2B sales qualifier. Your job is to evaluate inbound leads based on company size, budget, and fit. Always be concise and professional.`}
                  rows={10}
                />
              </div>
              <div className="slideover-actions">
                <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                <motion.button
                  type="submit"
                  className="primary-btn"
                  disabled={saving || !form.name.trim()}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {saving ? <span>Saving...</span> : <><Save size={14} />{isEdit ? "Save Changes" : "Create Agent"}</>}
                </motion.button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const colors = {
    active: "var(--green)",
    draft: "var(--text-muted)",
    paused: "var(--amber, #f59e0b)"
  };
  const c = colors[status] || colors.draft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      fontSize: "12px", fontWeight: 600, color: c,
      background: `${c}18`, border: `1px solid ${c}30`,
      borderRadius: "var(--radius-pill)", padding: "3px 10px"
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c, display: "inline-block" }} />
      {(status || "draft").charAt(0).toUpperCase() + (status || "draft").slice(1)}
    </span>
  );
}

// ─── Log entry ────────────────────────────────────────────────────────────────

function LogEntry({ log }) {
  const [expanded, setExpanded] = useState(false);
  const meta = log.metadata || {};
  const cost = meta.estimated_cost != null
    ? `$${Number(meta.estimated_cost).toFixed(4)}`
    : "—";
  const tokens = meta.total_tokens != null ? meta.total_tokens.toLocaleString() : "—";
  const model = meta.model || "—";
  const prompt = meta.prompt || "";
  const response = meta.response || "";

  function relTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className={`agent-log-item ${expanded ? "expanded" : ""}`}>
      <div className="agent-log-meta" onClick={() => setExpanded(!expanded)}>
        <div className="agent-log-left">
          <Activity size={13} style={{ color: "var(--primary)", flexShrink: 0 }} />
          <span className="agent-log-action">{log.action || "agent_run"}</span>
          <span className="agent-log-time">{relTime(log.created_at)}</span>
        </div>
        <div className="agent-log-right">
          <span className="agent-log-chip">{model}</span>
          <span className="agent-log-chip">{tokens} tokens</span>
          <span className="agent-log-chip green">{cost}</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="agent-log-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {prompt && (
              <div className="agent-log-section">
                <label>Prompt</label>
                <pre>{prompt.slice(0, 600)}{prompt.length > 600 ? "…" : ""}</pre>
              </div>
            )}
            {response && (
              <div className="agent-log-section">
                <label>Response</label>
                <pre>{response.slice(0, 600)}{response.length > 600 ? "…" : ""}</pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Agents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [memory, setMemory] = useState([]);
  const [memoryText, setMemoryText] = useState("");
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [tab, setTab] = useState("overview");
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadAgents() {
    try {
      const data = await getAgents();
      setAgents(data || []);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMemory(agentId) {
    const data = await getAgentMemory(agentId);
    setMemory(data || []);
  }

  async function loadLogs(agentId) {
    setLogsLoading(true);
    try {
      const data = await getActivityLogsByAgent(agentId);
      setLogs(data || []);
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => { loadAgents(); }, []);

  async function selectAgent(agent) {
    setSelectedAgent(agent);
    setTab("overview");
    setLogs([]);
    await loadMemory(agent.id);
  }

  async function handleTabChange(t) {
    setTab(t);
    if (t === "logs" && selectedAgent && logs.length === 0) {
      await loadLogs(selectedAgent.id);
    }
  }

  async function addMemory() {
    if (!selectedAgent || !memoryText.trim()) return;
    await createAgentMemory({ agent_id: selectedAgent.id, memory: memoryText });
    setMemoryText("");
    await loadMemory(selectedAgent.id);
  }

  async function removeMemory(id) {
    await deleteAgentMemory(id);
    await loadMemory(selectedAgent.id);
  }

  async function uninstallAgent() {
    if (!selectedAgent) return;
    if (!window.confirm(`Remove "${selectedAgent.name}"? This cannot be undone.`)) return;
    await deleteAgent(selectedAgent.id);
    setSelectedAgent(null);
    setMemory([]);
    toast.success("Agent removed.");
    await loadAgents();
  }

  async function cloneAgent() {
    if (!selectedAgent) return;
    try {
      const session = JSON.parse(localStorage.getItem("nexus_user") || "{}");
      const userId = session?.user?.id || session?.id;
      const [cloned] = await createAgent({
        name: `Copy of ${selectedAgent.name}`,
        description: selectedAgent.description,
        role: selectedAgent.role,
        model: selectedAgent.model,
        system_prompt: selectedAgent.system_prompt,
        status: "draft",
        created_by: userId || null
      });
      toast.success("Agent cloned — opening editor...");
      await loadAgents();
      setEditingAgent(cloned);
      setSlideOpen(true);
    } catch (err) {
      toast.error(err.message || "Clone failed.");
    }
  }

  function openCreate() { setEditingAgent(null); setSlideOpen(true); }
  function openEdit(agent) { setEditingAgent(agent); setSlideOpen(true); }

  async function handleSave(form) {
    try {
      if (editingAgent?.id) {
        const [updated] = await updateAgent(editingAgent.id, form);
        setSelectedAgent(updated);
        toast.success("Agent updated.");
        setSlideOpen(false);
        await loadAgents();
      } else {
        const session = JSON.parse(localStorage.getItem("nexus_user") || "{}");
        const userId = session?.user?.id || session?.id;
        const [newAgent] = await createAgent({ ...form, created_by: userId || null });
        toast.success("Agent created! Opening chat...");
        setSlideOpen(false);
        await loadAgents();
        navigate("/run-agent", { state: { agent: newAgent } });
      }
    } catch (err) {
      toast.error(err.message || "Failed to save agent.");
      throw err;
    }
  }

  const tabs = [
    { id: "overview", icon: Shield, label: "Overview" },
    { id: "memory",   icon: Brain,  label: "Memory" },
    { id: "logs",     icon: Activity, label: "Logs" },
    { id: "config",   icon: Zap,    label: "Config" }
  ];

  return (
    <>
      <AgentSlideOver
        open={slideOpen}
        onClose={() => setSlideOpen(false)}
        onSave={handleSave}
        initialData={editingAgent}
      />

      <div className="agents-page">
        <section className="mp-hero">
          <div>
            <p className="sd-eyebrow">AI Agents</p>
            <h1 className="mp-title">Agent Management</h1>
            <p className="muted">Configure agents, manage memory, and monitor capabilities.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <motion.button
              className="primary-btn"
              onClick={openCreate}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              <Plus size={16} /> Create Agent
            </motion.button>
            <button className="secondary-btn" onClick={() => navigate("/marketplace")}>
              <Store size={16} /> Marketplace
            </button>
          </div>
        </section>

        <div className="agents-shell">
          <aside className="agents-sidebar">
            <div className="sd-section-head">
              <h3>Installed ({agents.length})</h3>
            </div>
            <div className="agents-list">
              {loading ? (
                [1, 2, 3].map((i) => <SkeletonRow key={i} style={{ padding: "12px 8px" }} />)
              ) : agents.length === 0 ? (
                <div className="agents-empty">
                  <p className="muted">No agents yet.</p>
                  <button className="secondary-btn" onClick={openCreate}>
                    <Plus size={14} /> Create your first agent
                  </button>
                </div>
              ) : (
                agents.map((agent) => (
                  <button
                    key={agent.id}
                    className={selectedAgent?.id === agent.id ? "agent-row active" : "agent-row"}
                    onClick={() => selectAgent(agent)}
                  >
                    <div className="agent-row-icon"><Bot size={18} /></div>
                    <div className="agent-row-info">
                      <strong>{agent.name}</strong>
                      <span>{agent.role || "AI Agent"}</span>
                    </div>
                    <ChevronRight size={14} className="agent-row-chevron" />
                  </button>
                ))
              )}
            </div>
          </aside>

          <main className="agents-main">
            {!selectedAgent ? (
              <div className="sd-empty">
                <div className="sd-empty-orb"><Bot size={28} /></div>
                <h2>Select an agent</h2>
                <p>Choose an agent from the sidebar, or create a new one.</p>
                <button className="primary-btn" onClick={openCreate} style={{ marginTop: "16px" }}>
                  <Plus size={14} /> Create Agent
                </button>
              </div>
            ) : (
              <div className="agent-detail">
                <div className="agent-detail-header">
                  <div className="agent-detail-icon"><Bot size={24} /></div>
                  <div style={{ flex: 1 }}>
                    <h2>{selectedAgent.name}</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                      <p className="muted" style={{ margin: 0 }}>{selectedAgent.role || "AI Agent"}</p>
                      <StatusBadge status={selectedAgent.status} />
                    </div>
                  </div>
                  <div className="agent-detail-actions">
                    <button className="secondary-btn" onClick={cloneAgent} title="Clone agent">
                      <Copy size={14} /> Clone
                    </button>
                    <button className="secondary-btn" onClick={() => openEdit(selectedAgent)}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button className="primary-btn" onClick={() => navigate("/run-agent", { state: { agent: selectedAgent } })}>
                      <Play size={14} /> Run
                    </button>
                    <button className="danger-btn" onClick={uninstallAgent}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="agent-tabs">
                  {tabs.map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      className={tab === id ? "active" : ""}
                      onClick={() => handleTabChange(id)}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>

                {tab === "overview" && (
                  <div className="agent-tab-content">
                    {selectedAgent.description && (
                      <p className="muted" style={{ marginBottom: "16px" }}>{selectedAgent.description}</p>
                    )}
                    <div className="agent-info-grid">
                      <div className="agent-info-card">
                        <span>Model</span>
                        <strong>{selectedAgent.model || "gpt-4.1-mini"}</strong>
                      </div>
                      <div className="agent-info-card">
                        <span>Status</span>
                        <StatusBadge status={selectedAgent.status} />
                      </div>
                      <div className="agent-info-card">
                        <span>Memory Items</span>
                        <strong>{memory.length}</strong>
                      </div>
                    </div>
                    {selectedAgent.system_prompt && (
                      <div className="agent-prompt-box">
                        <h4>System Prompt</h4>
                        <pre>{selectedAgent.system_prompt}</pre>
                      </div>
                    )}
                  </div>
                )}

                {tab === "memory" && (
                  <div className="agent-tab-content">
                    <div className="agent-memory-add">
                      <textarea
                        value={memoryText}
                        onChange={(e) => setMemoryText(e.target.value)}
                        placeholder="Teach this agent something new..."
                      />
                      <button className="primary-btn" onClick={addMemory} disabled={!memoryText.trim()}>
                        <Brain size={14} /> Add Memory
                      </button>
                    </div>
                    <div className="agent-memory-list">
                      {memory.length === 0 ? (
                        <p className="muted">No memories yet. Add knowledge to improve this agent.</p>
                      ) : (
                        memory.map((item) => (
                          <div key={item.id} className="agent-memory-item">
                            <p>{item.memory}</p>
                            <button className="danger-btn" onClick={() => removeMemory(item.id)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {tab === "logs" && (
                  <div className="agent-tab-content">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <p className="muted" style={{ margin: 0 }}>Last 50 executions for this agent.</p>
                      <button
                        className="secondary-btn"
                        onClick={() => loadLogs(selectedAgent.id)}
                        disabled={logsLoading}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        {logsLoading ? "Loading..." : "Refresh"}
                      </button>
                    </div>

                    {logsLoading ? (
                      [1, 2, 3].map((i) => (
                        <div key={i} className="agent-log-item" style={{ padding: "16px", opacity: 0.5 }}>
                          <div className="skeleton" style={{ height: "12px", width: "60%", borderRadius: "6px" }} />
                        </div>
                      ))
                    ) : logs.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Activity size={28} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
                        <p className="muted">No runs yet — use Run to execute this agent.</p>
                      </div>
                    ) : (
                      <div className="agent-logs-list">
                        {logs.map((log) => <LogEntry key={log.id} log={log} />)}
                      </div>
                    )}
                  </div>
                )}

                {tab === "config" && (
                  <div className="agent-tab-content">
                    <div className="agent-config-section">
                      <h4>Permissions</h4>
                      <div className="agent-permissions">
                        {["Read Knowledge", "Write Memory", "Execute Workflows", "Access CRM"].map((perm) => (
                          <label key={perm} className="agent-perm-row">
                            <input type="checkbox" defaultChecked />
                            <span>{perm}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="agent-config-section">
                      <h4>Tool Access</h4>
                      <div className="mp-card-skills">
                        {["Knowledge Base", "Workflows", "Analytics", "Social Distribution"].map((tool) => (
                          <span key={tool} className="mp-skill">{tool}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
