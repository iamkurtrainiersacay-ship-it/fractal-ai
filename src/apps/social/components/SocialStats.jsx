export default function SocialStats({ posts = [] }) {
  const drafts = posts.filter((p) => p.status === "Draft").length;
  const scheduled = posts.filter((p) => p.status === "Scheduled").length;
  const uploaded = posts.filter((p) => p.status === "Uploaded").length;
  const rejected = posts.filter((p) => p.status === "Rejected" || p.rejected).length;

  const stats = [
    { label: "Total Posts", value: posts.length },
    { label: "Drafts", value: drafts },
    { label: "Scheduled", value: scheduled },
    { label: "Uploaded", value: uploaded },
    { label: "Rejected", value: rejected }
  ];

  return (
    <div className="sd-stats">
      {stats.map((stat) => (
        <div key={stat.label} className="sd-stat-card">
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
