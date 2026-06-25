export default function SocialStats({ posts = [] }) {
  const drafts = posts.filter((p) => p.status === "Draft").length;
  const scheduled = posts.filter((p) => p.status === "Scheduled").length;
  const uploaded = posts.filter((p) => p.status === "Uploaded").length;
  const rejected = posts.filter(
    (p) => p.status === "Rejected" || p.rejected
  ).length;

  const stats = [
    { label: "Total Posts", value: posts.length },
    { label: "Drafts", value: drafts },
    { label: "Scheduled", value: scheduled },
    { label: "Uploaded", value: uploaded },
    { label: "Rejected", value: rejected }
  ];

  return (
    <div>
      <h2 className="section-title">Social Command Center</h2>

      <div className="social-stats-grid">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="stat-card"
          >
            <h2>{stat.value}</h2>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}