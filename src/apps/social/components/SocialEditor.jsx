export default function SocialEditor({
  selectedPost,
  editedBody,
  setEditedBody,
  assetMap = {}
}) {
  const asset = selectedPost ? assetMap[selectedPost.asset_id] || {} : {};

  if (!selectedPost) {
    return (
      <div className="sd-empty">
        <div className="sd-empty-orb">✦</div>
        <h2>Select a post</h2>
        <p>Choose a post from the queue to begin editing.</p>
      </div>
    );
  }

  return (
    <div className="sd-editor">
      <div className="sd-editor-head">
        <p className="sd-eyebrow">Post Editor</p>
        <h2>{asset.title || selectedPost.title || "Untitled Post"}</h2>
        <span>{asset.url || "No source URL attached"}</span>
      </div>

      <textarea
        value={editedBody}
        onChange={(e) => setEditedBody(e.target.value)}
        placeholder="Edit post content..."
      />

      <div className="sd-editor-meta">
        <span>{editedBody.length} characters</span>
        <span>{selectedPost.platform}</span>
        <span>{selectedPost.status}</span>
      </div>
    </div>
  );
}
