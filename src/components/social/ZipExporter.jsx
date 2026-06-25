import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function ZipExporter({ posts = [], assetMap = {}, selectedIds = [] }) {
  async function exportZip() {
    const chosen = selectedIds.length
      ? posts.filter((post) => selectedIds.includes(post.id))
      : posts;

    if (!chosen.length) {
      alert("No posts to export.");
      return;
    }

    const zip = new JSZip();

    const csvRows = [
      ["Platform", "Status", "Title", "Content", "Scheduled At", "Post ID"].join(",")
    ];

    chosen.forEach((post, index) => {
      const asset = assetMap[post.asset_id] || {};
      const title = post.title || asset.title || `post-${index + 1}`;
      const safeTitle = title.replace(/[^a-z0-9]/gi, "-").toLowerCase();

      zip.file(
        `posts/${safeTitle}-${post.platform || "platform"}.txt`,
        post.post_body || ""
      );

      csvRows.push([
        post.platform || "",
        post.status || "",
        `"${title.replace(/"/g, '""')}"`,
        `"${(post.post_body || "").replace(/"/g, '""')}"`,
        post.scheduled_at || "",
        post.id || ""
      ].join(","));
    });

    zip.file("posts.csv", csvRows.join("\n"));

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "social-distribution-export.zip");
  }

  return (
    <div className="operation-card">
      <h3>ZIP Export</h3>
      <p>Export selected posts or all visible posts.</p>
      <button className="secondary-btn" onClick={exportZip}>Export ZIP</button>
    </div>
  );
}
