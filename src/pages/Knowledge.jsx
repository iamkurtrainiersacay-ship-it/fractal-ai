import { useEffect, useState } from "react";
import {
  getKnowledge,
  createKnowledge,
  deleteKnowledge
} from "../services/knowledgeService";
import { getAgents } from "../services/agentService";

export default function Knowledge() {
  const [items, setItems] = useState([]);
  const [agents, setAgents] = useState([]);

  const [form, setForm] = useState({
    title: "",
    type: "SOP",
    content: "",
    tags: "",
    agent_id: ""
  });

  async function loadData() {
    const knowledgeData = await getKnowledge();
    const agentData = await getAgents();

    setItems(knowledgeData || []);
    setAgents(agentData || []);
  }

  async function addKnowledge() {
    if (!form.title || !form.content) {
      alert("Title and content are required.");
      return;
    }

    await createKnowledge({
      title: form.title,
      type: form.type,
      content: form.content,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      agent_id: form.agent_id || null
    });

    setForm({
      title: "",
      type: "SOP",
      content: "",
      tags: "",
      agent_id: ""
    });

    loadData();
  }

  async function removeKnowledge(id) {
    await deleteKnowledge(id);
    loadData();
  }

  function getAgentName(agentId) {
    if (!agentId) return "Global";
    const agent = agents.find((item) => item.id === agentId);
    return agent ? agent.name : "Unknown agent";
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="page">
      <h1>Knowledge</h1>
      <p className="muted">
        Fractal memory system: SOPs, prompts, workflows, client data, and research.
      </p>

      <div className="panel">
        <h3>Add Knowledge</h3>

        <div className="form-grid">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option>SOP</option>
            <option>Prompt</option>
            <option>System</option>
            <option>Workflow</option>
            <option>Client</option>
            <option>Research</option>
          </select>

          <select
            value={form.agent_id}
            onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
          >
            <option value="">Global Knowledge</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Tags: marketing, social, automation"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />

          <textarea
            placeholder="Knowledge content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows="5"
          />

          <button className="primary-btn" onClick={addKnowledge}>
            Save Knowledge
          </button>
        </div>
      </div>

      <div className="card-grid">
        {items.map((item) => (
          <div className="panel" key={item.id}>
            <h3>{item.title}</h3>
            <p><strong>Type:</strong> {item.type}</p>
            <p><strong>Assigned To:</strong> {getAgentName(item.agent_id)}</p>
            <p>{item.content}</p>
            <p><strong>Tags:</strong> {(item.tags || []).join(", ") || "None"}</p>

            <button className="danger-btn" onClick={() => removeKnowledge(item.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
