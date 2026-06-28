import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { getAnalytics } from "../services/analyticsService";
import { getActivityLogs } from "../../../services/activityService";

const CHART_COLORS = {
  primary: "#8b5cf6",
  accent: "#06b6d4",
  green: "#34d399",
  amber: "#fbbf24",
  gridStroke: "rgba(139, 92, 246, 0.06)",
  tickFill: "#71717a"
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(9, 9, 11, 0.95)",
      border: "1px solid rgba(139, 92, 246, 0.2)",
      borderRadius: "10px",
      padding: "10px 14px",
      fontSize: "13px"
    }}>
      <p style={{ fontWeight: 700, marginBottom: "4px" }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: "2px 0" }}>
          {entry.name}: {typeof entry.value === "number" && entry.name === "Cost"
            ? `$${entry.value.toFixed(4)}`
            : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState({
    runs: 0, tokens: 0, errors: 0, cost: 0, daily: [], byAgent: []
  });
  const [logs, setLogs] = useState([]);

  async function loadAnalytics() {
    try {
      const [data, logData] = await Promise.all([
        getAnalytics(),
        getActivityLogs()
      ]);
      setAnalytics(data);
      setLogs((logData || []).slice(0, 20));
    } catch (err) {
      toast.error("Failed to load analytics.");
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Agent usage, workflow runs, and API cost tracking.</p>
      </div>

      <section className="analytics-summary">
        <div className="analytics-summary-card">
          <span>Total Runs</span>
          <strong>{analytics.runs}</strong>
        </div>
        <div className="analytics-summary-card">
          <span>Tokens Used</span>
          <strong>{analytics.tokens.toLocaleString()}</strong>
        </div>
        <div className="analytics-summary-card">
          <span>Errors</span>
          <strong>{analytics.errors}</strong>
        </div>
        <div className="analytics-summary-card">
          <span>Total Cost</span>
          <strong>${analytics.cost}</strong>
        </div>
        <div className="analytics-summary-card">
          <span>Agents Active</span>
          <strong>{analytics.byAgent?.length || 0}</strong>
        </div>
      </section>

      <section className="analytics-grid">
        <div className="chart-card">
          <h3>Runs Over Time</h3>
          {analytics.daily.length === 0 ? (
            <p className="muted">No run data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} />
                <XAxis dataKey="date" tick={{ fill: CHART_COLORS.tickFill, fontSize: 12 }} />
                <YAxis tick={{ fill: CHART_COLORS.tickFill, fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="runs"
                  name="Runs"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS.primary }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Tokens Over Time</h3>
          {analytics.daily.length === 0 ? (
            <p className="muted">No token data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} />
                <XAxis dataKey="date" tick={{ fill: CHART_COLORS.tickFill, fontSize: 12 }} />
                <YAxis tick={{ fill: CHART_COLORS.tickFill, fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="tokens" name="Tokens" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Cost Over Time</h3>
          {analytics.daily.length === 0 ? (
            <p className="muted">No cost data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} />
                <XAxis dataKey="date" tick={{ fill: CHART_COLORS.tickFill, fontSize: 12 }} />
                <YAxis tick={{ fill: CHART_COLORS.tickFill, fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cost"
                  name="Cost"
                  stroke={CHART_COLORS.green}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS.green }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Runs by Agent</h3>
          {analytics.byAgent.length === 0 ? (
            <p className="muted">No agent data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.byAgent} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} />
                <XAxis type="number" tick={{ fill: CHART_COLORS.tickFill, fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: CHART_COLORS.tickFill, fontSize: 12 }} width={120} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="runs" name="Runs" fill={CHART_COLORS.amber} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="panel" style={{ marginTop: "18px" }}>
        <h3>Recent Activity</h3>
        <div className="activity-feed" style={{ marginTop: "14px" }}>
          {logs.length === 0 ? (
            <p className="muted">No activity recorded yet.</p>
          ) : (
            logs.map((log) => (
              <div className="activity-item" key={log.id}>
                <span>{log.action}</span>
                <p>{log.metadata?.agent_name || log.entity_type || "System"}</p>
                <small style={{ marginLeft: "auto", color: "var(--text-muted)" }}>
                  {new Date(log.created_at).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
