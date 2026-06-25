import { useState } from "react";

const platforms = ["Facebook", "LinkedIn", "Instagram", "X"];

function normalizePlatform(platform) {
  if (platform === "X(Twitter)") return "X";
  return platform || "Unknown";
}

export default function SocialPreview({ selectedPost, editedBody, assetMap = {} }) {
  const [activePlatform, setActivePlatform] = useState("Facebook");

  if (!selectedPost) {
    return (
      <div className="preview-empty">
        <h2>Live Preview</h2>
        <p>Select a post to preview it.</p>
      </div>
    );
  }

  const asset = assetMap[selectedPost.asset_id] || {};
  const image = selectedPost.image_url || asset.image_url;
  const platform = normalizePlatform(selectedPost.platform);

  return (
    <div className="live-preview">
      <div className="preview-header">
        <p className="eyebrow">Live Preview</p>
        <h2>{platform}</h2>
      </div>

      <div className="preview-tabs">
        {platforms.map((item) => (
          <button
            key={item}
            className={activePlatform === item ? "active" : ""}
            onClick={() => setActivePlatform(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className={`social-preview-card ${activePlatform.toLowerCase()}`}>
        <div className="preview-account">
          <div className="avatar">S</div>
          <div>
            <strong>Sovereign Solutions</strong>
            <span>{activePlatform} Preview</span>
          </div>
        </div>

        {image ? (
          <img src={image} alt="Post visual" />
        ) : (
          <div className="preview-no-image">No image attached</div>
        )}

        <p>{editedBody || "Post content will appear here."}</p>
      </div>
    </div>
  );
}
