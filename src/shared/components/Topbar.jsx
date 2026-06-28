import { useState, useEffect } from "react";
import { LogOut, Clock, User } from "lucide-react";
import { useWorkspace } from "../../core/workspace/WorkspaceContext";
import { getSession, logoutUser } from "../../services/authService";
import { endSessionTracking, getSessionDuration } from "../../services/sessionService";

export default function Topbar() {
  const { workspace } = useWorkspace();
  const session = getSession();
  const username = session?.user?.username || session?.username || "User";
  const [duration, setDuration] = useState(getSessionDuration());

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(getSessionDuration());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  function handleLogout() {
    endSessionTracking();
    logoutUser();
    window.location.href = "/";
  }

  return (
    <header className="topbar">
      <div className="workspace-badge">
        <span>Current Workspace</span>
        <strong>{workspace.name}</strong>
      </div>

      <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span className="topbar-status">● System Live</span>

        <div className="topbar-session">
          <Clock size={13} />
          <span>{duration}</span>
        </div>

        <div className="topbar-user">
          <User size={13} />
          <span>{username}</span>
        </div>

        <button className="topbar-logout" onClick={handleLogout} title="Log out">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
