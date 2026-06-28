import { useState } from "react";

const PAGE_SIZE = 25;

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
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const paginated = posts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function goTo(p) {
    setPage(Math.max(0, Math.min(p, totalPages - 1)));
  }

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
        <>
          {paginated.map((post) => {
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
          })}

          {totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              padding: "10px 0 4px",
              fontSize: "13px"
            }}>
              <button
                className="secondary-btn"
                style={{ padding: "6px 10px", fontSize: "12px" }}
                onClick={() => goTo(page - 1)}
                disabled={page === 0}
              >
                Prev
              </button>
              <span style={{ color: "var(--text-secondary)" }}>
                {page + 1} / {totalPages}
              </span>
              <button
                className="secondary-btn"
                style={{ padding: "6px 10px", fontSize: "12px" }}
                onClick={() => goTo(page + 1)}
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
