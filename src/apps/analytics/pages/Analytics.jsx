import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { motion } from "framer-motion";
import { BarChart3, RefreshCw, TrendingUp, Cpu, DollarSign, AlertCircle } from "lucide-react";
import { getAnalytics } from "../services/analyticsService";
import { getActivityLogs } from "../../../services/activityService";
import { SkeletonPage } from "../../../shared/components/Skeleton";

const CHART_COLORS = {
  primary: "#8b5cf6",
  accent: "#06b6d4",
  green: "#34d399",
  amber: "#fbbf24",
  gridStroke: "rgba(139, 92, 246, 0.06)",
  tickFill: "#71717a"
};

const DATE_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: null }
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(9,9,11,0.95)", border: "1px solid rgba(139,92,246,0.2)",
      borderRadius: "10px", padding: "10px 14px", fontSize: "13px"
    }}>
      <p style={{ fontWeight: 700, marginBottom: "4px", color: "var(--text-muted)", fontSize: "11px" }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: "2px 0" }}>
          {entry.name}:{" "}
          {entry.name === "Cost" ? `$${Number(entry.value).toFixed(4)}` : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <motion.div
      className="analytics-stat-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="analytics-stat-icon" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <strong className="analytics-stat-value">{value}</strong>
        <span className="analytics-stat-label">{label}</span>
        {sub && <span className="analytics-stat-sub">{sub}</span>}
      </div>
    </motion.div>
  );
}

function filterByDays(daily, days) {
  if (!days) return daily;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return daily.filter(d => {
    try {
      return new Date(d.date) >= cutoff;
    } catch {
      return true;
    }
  });
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState({
    runs: 0, tokens: 0, errors: 0, cost: 0, daily: [], byAgent: []
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  async function load(showRefreshIndicator = false) {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const [data, logData] = await Promise.all([
        getAnalytics(),
        getActivityLogs()
      ]);
      setAnalytics(data);
      setLogs((logData || []).slice(0, 25));
    } catch {
      toast.error("Failed to load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const selectedRange = DATE_RANGES.find(r => r.label === dateRange);
  const filteredDaily = filterByDays(analytics.daily || [], selectedRange?.days);

  const filteredRuns = filteredDaily.reduce((s, d) => s + (d.runs || 0), 0);
  const filteredTokens = filteredDaily.reduce((s, d) => s + (d.tokens || 0), 0);
  const filteredCost = filteredDaily.reduce((s, d) => s + (d.cost || 0), 0);

  function relTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  if (loading) return <SkeletonPage rows={8} />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="muted">Agent usage, token tracking, and cost intelligence.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Date range filter */}
          <div className="analytics-range-tabs">
            {DATE_RANGES.map(({ label }) => (
              <button
                key={label}
                className={`analytics-range-btn ${dateRange === label ? "active" : ""}`}
                onClick={() => setDateRange(label)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="secondary-btn"
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ padding: "8px 12px" }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="analytics-stats-row">
        <StatCard
          icon={TrendingUp}
          label="Agent Runs"
          value={filteredRuns.toLocaleString()}
          color={CHART_COLORS.primary}
          sub={dateRange === "All" ? "all time" : `last ${dateRange}`}
        />
        <StatCard
          icon={Cpu}
          label="Tokens Used"
          value={filteredTokens.toLocaleString()}
          color={CHART_COLORS.accent}
        />
        <StatCard
          icon={DollarSign}
          label="Total Cost"
          value={`$${filteredCost.toFixed(4)}`}
          color={CHART_COLORS.green}
        />
        <StatCard
          icon={AlertCircle}
          label="Active Agents"
          value={analytics.byAgent?.length || 0}
          color={CHART_COLORS.amber}
        />
      </div>

      {/* Charts */}
      <div className="analytics-grid">
        <div className="chart-card">
          <h3>Runs Over Time</h3>
          {filteredDaily.length === 0 ? (
            <div className="chart-empty">
              <BarChart3 size={28} style={{ color: "var(--text-muted)" }} />
              <p className="muted">No run data for this period.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={filteredDaily}>
                <defs>
                  <linearGradient id="runsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} />
                <XAxis dataKey="date" tick={{ fill: CHART_COLORS.tickFill, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART_COLORS.tickFill, fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="runs" name="Runs"
                  stroke={CHART_COLORS.primary} strokeWidth={2}
                  fill="url(#runsGrad)"
                  dot={{ r: 3, fill: CHART_COLORS.primary }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Tokens Over Time</h3>
          {filteredDaily.length === 0 ? (
            <div className="chart-empty">
              <p className="muted">No token data for this period.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filteredDaily}>
                <defs>
                  <linearGradient id="tokensGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} />
                <XAxis dataKey="date" tick={{ fill: CHART_COLORS.tickFill, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART_COLORS.tickFill, fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="tokens" name="Tokens" fill="url(#tokensGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Cost Over Time</h3>
          {filteredDaily.length === 0 ? (
            <div className="chart-empty">
              <p className="muted">No cost data for this period.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={filteredDaily}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} />
                <XAxis dataKey="date" tick={{ fill: CHART_COLORS.tickFill, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART_COLORS.tickFill, fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="cost" name="Cost"
                  stroke={CHART_COLORS.green} strokeWidth={2}
                  fill="url(#costGrad)"
                  dot={{ r: 3, fill: CHART_COLORS.green }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Top Agents by Runs</h3>
          {analytics.byAgent.length === 0 ? (
            <div className="chart-empty">
              <p className="muted">Run some agents to see rankings.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.byAgent.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} />
                <XAxis type="number" tick={{ fill: CHART_COLORS.tickFill, fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: CHART_COLORS.tickFill, fontSize: 11 }} width={110} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="runs" name="Runs" fill={CHART_COLORS.amber} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div className="panel" style={{ marginTop: "20px" }}>
        <h3 style={{ marginBottom: "16px" }}>Recent Activity</h3>
        {logs.length === 0 ? (
          <p className="muted">No activity recorded yet.</p>
        ) : (
          <div className="analytics-feed">
            {logs.map(log => (
              <div className="analytics-feed-item" key={log.id}>
                <div className="analytics-feed-dot" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>
                    {log.metadata?.agent_name || log.action}
                  </span>
                  {log.metadata?.total_tokens && (
                    <span style={{ marginLeft: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
                      {log.metadata.total_tokens.toLocaleString()} tokens
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{relTime(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
