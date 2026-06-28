import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, ExternalLink, Image, FileText } from "lucide-react";
import {
  getContentAssets,
  createContentAsset,
  uploadSocialImage
} from "../../social/services/socialService";

const CATEGORIES = ["Blog Post", "Social Media", "Email", "Ad Copy", "Video Script", "Case Study", "Newsletter"];
const CONTENT_TYPES = ["Article", "Thread", "Carousel", "Reel", "Story", "Campaign", "Whitepaper"];
const PRIORITIES = ["High", "Medium", "Low"];

export default function ContentAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    title: "",
    url: "",
    category: "Blog Post",
    content_type: "Article",
    description: "",
    cta: "",
    priority: "High"
  });

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const data = await getContentAssets();
      setAssets(data || []);
    } catch (err) {
      toast.error("Failed to load content assets.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.title) {
      toast.error("Title is required.");
      return;
    }

    setCreating(true);
    try {
      await createContentAsset(form, imageFile);
      toast.success("Asset created. AI generation triggered via Make.com.");
      setForm({
        title: "",
        url: "",
        category: "Blog Post",
        content_type: "Article",
        description: "",
        cta: "",
        priority: "High"
      });
      setImageFile(null);
      await loadAssets();
    } catch (err) {
      toast.error(err.message || "Failed to create asset.");
    } finally {
      setCreating(false);
    }
  }

  const filtered = assets.filter((a) => {
    const text = [a.title, a.category, a.content_type, a.description, a.status]
      .filter(Boolean).join(" ").toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Content Assets</h1>
        <p>Create content assets that trigger AI-powered post generation via Make.com.</p>
      </div>

      <section className="panel" style={{ marginBottom: "20px" }}>
        <h3 style={{ marginBottom: "14px" }}>Create New Asset</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input
            placeholder="Asset title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Source URL (optional)"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value })}>
            {CONTENT_TYPES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
          <input
            placeholder="Call to action (optional)"
            value={form.cta}
            onChange={(e) => setForm({ ...form, cta: e.target.value })}
          />
        </div>

        <textarea
          placeholder="Description — what should the AI generate from this asset?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ width: "100%", marginTop: "12px", minHeight: "80px" }}
        />

        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "12px" }}>
          <label className="secondary-btn" style={{ cursor: "pointer" }}>
            <Image size={14} />
            {imageFile ? imageFile.name : "Attach Image"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </label>

          <button className="primary-btn" onClick={handleCreate} disabled={creating} style={{ marginLeft: "auto" }}>
            <Plus size={14} /> {creating ? "Creating..." : "Create & Generate"}
          </button>
        </div>
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3>Asset Library ({filtered.length})</h3>
          <input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "280px" }}
          />
        </div>

        {loading && assets.length === 0 ? (
          <div className="skeleton-stack">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
            <FileText size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <p className="muted">No content assets found.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
            {filtered.map((asset) => (
              <div className="panel" key={asset.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <h3 style={{ fontSize: "15px", margin: 0 }}>{asset.title}</h3>
                  <span className={`status-badge ${asset.status === "Ready" ? "uploaded" : "draft"}`}>
                    {asset.status || "Ready"}
                  </span>
                </div>

                {asset.description && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
                    {asset.description.length > 120 ? asset.description.slice(0, 120) + "..." : asset.description}
                  </p>
                )}

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span className="mp-skill">{asset.category}</span>
                  <span className="mp-skill">{asset.content_type}</span>
                  <span className="mp-skill">{asset.priority}</span>
                </div>

                {asset.image_url && (
                  <img
                    src={asset.image_url}
                    alt={asset.title}
                    style={{
                      width: "100%",
                      height: "140px",
                      objectFit: "cover",
                      borderRadius: "var(--radius-md)"
                    }}
                  />
                )}

                <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                  {asset.url && (
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-btn"
                      style={{ fontSize: "12px", padding: "6px 10px" }}
                    >
                      <ExternalLink size={12} /> Source
                    </a>
                  )}
                  <small style={{ color: "var(--text-muted)", marginLeft: "auto", alignSelf: "center" }}>
                    {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : ""}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
