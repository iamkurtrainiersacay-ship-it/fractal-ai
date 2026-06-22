import { useEffect, useState } from "react";
import { Bot, Database, Workflow, Brain, Activity } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getActivityLogs } from "../services/activityService";

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    agents: 0,
    projects: 0,
    workflows: 0,
    knowledge: 0
  });

  const [logs, setLogs] = useState([]);

  async function loadMetrics() {
    const tables = ["agents", "projects", "workflows", "knowledge"];

    const results = await Promise.all(
      tables.map((table) =>
        supabase.from(table).select("*", { count: "exact", head: true })
      )
    );

    setMetrics({
      agents: results[0].count || 0,
      projects: results[1].count || 0,
      workflows: results[2].count || 0,
      knowledge: results[3].count || 0
    });
  }

  async function loadLogs() {
    const data = await getActivityLogs();
    setLogs(data.slice(0, 10));
  }

  useEffect(() => {
    loadMetrics();
    loadLogs();
  }, []);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p className="muted">Live Fractal system overview from Supabase.</p>

      <section className="stats-grid">
        <div className="stat-card"><Bot /><p>Agents</p><h3>{metrics.agents}</h3></div>
        <div className="stat-card"><Database /><p>Projects</p><h3>{metrics.projects}</h3></div>
        <div className="stat-card"><Brain /><p>Knowledge</p><h3>{metrics.knowledge}</h3></div>
        <div className="stat-card"><Workflow /><p>Workflows</p><h3>{metrics.workflows}</h3></div>
      </section>

      <section className="grid-two">
        <div className="panel">
          <h3>System Status</h3>
          <p>Supabase: Connected</p>
          <p>Agents: Online</p>
          <p>Knowledge Base: Active</p>
          <p>Projects Registry: Active</p>
          <p>Workflow Engine: Active</p>
        </div>

        <div className="panel">
          <h3>Recent Activity</h3>

          {logs.length === 0 ? (
            <p>No activity yet.</p>
          ) : (
            logs.map((log) => (
              <div className="list-card" key={log.id}>
                <Activity size={16} />
                <div>
                  <strong>{log.action}</strong>
                  <p>{new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
