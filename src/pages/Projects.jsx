import { useEffect, useState } from "react";
import {
  getProjects,
  createProject,
  deleteProject
} from "../services/projectService";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    github_repo: "",
    local_path: "",
    commands: ""
  });

  async function loadProjects() {
    const data = await getProjects();
    setProjects(data || []);
  }

  async function addProject() {
    if (!form.name) return alert("Project name is required.");

    await createProject({
      name: form.name,
      description: form.description,
      github_repo: form.github_repo,
      local_path: form.local_path,
      status: "Building",
      commands: form.commands
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    });

    setForm({
      name: "",
      description: "",
      github_repo: "",
      local_path: "",
      commands: ""
    });

    loadProjects();
  }

  async function removeProject(id) {
    await deleteProject(id);
    loadProjects();
  }

  function launchProject(project) {
    alert(`Launch request for ${project.name}\nPath: ${project.local_path || "No path"}\nCommand: ${(project.commands || [])[0] || "No command"}`);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="page">
      <h1>Projects</h1>
      <p className="muted">Connect GitHub repo, store commands, launch services, and track status.</p>

      <div className="panel">
        <h3>Create Project</h3>

        <div className="form-grid">
          <input placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input placeholder="GitHub repo URL" value={form.github_repo} onChange={(e) => setForm({ ...form, github_repo: e.target.value })} />
          <input placeholder="Local path e.g. C:\Users\iamku\fractal-ai" value={form.local_path} onChange={(e) => setForm({ ...form, local_path: e.target.value })} />
          <input placeholder="Commands e.g. npm run dev, npm run build" value={form.commands} onChange={(e) => setForm({ ...form, commands: e.target.value })} />

          <button className="primary-btn" onClick={addProject}>Create Project</button>
        </div>
      </div>

      <div className="card-grid">
        {projects.map((project) => (
          <div className="panel" key={project.id}>
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <p><strong>Status:</strong> {project.status}</p>
            <p><strong>GitHub:</strong> {project.github_repo || "Not connected"}</p>
            <p><strong>Local Path:</strong> {project.local_path || "Not set"}</p>
            <p><strong>Commands:</strong> {(project.commands || []).join(", ") || "None"}</p>

            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button className="primary-btn" onClick={() => launchProject(project)}>Launch Service</button>
              <button className="danger-btn" onClick={() => removeProject(project.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
