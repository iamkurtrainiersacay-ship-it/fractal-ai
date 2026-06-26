export default function WorkspaceProjects() {
  const projects = [
    "Fractal AI Platform",
    "Social Distribution Engine",
    "AI Sales Infrastructure",
    "Knowledge Operations"
  ];

  return (
    <section className="workspace-panel">
      <h2>Projects</h2>

      <div className="workspace-list">
        {projects.map((project) => (
          <div className="workspace-row" key={project}>
            <strong>{project}</strong>
            <span>Active</span>
          </div>
        ))}
      </div>
    </section>
  );
}
