import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Plus, Trash2, Brain, Shield, Zap, ChevronRight } from "lucide-react";
import { getAgents, deleteAgent } from "../../../services/agentService";
import {
  getAgentMemory,
  createAgentMemory,
  deleteAgentMemory
} from "../services/agentMemoryService";

export default function Agents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [memory, setMemory] = useState([]);
  const [memoryText, setMemoryText] = useState("");
  const [tab, setTab] = useState("overview");

  async function loadAgents() {
    try {
      const data = await getAgents();
      setAgents(data || []);
    } catch {
      setAgents([]);
    }
  }

  async function loadMemory(agentId) {
    const data = await getAgentMemory(agentId);
    setMemory(data || []);
  }

  useEffect(() => {
    loadAgents();
  }, []);

  async function selectAgent(agent) {
    setSelectedAgent(agent);
    setTab("overview");
    await loadMemory(agent.id);
  }

  async function addMemory() {
    if (!selectedAgent || !memoryText.trim()) return;

    await createAgentMemory({
      agent_id: selectedAgent.id,
      memory: memoryText
    });

    setMemoryText("");
    await loadMemory(selectedAgent.id);
  }

  async function removeMemory(id) {
    if (!selectedAgent) return;
    await deleteAgentMemory(id);
    await loadMemory(selectedAgent.id);
  }

  async function uninstallAgent() {
    if (!selectedAgent) return;
    await deleteAgent(selectedAgent.id);
    setSelectedAgent(null);
    setMemory([]);
    await loadAgents();
  }

  return (
    <div className="agents-page">
      <section className="mp-hero">
        <div>
          <p className="sd-eyebrow">AI Agents</p>
          <h1 className="mp-title">Agent Management</h1>
          <p className="muted">Configure agents, manage memory, and monitor capabilities.</p>
        </div>

        <button className="primary-btn" onClick={() => navigate("/marketplace")}>
          <Plus size={16} /> Agent Marketplace
        </button>
      </section>

      <div className="agents-shell">
        <aside className="agents-sidebar">
          <div className="sd-section-head">
            <div>
              <h3>Installed ({agents.length})</h3>
            </div>
          </div>

          <div className="agents-list">
            {agents.length === 0 ? (
              <div className="agents-empty">
                <p className="muted">No agents installed.</p>
                <button className="secondary-btn" onClick={() => navigate("/marketplace")}>
                  Browse Marketplace
                </button>
              </div>
            ) : (
              agents.map((agent) => (
                <button
                  key={agent.id}
                  className={selectedAgent?.id === agent.id ? "agent-row active" : "agent-row"}
                  onClick={() => selectAgent(agent)}
                >
                  <div className="agent-row-icon">
                    <Bot size={18} />
                  </div>
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
              <p>Choose an agent from the sidebar to view details and manage memory.</p>
            </div>
          ) : (
            <div className="agent-detail">
              <div className="agent-detail-header">
                <div className="agent-detail-icon">
                  <Bot size={24} />
                </div>
                <div>
                  <h2>{selectedAgent.name}</h2>
                  <p className="muted">{selectedAgent.role || "AI Agent"}</p>
                </div>
                <div className="agent-detail-actions">
                  <button className="primary-btn" onClick={() => navigate("/run-agent")}>
                    <Zap size={14} /> Run Agent
                  </button>
                  <button className="danger-btn" onClick={uninstallAgent}>
                    <Trash2 size={14} /> Uninstall
                  </button>
                </div>
              </div>

              <div className="agent-tabs">
                {["overview", "memory", "config"].map((t) => (
                  <button
                    key={t}
                    className={tab === t ? "active" : ""}
                    onClick={() => setTab(t)}
                  >
                    {t === "overview" && <Shield size={14} />}
                    {t === "memory" && <Brain size={14} />}
                    {t === "config" && <Zap size={14} />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {tab === "overview" && (
                <div className="agent-tab-content">
                  <div className="agent-info-grid">
                    <div className="agent-info-card">
                      <span>Model</span>
                      <strong>{selectedAgent.model || "gpt-4.1-mini"}</strong>
                    </div>
                    <div className="agent-info-card">
                      <span>Status</span>
                      <strong>{selectedAgent.status || "Active"}</strong>
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
  );
}
