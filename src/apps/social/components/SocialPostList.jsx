function normalizePlatform(platform) {
  if (platform === "X(Twitter)") return "X";
  return platform || "Unknown";
}

function statusClass(status) {
  return (status || "unknown").toLowerCase();
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
    <div className="sd-queue">
      <div className="sd-section-head">
        <h3>Content Queue</h3>
        <span>{posts.length} posts</span>
      </div>

      {posts.length === 0 ? (
        <div className="sd-empty-small">
          <h4>No posts found</h4>
          <p>Try another filter or refresh the queue.</p>
        </div>
      ) : (
        posts.map((post) => {
          const asset = assetMap[post.asset_id] || {};
          const title = asset.title || post.title || "Untitled Post";
          const checked = selectedIds.includes(post.id);

          return (
            <article
              key={post.id}
              className={`sd-post-card ${selectedPost?.id === post.id ? "active" : ""}`}
            >
              <div className="sd-post-top">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSelected?.(post.id)}
                />

                <button
                  type="button"
                  className="sd-post-main"
                  onClick={() => selectPost(post)}
                >
                  <strong>{title}</strong>
                  <span>{normalizePlatform(post.platform)}</span>
                </button>

                <span className={`sd-status ${statusClass(post.status)}`}>
                  {post.status || "Unknown"}
                </span>
              </div>

              <p onClick={() => selectPost(post)}>
                {(post.post_body || "").substring(0, 130)}...
              </p>
            </article>
          );
        })
      )}
    </div>
  );
}
