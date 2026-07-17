import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Plus, X, Save, Bot, Users } from "lucide-react";
import { getAgents, createAgent } from "../../../services/agentService";
import { runAgent } from "../../../services/openaiService";
import { useWorkspace } from "../../../core/workspace/WorkspaceContext";

const MODELS = [
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "gpt-4.1",      label: "GPT-4.1" },
  { value: "gpt-4o",       label: "GPT-4o" }
];

const EMPTY_FORM = {
  name: "", role: "", description: "",
  model: "gpt-4.1-mini", system_prompt: "", status: "active"
};

// ─── Quick-create slide-over ──────────────────────────────────────────────────

function QuickCreateSlideOver({ open, onClose, onCreated, workspaceId }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setForm(EMPTY_FORM); }, [open]);

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Agent name is required."); return; }
    setSaving(true);
    try {
      const session = JSON.parse(localStorage.getItem("nexus_user") || "{}");
      const userId = session?.user?.id || session?.id;
      const [newAgent] = await createAgent({
        ...form,
        created_by: userId || null,
        workspace_id: workspaceId !== "default" ? workspaceId : null
      });
      toast.success(`${newAgent.name} created and ready!`);
      onCreated(newAgent);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create agent.");
    } finally {
      setSaving(false);
    }
  }

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
                <h2>Create Agent</h2>
              </div>
              <button className="slideover-close" onClick={onClose}><X size={18} /></button>
            </div>
            <form className="slideover-body" onSubmit={handleSave}>
              <div className="slideover-field">
                <label>Name <span className="field-required">*</span></label>
                <input
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="e.g. Sales Qualifier Agent"
                  autoFocus
                />
              </div>
              <div className="slideover-field">
                <label>Role / Purpose</label>
                <input
                  value={form.role}
                  onChange={e => set("role", e.target.value)}
                  placeholder="e.g. Lead Qualification & Outreach"
                />
              </div>
              <div className="slideover-field">
                <label>Description</label>
                <input
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="What does this agent do?"
                />
              </div>
              <div className="slideover-field">
                <label>Model</label>
                <select value={form.model} onChange={e => set("model", e.target.value)}>
                  {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="slideover-field grow">
                <label>System Prompt / Instructions</label>
                <textarea
                  className="slideover-textarea"
                  value={form.system_prompt}
                  onChange={e => set("system_prompt", e.target.value)}
                  placeholder={`You are a [role] agent. Your job is to...\n\nBe concise, professional, and focused.`}
                  rows={10}
                />
              </div>
              <div className="slideover-actions">
                <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                <motion.button
                  type="submit"
                  className="primary-btn"
                  disabled={saving || !form.name.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {saving ? "Creating..." : <><Save size={14} /> Create & Add</>}
                </motion.button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MultiAgentWorkspace() {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id;
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  async function loadAgents() {
    const data = await getAgents(workspaceId);
    setAgents(data || []);
  }

  useEffect(() => { loadAgents(); }, [workspaceId]);

  function toggleAgent(agentId) {
    setSelectedAgents(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  }

  function handleAgentCreated(newAgent) {
    setAgents(prev => [...prev, newAgent]);
    setSelectedAgents(prev => [...prev, newAgent.id]);
  }

  async function runTeam() {
    if (!prompt.trim()) { toast.error("Enter a team task first."); return; }
    if (!selectedAgents.length) { toast.error("Select at least one agent."); return; }

    setRunning(true);
    const userMessage = { role: "user", agent: "You", content: prompt };
    setMessages(prev => [...prev, userMessage]);

    let sharedContext = prompt;

    try {
      for (const agentId of selectedAgents) {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) continue;

        const result = await runAgent(agent, `
Shared team task:
${prompt}

Current team context:
${sharedContext}

Respond as ${agent.name}. Add useful output for the next agent in the chain.
`);

        const agentMessage = { role: "agent", agent: agent.name, content: result.output };
        setMessages(prev => [...prev, agentMessage]);
        sharedContext += `\n\n${agent.name}:\n${result.output}`;
      }
      setPrompt("");
      toast.success("Team run complete.");
    } catch (error) {
      console.error(error);
      toast.error("Multi-agent run failed. Check console.");
    } finally {
      setRunning(false);
    }
  }

  const selectedAgentObjects = selectedAgents
    .map(id => agents.find(a => a.id === id))
    .filter(Boolean);

  return (
    <>
      <QuickCreateSlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleAgentCreated}
        workspaceId={workspaceId}
      />

      <div className="multi-agent-page">
        <section className="mission-hero">
          <div>
            <p className="sd-eyebrow">Nexus Prime Team</p>
            <h1>Multi-Agent Workspace</h1>
            <p>Select multiple agents and let them collaborate on one shared task.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="secondary-btn" onClick={() => navigate("/agents")}>
              <Users size={16} /> Manage Agents
            </button>
            <button
              className="primary-btn"
              onClick={runTeam}
              disabled={running || !selectedAgents.length || !prompt.trim()}
            >
              {running ? "Running Team..." : "Run AI Team"}
            </button>
          </div>
        </section>

        <section className="multi-agent-grid">
          <aside className="multi-agent-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <h2>Agents</h2>
                <p className="muted" style={{ margin: 0, fontSize: "12px" }}>Choose agents for this task.</p>
              </div>
              <motion.button
                className="primary-btn"
                onClick={() => setShowCreate(true)}
                style={{ padding: "7px 12px", fontSize: "12px" }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Plus size={14} /> New
              </motion.button>
            </div>

            <div className="agent-selector-list">
              {agents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <p className="muted" style={{ marginBottom: "10px" }}>No agents yet.</p>
                  <button className="primary-btn" onClick={() => setShowCreate(true)}>
                    <Plus size={13} /> Create your first agent
                  </button>
                </div>
              ) : (
                agents.map(agent => (
                  <motion.button
                    key={agent.id}
                    className={selectedAgents.includes(agent.id) ? "agent-selector active" : "agent-selector"}
                    onClick={() => toggleAgent(agent.id)}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.12 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: selectedAgents.includes(agent.id) ? "var(--primary)" : "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, transition: "background 0.15s"
                      }}>
                        <Bot size={13} color={selectedAgents.includes(agent.id) ? "white" : "var(--text-muted)"} />
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <strong style={{ fontSize: "13px", display: "block" }}>{agent.name}</strong>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{agent.role || "AI Agent"}</span>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </aside>

          <main className="multi-agent-panel">
            <h2>Team Task</h2>
            <textarea
              className="multi-agent-input"
              placeholder="Example: Build a LinkedIn campaign for our AI infrastructure services..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            <div className="team-flow">
              {selectedAgents.length === 0 ? (
                <p className="muted">No agents selected.</p>
              ) : (
                selectedAgentObjects.map((agent, i) => (
                  <div key={agent.id} className="team-flow-step">
                    <span>{i + 1}</span>
                    <strong>{agent.name}</strong>
                    <button
                      style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0 4px" }}
                      onClick={() => toggleAgent(agent.id)}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </main>

          <aside className="multi-agent-panel">
            <h2>Team Status</h2>
            <div className="health-list">
              <div className="health-row">
                <span>Selected Agents</span>
                <strong style={{ color: selectedAgents.length > 0 ? "var(--green)" : "var(--text-muted)" }}>
                  {selectedAgents.length}
                </strong>
              </div>
              <div className="health-row">
                <span>Status</span>
                <strong style={{ color: running ? "var(--amber)" : "var(--green)" }}>
                  {running ? "Running" : "Ready"}
                </strong>
              </div>
              <div className="health-row">
                <span>Mode</span>
                <strong>Sequential</strong>
              </div>
              <div className="health-row">
                <span>Total Agents</span>
                <strong>{agents.length}</strong>
              </div>
            </div>

            {selectedAgentObjects.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Execution Order
                </p>
                {selectedAgentObjects.map((agent, i) => (
                  <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 700, minWidth: "16px" }}>{i + 1}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{agent.name}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </section>

        <section className="multi-agent-panel" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2>Collaboration Output</h2>
            {messages.length > 0 && (
              <button className="secondary-btn" onClick={() => setMessages([])} style={{ fontSize: "12px", padding: "6px 12px" }}>
                Clear
              </button>
            )}
          </div>
          <div className="multi-agent-chat">
            {messages.length === 0 ? (
              <div className="sd-empty">
                <div className="sd-empty-orb">✦</div>
                <h2>No team run yet</h2>
                <p>Select agents, enter a task, and run the AI team.</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    className={message.role === "user" ? "team-message user" : "team-message agent"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="team-message-name">{message.agent}</div>
                    <div className="team-message-body">{message.content}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
