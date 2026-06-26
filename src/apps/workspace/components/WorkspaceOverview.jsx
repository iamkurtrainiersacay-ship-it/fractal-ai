import { useEffect, useState } from "react";
import { useWorkspace } from "../../../core/workspace/WorkspaceContext";
import { getAgents } from "../../../services/agentService";
import { getKnowledge } from "../../../services/knowledgeService";

export default function WorkspaceOverview() {
  const { workspace } = useWorkspace();
  const [counts, setCounts] = useState({ agents: 0, knowledge: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [agents, knowledge] = await Promise.all([
          getAgents(),
          getKnowledge()
        ]);
        setCounts({
          agents: agents?.length || 0,
          knowledge: knowledge?.length || 0
        });
      } catch {
        setCounts({ agents: 0, knowledge: 0 });
      }
    }
    load();
  }, [workspace.id]);

  const stats = [
    { label: "Workspace", value: workspace.name },
    { label: "Agents", value: String(counts.agents) },
    { label: "Knowledge Items", value: String(counts.knowledge) },
    { label: "Status", value: "Active" }
  ];

  return (
    <section className="workspace-panel">
      <h2>Overview</h2>

      <div className="workspace-stats">
        {stats.map((item) => (
          <div className="workspace-stat" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
