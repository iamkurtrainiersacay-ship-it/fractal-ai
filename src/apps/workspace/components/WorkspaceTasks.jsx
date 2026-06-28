import { useEffect, useState } from "react";
import { getActivityLogs } from "../../../services/activityService";

export default function WorkspaceTasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    getActivityLogs()
      .then((logs) => {
        const recent = (logs || [])
          .filter((log) => log.action === "agent_run" || log.action === "workflow_run")
          .slice(0, 6)
          .map((log) => ({
            id: log.id,
            label: log.metadata?.agent_name
              ? `Run ${log.metadata.agent_name}`
              : log.action,
            status: "Completed"
          }));
        setTasks(recent);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="workspace-panel">
      <h2>Recent Tasks</h2>

      <div className="workspace-list">
        {tasks.length === 0 && <p className="muted">No tasks recorded yet.</p>}
        {tasks.map((task) => (
          <div className="workspace-row" key={task.id}>
            <strong>{task.label}</strong>
            <span>{task.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
