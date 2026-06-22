import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    role: "",
    model: "GPT-5.5",
    tools: "",
    knowledge: ""
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
      knowledge: form.knowledge.split(",").map((x) => x.trim()).filter(Boolean)
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
      knowledge: ""
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
        Create, assign tools, assign knowledge, select model, and test agents.
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

          <button className="primary-btn" onClick={createAgent}>
            Create Agent
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading agents...</p>
      ) : (
        <div className="card-grid">
          {agents.map((agent) => (
            <div className="panel" key={agent.id}>
              <h3>{agent.name}</h3>
              <p>{agent.role}</p>
              <p><strong>Model:</strong> {agent.model}</p>
              <p><strong>Status:</strong> {agent.status}</p>
              <p><strong>Tools:</strong> {(agent.tools || []).join(", ") || "None"}</p>
              <p><strong>Knowledge:</strong> {(agent.knowledge || []).join(", ") || "None"}</p>

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button className="primary-btn" onClick={() => testAgent(agent)}>
                  Test Agent
                </button>

                <button className="danger-btn" onClick={() => deleteAgent(agent.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
