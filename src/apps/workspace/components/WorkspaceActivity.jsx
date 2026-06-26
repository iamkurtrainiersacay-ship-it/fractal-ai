export default function WorkspaceActivity() {
  const activity = [
    "Social Distribution upgraded",
    "Command Center added",
    "Applications Hub created",
    "Mission Control dashboard deployed"
  ];

  return (
    <section className="workspace-panel">
      <h2>Workspace Activity</h2>

      <div className="workspace-list">
        {activity.map((item) => (
          <div className="workspace-row" key={item}>
            <strong>{item}</strong>
            <span>Recent</span>
          </div>
        ))}
      </div>
    </section>
  );
}
