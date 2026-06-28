import { useEffect, useState } from "react";
import { getProjects } from "../../projects/services/projectService";

export default function WorkspaceProjects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    getProjects().then((data) => setProjects(data || [])).catch(() => {});
  }, []);

  return (
    <section className="workspace-panel">
      <h2>Projects</h2>

      <div className="workspace-list">
        {projects.length === 0 && <p className="muted">No projects yet.</p>}
        {projects.map((project) => (
          <div className="workspace-row" key={project.id}>
            <strong>{project.name}</strong>
            <span>{project.status || "Active"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
