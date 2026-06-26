import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../../../core/workspace/WorkspaceContext";

export default function WorkspaceHeader() {
  const { workspace } = useWorkspace();
  const navigate = useNavigate();

  return (
    <section className="workspace-hero">
      <div>
        <p className="sd-eyebrow">Current Workspace</p>
        <h1>{workspace.name}</h1>
        <p>{workspace.description || "Unified context for agents, projects, knowledge, workflows, and operations."}</p>
      </div>

      <button className="primary-btn" onClick={() => navigate("/settings")}>
        Manage Workspaces
      </button>
    </section>
  );
}
