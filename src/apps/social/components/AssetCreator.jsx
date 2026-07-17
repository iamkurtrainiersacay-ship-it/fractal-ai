import { useState } from "react";

export default function AssetCreator({ onCreate }) {
  const [form, setForm] = useState({
    title: "",
    url: "",
    category: "",
    content_type: "",
    description: "",
    cta: "",
    priority: "High"
  });
  const [imageFile, setImageFile] = useState(null);

  function update(key, value) {
    setForm({ ...form, [key]: value });
  }

  async function submit() {
    if (!form.title || !form.description) {
      alert("Title and description are required.");
      return;
    }

    await onCreate(form, imageFile);

    setForm({
      title: "",
      url: "",
      category: "",
      content_type: "",
      description: "",
      cta: "",
      priority: "High"
    });
    setImageFile(null);
  }

  return (
    <div className="operation-card asset-creator">
      <h3>Create Asset</h3>

      <input placeholder="Title" value={form.title} onChange={(e) => update("title", e.target.value)} />
      <input placeholder="URL" value={form.url} onChange={(e) => update("url", e.target.value)} />
      <input placeholder="Category" value={form.category} onChange={(e) => update("category", e.target.value)} />
      <input placeholder="Content Type" value={form.content_type} onChange={(e) => update("content_type", e.target.value)} />
      <textarea placeholder="Description" value={form.description} onChange={(e) => update("description", e.target.value)} />
      <input placeholder="CTA" value={form.cta} onChange={(e) => update("cta", e.target.value)} />

      <select value={form.priority} onChange={(e) => update("priority", e.target.value)}>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>

      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />

      <button className="primary-btn" onClick={submit}>Create + Generate</button>
    </div>
  );
}
