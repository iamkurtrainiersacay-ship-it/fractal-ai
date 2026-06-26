export default function ActivityFeed({ items = [] }) {
  return (
    <div className="activity-feed">
      <div className="sd-section-head">
        <h3>Recent Activity</h3>
      </div>

      {items.length === 0 ? (
        <p className="muted">No activity yet.</p>
      ) : (
        items.map((item, index) => (
          <div className="activity-item" key={index}>
            <span>{item.time}</span>
            <p>{item.message}</p>
          </div>
        ))
      )}
    </div>
  );
}
