export default function SocialEditor({
  selectedPost,
  editedBody,
  setEditedBody,
  assetMap = {}
}) {
  const asset = selectedPost ? assetMap[selectedPost.asset_id] || {} : {};

  if (!selectedPost) {
    return (
      <div className="editor-empty">
        <h2>No post selected</h2>
        <p>Choose a post from the queue to edit content.</p>
      </div>
    );
  }

  return (
    <div className="editor-workspace">
      <div className="editor-header">
        <div>
          <p className="eyebrow">Post Editor</p>
          <h2>{asset.title || selectedPost.title || "Untitled Post"}</h2>
          <p>{asset.url || "No source URL attached"}</p>
        </div>
      </div>

      <label>Post Content</label>
      <textarea
        value={editedBody}
        onChange={(e) => setEditedBody(e.target.value)}
        placeholder="Edit the social post here..."
      />

      <div className="editor-meta">
        <span>{editedBody.length} characters</span>
        <span>{selectedPost.platform}</span>
        <span>{selectedPost.status}</span>
      </div>
    </div>
  );
}
