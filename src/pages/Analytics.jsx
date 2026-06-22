import { useEffect, useState } from "react";
import { getAnalytics } from "../services/analyticsService";
import { getActivityLogs } from "../services/activityService";

export default function Analytics() {
  const [analytics, setAnalytics] = useState({
    runs: 0,
    tokens: 0,
    errors: 0,
    cost: 0
  });

  const [logs, setLogs] = useState([]);

  async function loadAnalytics() {
    const data = await getAnalytics();
    const logData = await getActivityLogs();

    setAnalytics(data);
    setLogs(logData || []);
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="page">
      <h1>Analytics</h1>
      <p className="muted">Agent usage, workflow runs, project activity, and API cost tracking.</p>

      <section className="stats-grid">
        <div className="stat-card"><p>Runs</p><h3>{analytics.runs}</h3></div>
        <div className="stat-card"><p>Tokens</p><h3>{analytics.tokens}</h3></div>
        <div className="stat-card"><p>Errors</p><h3>{analytics.errors}</h3></div>
        <div className="stat-card"><p>Cost</p><h3>${analytics.cost}</h3></div>
      </section>

      <div className="panel">
        <h3>Recent Runs</h3>

        {logs.length === 0 ? (
          <p>No runs yet.</p>
        ) : (
          logs.map((log) => (
            <div className="list-card" key={log.id}>
              <strong>{log.action}</strong>
              <p>{log.metadata?.agent_name || "Unknown agent"}</p>
              <p>{log.metadata?.prompt || "No prompt stored"}</p>
              <small>{new Date(log.created_at).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
