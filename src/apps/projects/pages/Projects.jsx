import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FolderOpen, Plus, Trash2, ExternalLink, Play,
  GitBranch, X, ChevronDown
} from "lucide-react";
import { SkeletonPage } from "../../../shared/components/Skeleton";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject
} from "../services/projectService";

const STATUSES = ["Planning", "Building", "Live", "Paused"];

const STATUS_COLORS = {
  Planning: "var(--blue)",
  Building: "var(--primary)",
  Live: "var(--green)",
  Paused: "var(--text-muted)"
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || "var(--text-muted)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      fontSize: "11px", fontWeight: 600, color: c,
      background: `${c}18`, border: `1px solid ${c}30`,
      borderRadius: "var(--radius-pill)", padding: "3px 10px"
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c, flexShrink: 0 }} />
      {status}
    </span>
  );
}

function ProjectCard({ project, onDelete, onStatusChange }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  return (
    <motion.div
      className="proj-card"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
      <div className="proj-card-header">
        <div className="proj-card-icon">
          <FolderOpen size={18} style={{ color: "var(--primary)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3>{project.name}</h3>
          {project.description && <p className="muted" style={{ fontSize: "13px", margin: "2px 0 0" }}>{project.description}</p>}
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="proj-card-meta">
        {project.github_repo && (
          <a href={project.github_repo} target="_blank" rel="noreferrer" className="proj-meta-link">
            <GitBranch size={12} /> {project.github_repo.replace("https://github.com/", "")}
          </a>
        )}
        {project.local_path && (
          <span className="proj-meta-chip">
            <ExternalLink size={11} /> {project.local_path}
          </span>
        )}
      </div>

      {(project.commands || []).length > 0 && (
        <div className="proj-commands">
          {project.commands.map((cmd, i) => (
            <code key={i} className="proj-cmd">{cmd}</code>
          ))}
        </div>
      )}

      <div className="proj-card-actions">
        <div style={{ position: "relative" }}>
          <button
            className="secondary-btn proj-status-btn"
            onClick={() => setChangingStatus(!changingStatus)}
          >
            {project.status} <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {changingStatus && (
              <motion.div
                className="proj-status-menu"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                {STATUSES.filter(s => s !== project.status).map(s => (
                  <button key={s} onClick={() => { onStatusChange(project.id, s); setChangingStatus(false); }}>
                    <StatusBadge status={s} />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          className="secondary-btn"
          onClick={() => {
            const cmd = (project.commands || [])[0];
            if (cmd) toast.success(`Launch: ${cmd}`, { duration: 4000 });
            else toast("No launch command set.", { icon: "ℹ️" });
          }}
        >
          <Play size={12} /> Launch
        </button>

        {confirmDelete ? (
          <>
            <span style={{ fontSize: "12px", color: "var(--red)" }}>Sure?</span>
            <button className="danger-btn" onClick={() => onDelete(project.id)}>Yes, delete</button>
            <button className="secondary-btn" onClick={() => setConfirmDelete(false)}>No</button>
          </>
        ) : (
          <button className="danger-btn" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [form, setForm] = useState({
    name: "", description: "", github_repo: "", local_path: "", commands: ""
  });

  async function load() {
    try {
      const data = await getProjects();
      setProjects(data || []);
    } catch {
      toast.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.name.trim()) { toast.error("Project name required."); return; }
    try {
      await createProject({
        name: form.name.trim(),
        description: form.description.trim(),
        github_repo: form.github_repo.trim(),
        local_path: form.local_path.trim(),
        status: "Planning",
        commands: form.commands.split(",").map(x => x.trim()).filter(Boolean)
      });
      setForm({ name: "", description: "", github_repo: "", local_path: "", commands: "" });
      setShowForm(false);
      toast.success("Project created.");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to create.");
    }
  }

  async function handleDelete(id) {
    await deleteProject(id);
    toast.success("Project deleted.");
    load();
  }

  async function handleStatusChange(id, status) {
    await updateProject(id, { status });
    load();
  }

  useEffect(() => { load(); }, []);

  const filtered = filterStatus === "All"
    ? projects
    : projects.filter(p => p.status === filterStatus);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = projects.filter(p => p.status === s).length;
    return acc;
  }, {});

  if (loading) return <SkeletonPage rows={6} />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="muted">Track builds, connect GitHub repos, and monitor deployments.</p>
        </div>
        <motion.button
          className="primary-btn"
          onClick={() => setShowForm(!showForm)}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        >
          <Plus size={16} /> New Project
        </motion.button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ marginBottom: "20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3>New Project</h3>
              <button className="secondary-btn" onClick={() => setShowForm(false)} style={{ padding: "6px 8px" }}>
                <X size={14} />
              </button>
            </div>
            <div className="proj-form-grid">
              <input placeholder="Project name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input placeholder="GitHub URL" value={form.github_repo} onChange={e => setForm({ ...form, github_repo: e.target.value })} />
              <input placeholder="Local path (e.g. C:\projects\myapp)" value={form.local_path} onChange={e => setForm({ ...form, local_path: e.target.value })} />
              <input
                placeholder="Launch commands, comma-separated (e.g. npm run dev, npm run build)"
                value={form.commands}
                onChange={e => setForm({ ...form, commands: e.target.value })}
                style={{ gridColumn: "1 / -1" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
              <motion.button className="primary-btn" onClick={handleCreate} whileHover={{ scale: 1.02 }}>
                Create Project
              </motion.button>
              <button className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status filter */}
      <div className="proj-filter-bar">
        {["All", ...STATUSES].map(s => (
          <button
            key={s}
            className={`proj-filter-btn ${filterStatus === s ? "active" : ""}`}
            onClick={() => setFilterStatus(s)}
          >
            {s}
            <span className="proj-filter-count">
              {s === "All" ? projects.length : counts[s] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "48px" }}>
          <FolderOpen size={32} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
          <p className="muted">
            {filterStatus === "All" ? "No projects yet." : `No ${filterStatus} projects.`}
          </p>
          {filterStatus === "All" && (
            <button className="primary-btn" style={{ marginTop: "12px" }} onClick={() => setShowForm(true)}>
              <Plus size={14} /> Create your first project
            </button>
          )}
        </div>
      ) : (
        <motion.div className="proj-grid" layout>
          <AnimatePresence>
            {filtered.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
