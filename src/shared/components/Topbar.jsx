import { useWorkspace } from "../../core/workspace/WorkspaceContext";

export default function Topbar() {
  const { workspace } = useWorkspace();

  return (
    <header className="topbar">
      <div className="workspace-badge">
        <span>Current Workspace</span>
        <strong>{workspace.name}</strong>
      </div>

      <div className="topbar-right">
        <span className="topbar-status">● System Live</span>
      </div>
    </header>
  );
}
