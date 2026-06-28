import { useEffect, useState } from "react";
import { getAgents } from "../../../services/agentService";

export default function WorkspaceAgents() {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    getAgents().then((data) => setAgents(data || [])).catch(() => {});
  }, []);

  return (
    <section className="workspace-panel">
      <h2>AI Team</h2>

      <div className="workspace-list">
        {agents.length === 0 && <p className="muted">No agents installed yet.</p>}
        {agents.map((agent) => (
          <div className="workspace-row" key={agent.id}>
            <strong>{agent.name}</strong>
            <span>{agent.status || "Ready"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
