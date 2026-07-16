import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import {
  getKnowledge,
  createKnowledge,
  deleteKnowledge
} from "../../../services/knowledgeService";
import { getAgents } from "../../../services/agentService";
import { SkeletonPage } from "../../../shared/components/Skeleton";

const PAGE_SIZE = 12;

export default function Knowledge() {
  const [items, setItems] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    type: "SOP",
    content: "",
    tags: "",
    agent_id: ""
  });

  async function loadData() {
    try {
      const [knowledgeData, agentData] = await Promise.all([
        getKnowledge(),
        getAgents()
      ]);
      setItems(knowledgeData || []);
      setAgents(agentData || []);
    } catch (err) {
      toast.error("Failed to load knowledge data.");
    } finally {
      setLoading(false);
    }
  }

  async function addKnowledge() {
    if (!form.title || !form.content) {
      toast.error("Title and content are required.");
      return;
    }

    try {
      await createKnowledge({
        title: form.title,
        type: form.type,
        content: form.content,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        agent_id: form.agent_id || null
      });

      setForm({
        title: "",
        type: "SOP",
        content: "",
        tags: "",
        agent_id: ""
      });

      toast.success("Knowledge saved.");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to save knowledge.");
    }
  }

  async function removeKnowledge(id) {
    try {
      await deleteKnowledge(id);
      toast.success("Knowledge deleted.");
      loadData();
    } catch (err) {
      toast.error("Failed to delete.");
    }
  }

  function getAgentName(agentId) {
    if (!agentId) return "Global";
    const agent = agents.find((item) => item.id === agentId);
    return agent ? agent.name : "Unknown agent";
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = items.filter((item) => {
    const matchesType = typeFilter === "All" || item.type === typeFilter;
    const text = [item.title, item.content, item.type, ...(item.tags || [])]
      .filter(Boolean).join(" ").toLowerCase();
    return matchesType && text.includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [search, typeFilter]);

  if (loading) return <SkeletonPage rows={8} />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Knowledge</h1>
        <p>Nexus memory system: SOPs, prompts, workflows, client data, and research.</p>
      </div>

      <div className="panel" style={{ marginBottom: "20px" }}>
        <h3 style={{ marginBottom: "12px" }}>Add Knowledge</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option>SOP</option>
            <option>Prompt</option>
            <option>System</option>
            <option>Workflow</option>
            <option>Client</option>
            <option>Research</option>
          </select>

          <select
            value={form.agent_id}
            onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
          >
            <option value="">Global Knowledge</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Tags: marketing, social, automation"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </div>

        <textarea
          placeholder="Knowledge content"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows="4"
          style={{ width: "100%", marginTop: "10px" }}
        />

        <button className="primary-btn" onClick={addKnowledge} style={{ marginTop: "10px" }}>
          Save Knowledge
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
        <div className="mp-search" style={{ flex: 1, maxWidth: "none" }}>
          <Search size={16} />
          <input
            placeholder="Search knowledge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ minWidth: "140px" }}
        >
          <option value="All">All Types</option>
          <option>SOP</option>
          <option>Prompt</option>
          <option>System</option>
          <option>Workflow</option>
          <option>Client</option>
          <option>Research</option>
        </select>

        <span style={{ color: "var(--text-secondary)", fontSize: "13px", whiteSpace: "nowrap" }}>
          {filtered.length} items
        </span>
      </div>

      {paginated.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p className="muted">No knowledge items found.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px" }}>
          {paginated.map((item) => (
            <div className="panel" key={item.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <h3 style={{ fontSize: "15px", margin: 0 }}>{item.title}</h3>
                <span className="mp-skill">{item.type}</span>
              </div>

              <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>
                <strong>Assigned:</strong> {getAgentName(item.agent_id)}
              </p>

              <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
                {item.content?.length > 150 ? item.content.slice(0, 150) + "..." : item.content}
              </p>

              {(item.tags || []).length > 0 && (
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {item.tags.map((tag) => (
                    <span className="mp-skill" key={tag}>{tag}</span>
                  ))}
                </div>
              )}

              <button
                className="danger-btn"
                onClick={() => removeKnowledge(item.id)}
                style={{ marginTop: "auto", alignSelf: "flex-start", padding: "6px 12px", fontSize: "12px" }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          padding: "18px 0",
          fontSize: "13px"
        }}>
          <button
            className="secondary-btn"
            style={{ padding: "8px 14px" }}
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span style={{ color: "var(--text-secondary)" }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="secondary-btn"
            style={{ padding: "8px 14px" }}
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
