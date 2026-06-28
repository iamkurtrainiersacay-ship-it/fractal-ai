import { useEffect, useState } from "react";
import { getActivityLogs } from "../../../services/activityService";

export default function WorkspaceActivity() {
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    getActivityLogs()
      .then((logs) => setActivity((logs || []).slice(0, 8)))
      .catch(() => {});
  }, []);

  function formatTime(timestamp) {
    if (!timestamp) return "";
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <section className="workspace-panel">
      <h2>Workspace Activity</h2>

      <div className="workspace-list">
        {activity.length === 0 && <p className="muted">No activity yet.</p>}
        {activity.map((item) => (
          <div className="workspace-row" key={item.id}>
            <strong>
              {item.metadata?.agent_name || item.action}
              {item.entity_type ? ` (${item.entity_type})` : ""}
            </strong>
            <span>{formatTime(item.created_at)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
