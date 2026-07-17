import WorkspaceHeader from "../components/WorkspaceHeader";
import WorkspaceOverview from "../components/WorkspaceOverview";
import WorkspaceProjects from "../components/WorkspaceProjects";
import WorkspaceAgents from "../components/WorkspaceAgents";
import WorkspaceTasks from "../components/WorkspaceTasks";
import WorkspaceActivity from "../components/WorkspaceActivity";

export default function Workspace() {
  return (
    <div className="workspace-page">
      <WorkspaceHeader />

      <div className="workspace-grid-main">
        <WorkspaceOverview />
        <WorkspaceAgents />
      </div>

      <div className="workspace-grid-main">
        <WorkspaceProjects />
        <WorkspaceTasks />
      </div>

      <WorkspaceActivity />
    </div>
  );
}
