import { createContext, useContext, useEffect, useState } from "react";
import { getWorkspaces, WORKSPACE_STORAGE_KEY } from "../../services/workspaceService";

const WorkspaceContext = createContext();

const STORAGE_KEY = WORKSPACE_STORAGE_KEY;
const OLD_STORAGE_KEY = "fractal_workspace_id";

const fallbackWorkspace = {
  id: "default",
  name: "Default Workspace",
  description: "Primary AI Operations Workspace"
};

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [workspace, setWorkspaceState] = useState(fallbackWorkspace);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function loadWorkspaces() {
    // Migrate old key once
    const oldVal = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldVal && !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, oldVal);
      localStorage.removeItem(OLD_STORAGE_KEY);
    }

    try {
      const data = await getWorkspaces();

      if (data.length > 0) {
        setWorkspaces(data);

        const savedId = localStorage.getItem(STORAGE_KEY);
        const saved = data.find((w) => w.id === savedId);

        setWorkspaceState(saved || data[0]);
      } else {
        setWorkspaces([]);
        setWorkspaceState(fallbackWorkspace);
      }
    } catch {
      setWorkspaces([]);
      setWorkspaceState(fallbackWorkspace);
    } finally {
      setLoading(false);
    }
  }

  function switchWorkspace(ws) {
    setWorkspaceState(ws);
    localStorage.setItem(STORAGE_KEY, ws.id);
  }

  const value = {
    workspace,
    workspaces,
    loading,
    switchWorkspace,
    refreshWorkspaces: loadWorkspaces
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
