function normalizePlatform(platform) {
  if (platform === "X(Twitter)") return "X";
  return platform || "Unknown";
}

function statusColor(status) {
  switch (status) {
    case "Draft": return "draft";
    case "Scheduled": return "scheduled";
    case "Uploaded": return "uploaded";
    case "Rejected": return "rejected";
    default: return "";
  }
}

export default function SocialPostList({
  posts = [],
  selectedPost,
  selectPost,
  assetMap = {},
  selectedIds = [],
  toggleSelected
}) {
  return (
    <div className="social-post-list">
      <h3>Content Queue</h3>

      {posts.length === 0 ? (
        <p>No posts found.</p>
      ) : (
        posts.map((post) => {
          const asset = assetMap[post.asset_id] || {};
          const checked = selectedIds.includes(post.id);

          return (
            <div
              key={post.id}
              className={`social-post-card ${selectedPost?.id === post.id ? "active" : ""}`}
            >
              <div className="post-card-header">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSelected(post.id)}
                />

                <div onClick={() => selectPost(post)} className="post-card-click">
                  <h4>{asset.title || post.title || "Untitled Post"}</h4>
                  <span className="platform">{normalizePlatform(post.platform)}</span>
                </div>

                <span className={`status-badge ${statusColor(post.status)}`}>
                  {post.status}
                </span>
              </div>

              <p onClick={() => selectPost(post)}>
                {(post.post_body || "").substring(0, 120)}...
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}
