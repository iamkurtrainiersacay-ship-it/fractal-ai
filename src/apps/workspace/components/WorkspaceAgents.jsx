export default function WorkspaceAgents() {
  const agents = [
    "Kurt OS",
    "Marketing Agent",
    "Research Agent",
    "Operations Agent",
    "Sales Agent"
  ];

  return (
    <section className="workspace-panel">
      <h2>AI Team</h2>

      <div className="workspace-list">
        {agents.map((agent) => (
          <div className="workspace-row" key={agent}>
            <strong>{agent}</strong>
            <span>Ready</span>
          </div>
        ))}
      </div>
    </section>
  );
}
