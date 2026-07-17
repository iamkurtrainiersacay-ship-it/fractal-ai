import { useWorkspace } from "../../../core/workspace/WorkspaceContext";

export default function WorkspaceBadge(){

const {workspace}=useWorkspace();

return(

<div className="workspace-badge">

<span>

Workspace

</span>

<strong>

{workspace.name}

</strong>

</div>

)

}
