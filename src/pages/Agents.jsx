import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  getAgentMemory,
  createAgentMemory,
  deleteAgentMemory
} from "../services/agentMemoryService";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memoryByAgent, setMemoryByAgent] = useState({});
  const [openMemoryAgentId, setOpenMemoryAgentId] = useState(null);
  const [memoryForms, setMemoryForms] = useState({});

  const [form, setForm] = useState({
    name: "",
    role: "",
    model: "GPT-5.5",
    tools: "",
    knowledge: "",
    system_prompt: ""
  });

  async function loadAgents() {
    setLoading(true);

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Failed to load agents.");
    } else {
      setAgents(data || []);
    }

    setLoading(false);
  }

  async function loadAgentMemory(agentId) {
    const data = await getAgentMemory(agentId);
    setMemoryByAgent((current) => ({
      ...current,
      [agentId]: data || []
    }));
  }

  async function toggleMemory(agentId) {
    if (openMemoryAgentId === agentId) {
      setOpenMemoryAgentId(null);
      return;
    }

    setOpenMemoryAgentId(agentId);
    await loadAgentMemory(agentId);
  }

  async function addMemory(agentId) {
    const current = memoryForms[agentId] || {
      memory: "",
      memory_type: "fact"
    };

    if (!current.memory) {
      alert("Memory is required.");
      return;
    }

    await createAgentMemory({
      agent_id: agentId,
      memory: current.memory,
      memory_type: current.memory_type || "fact",
      source: "manual"
    });

    setMemoryForms({
      ...memoryForms,
      [agentId]: {
        memory: "",
        memory_type: "fact"
      }
    });

    await loadAgentMemory(agentId);
  }

  async function removeMemory(agentId, memoryId) {
    await deleteAgentMemory(memoryId);
    await loadAgentMemory(agentId);
  }

  function updateMemoryForm(agentId, key, value) {
    const current = memoryForms[agentId] || {
      memory: "",
      memory_type: "fact"
    };

    setMemoryForms({
      ...memoryForms,
      [agentId]: {
        ...current,
        [key]: value
      }
    });
  }

  async function createAgent() {
    if (!form.name || !form.role) {
      alert("Add agent name and role.");
      return;
    }

    const payload = {
      name: form.name,
      role: form.role,
      model: form.model,
      status: "Active",
      tools: form.tools.split(",").map((x) => x.trim()).filter(Boolean),
      knowledge: form.knowledge.split(",").map((x) => x.trim()).filter(Boolean),
      system_prompt: form.system_prompt
    };

    const { error } = await supabase.from("agents").insert(payload);

    if (error) {
      console.error(error);
      alert("Failed to create agent.");
      return;
    }

    setForm({
      name: "",
      role: "",
      model: "GPT-5.5",
      tools: "",
      knowledge: "",
      system_prompt: ""
    });

    loadAgents();
  }

  async function deleteAgent(id) {
    const { error } = await supabase.from("agents").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to delete agent.");
      return;
    }

    loadAgents();
  }

  function testAgent(agent) {
    alert(`${agent.name} test started using ${agent.model}.`);
  }

  useEffect(() => {
    loadAgents();
  }, []);

  return (
    <div className="page">
      <h1>Agents</h1>
      <p className="muted">
        Create, assign tools, assign knowledge, select model, manage memory, and define system prompts.
      </p>

      <div className="panel">
        <h3>Create Agent</h3>

        <div className="form-grid">
          <input
            placeholder="Agent name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="Purpose / role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />

          <select
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
          >
            <option>GPT-5.5</option>
            <option>GPT-5.4</option>
            <option>GPT-5.4-mini</option>
          </select>

          <input
            placeholder="Tools: Gmail, CRM, Calendar"
            value={form.tools}
            onChange={(e) => setForm({ ...form, tools: e.target.value })}
          />

          <input
            placeholder="Knowledge: SOP, Docs, Client Data"
            value={form.knowledge}
            onChange={(e) => setForm({ ...form, knowledge: e.target.value })}
          />

          <textarea
            rows="6"
            placeholder="System prompt: define how this agent thinks, behaves, and responds..."
            value={form.system_prompt}
            onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
          />

          <button className="primary-btn" onClick={createAgent}>
            Create Agent
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading agents...</p>
      ) : (
        <div className="card-grid">
          {agents.map((agent) => {
            const memories = memoryByAgent[agent.id] || [];
            const memoryForm = memoryForms[agent.id] || {
              memory: "",
              memory_type: "fact"
            };

            return (
              <div className="panel" key={agent.id}>
                <h3>{agent.name}</h3>
                <p>{agent.role}</p>
                <p><strong>Model:</strong> {agent.model}</p>
                <p><strong>Status:</strong> {agent.status}</p>
                <p><strong>Tools:</strong> {(agent.tools || []).join(", ") || "None"}</p>
                <p><strong>Knowledge:</strong> {(agent.knowledge || []).join(", ") || "None"}</p>

                <div className="system-prompt-box">
                  <strong>System Prompt</strong>
                  <pre>{agent.system_prompt || "No custom system prompt yet."}</pre>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "14px", justifyContent: "center" }}>
                  <button className="primary-btn" onClick={() => testAgent(agent)}>
                    Test Agent
                  </button>

                  <button className="primary-btn" onClick={() => toggleMemory(agent.id)}>
                    {openMemoryAgentId === agent.id ? "Hide Memory" : "View Memory"}
                  </button>

                  <button className="danger-btn" onClick={() => deleteAgent(agent.id)}>
                    Delete
                  </button>
                </div>

                {openMemoryAgentId === agent.id && (
                  <div className="panel" style={{ marginTop: "16px" }}>
                    <h4>Agent Memory</h4>

                    <div className="form-grid">
                      <select
                        value={memoryForm.memory_type}
                        onChange={(e) => updateMemoryForm(agent.id, "memory_type", e.target.value)}
                      >
                        <option value="fact">Fact</option>
                        <option value="lead">Lead</option>
                        <option value="preference">Preference</option>
                        <option value="note">Note</option>
                        <option value="result">Result</option>
                      </select>

                      <input
                        placeholder="Add memory e.g. John owns a dental clinic in Austin."
                        value={memoryForm.memory}
                        onChange={(e) => updateMemoryForm(agent.id, "memory", e.target.value)}
                      />

                      <button className="primary-btn" onClick={() => addMemory(agent.id)}>
                        Add Memory
                      </button>
                    </div>

                    {memories.length === 0 ? (
                      <p>No memory saved for this agent yet.</p>
                    ) : (
                      memories.map((memory) => (
                        <div className="list-card" key={memory.id}>
                          <p><strong>{memory.memory_type || "fact"}</strong></p>
                          <p>{memory.memory}</p>
                          <small>{new Date(memory.created_at).toLocaleString()}</small>
                          <br />
                          <button
                            className="danger-btn"
                            onClick={() => removeMemory(agent.id, memory.id)}
                          >
                            Delete Memory
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
