import { useState } from "react";

const platforms = ["Facebook", "LinkedIn", "Instagram", "X"];

function normalizePlatform(platform) {
  if (platform === "X(Twitter)") return "X";
  return platform || "Unknown";
}

export default function SocialPreview({ selectedPost, editedBody, assetMap = {} }) {
  const [activePlatform, setActivePlatform] = useState("LinkedIn");

  if (!selectedPost) {
    return (
      <div className="sd-empty">
        <div className="sd-empty-orb">◈</div>
        <h2>Live Preview</h2>
        <p>Select a post to preview platform formatting.</p>
      </div>
    );
  }

  const asset = assetMap[selectedPost.asset_id] || {};
  const image = selectedPost.image_url || asset.image_url;
  const current = normalizePlatform(selectedPost.platform);

  return (
    <div className="sd-preview">
      <div className="sd-section-head">
        <div>
          <p className="sd-eyebrow">Live Preview</p>
          <h3>{current}</h3>
        </div>
      </div>

      <div className="sd-tabs">
        {platforms.map((platform) => (
          <button
            key={platform}
            className={activePlatform === platform ? "active" : ""}
            onClick={() => setActivePlatform(platform)}
          >
            {platform}
          </button>
        ))}
      </div>

      <div className={`sd-platform-card ${activePlatform.toLowerCase()}`}>
        <div className="sd-account-row">
          <div className="sd-avatar">S</div>
          <div>
            <strong>Sovereign Solutions</strong>
            <span>{activePlatform} preview</span>
          </div>
        </div>

        {image ? (
          <img src={image} alt="Post visual" />
        ) : (
          <div className="sd-no-image">No image attached</div>
        )}

        <p>{editedBody || "Post content will appear here."}</p>

        <div className="sd-preview-actions">
          <span>Like</span>
          <span>Comment</span>
          <span>Share</span>
        </div>
      </div>
    </div>
  );
}
