import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend
} from "recharts";

const COLORS = [
  "#38bdf8",
  "#7c3aed",
  "#10b981",
  "#f59e0b",
  "#ef4444"
];

export default function SocialAnalytics({ posts = [] }) {
  const platformCounts = {};
  const statusCounts = {};

  posts.forEach((post) => {
    const platform =
      post.platform === "X(Twitter)"
        ? "X"
        : post.platform || "Unknown";

    platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    statusCounts[post.status || "Unknown"] =
      (statusCounts[post.status || "Unknown"] || 0) + 1;
  });

  const platformData = Object.entries(platformCounts).map(([name, value]) => ({
    name,
    value
  }));

  const statusData = Object.entries(statusCounts).map(([status, value]) => ({
    status,
    value
  }));

  const platforms = Object.keys(platformCounts).length;
  const drafts = statusCounts.Draft || 0;
  const scheduled = statusCounts.Scheduled || 0;
  const uploaded = statusCounts.Uploaded || 0;
  const rejected = statusCounts.Rejected || 0;

  const draftRate = posts.length ? Math.round((drafts / posts.length) * 100) : 0;
  const rejectedRate = posts.length ? Math.round((rejected / posts.length) * 100) : 0;
  const publishedRate = posts.length ? Math.round(((uploaded + scheduled) / posts.length) * 100) : 0;

  return (
    <div className="sd-analytics">
      <div className="sd-section-head">
        <div>
          <h2>Social Analytics</h2>
          <p>Publishing health, platform mix, and content pipeline status.</p>
        </div>
      </div>

      <div className="analytics-summary">
        <div className="analytics-summary-card">
          <span>Total Posts</span>
          <strong>{posts.length}</strong>
          <small>All generated content</small>
        </div>

        <div className="analytics-summary-card">
          <span>Platforms</span>
          <strong>{platforms}</strong>
          <small>Active distribution channels</small>
        </div>

        <div className="analytics-summary-card">
          <span>Draft Rate</span>
          <strong>{draftRate}%</strong>
          <small>{drafts} posts awaiting review</small>
        </div>

        <div className="analytics-summary-card">
          <span>Publish Pipeline</span>
          <strong>{publishedRate}%</strong>
          <small>{scheduled + uploaded} scheduled or uploaded</small>
        </div>

        <div className="analytics-summary-card">
          <span>Rejected</span>
          <strong>{rejectedRate}%</strong>
          <small>{rejected} posts rejected</small>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="chart-card">
          <h3>Platform Distribution</h3>

          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={platformData}
                dataKey="value"
                outerRadius={110}
                label
              >
                {platformData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Post Status</h3>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.18)" />
              <XAxis dataKey="status" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#38bdf8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
