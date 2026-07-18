import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Link, Upload, X, ChevronDown, ChevronUp, Trash2, Plus, Globe, Play } from "lucide-react";
import {
  getKnowledge,
  createKnowledge,
  deleteKnowledge
} from "../../../services/knowledgeService";
import { getAgents } from "../../../services/agentService";
import { SkeletonPage } from "../../../shared/components/Skeleton";
import { listRobots, runRobot, listRuns, isMaxunConnected } from "../../../services/maxunService";

const PAGE_SIZE = 12;
const TYPES = ["SOP", "Prompt", "System", "Workflow", "Client", "Research"];

// ─── File text extraction ─────────────────────────────────────────────────────

async function extractText(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  if (["txt", "md", "csv", "json"].includes(ext)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  if (ext === "docx") {
    const zip = await JSZip.loadAsync(file);
    const xmlFile = zip.file("word/document.xml");
    if (!xmlFile) throw new Error("Not a valid DOCX file.");
    const xml = await xmlFile.async("text");
    // Strip XML tags and clean whitespace
    return xml
      .replace(/<w:p[ >][^/]*\/>/g, "\n")
      .replace(/<w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  if (ext === "pdf") {
    // Basic PDF text extraction — works for text-only PDFs
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const raw = e.target.result;
        // Extract text streams between BT...ET markers
        const matches = [...raw.matchAll(/\(([^)]{1,500})\)\s*T[jJ]/g)].map(m => m[1]);
        const text = matches.join(" ").replace(/\\n/g, "\n").trim();
        resolve(text || `[PDF: ${file.name}] — Text extraction limited. Please copy-paste content manually for best results.`);
      };
      reader.readAsBinaryString(file);
    });
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

// ─── Upload dropzone ──────────────────────────────────────────────────────────

function FileUploadZone({ onExtracted }) {
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState("");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/plain": [".txt", ".md", ".csv"],
      "application/json": [".json"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/pdf": [".pdf"]
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropAccepted: async ([file]) => {
      setProcessing(true);
      setFileName(file.name);
      try {
        const text = await extractText(file);
        onExtracted(file.name.replace(/\.[^.]+$/, ""), text);
        toast.success(`Extracted content from ${file.name}`);
      } catch (err) {
        toast.error(err.message || "Failed to read file.");
      } finally {
        setProcessing(false);
      }
    },
    onDropRejected: ([{ errors }]) => {
      toast.error(errors[0]?.message || "File rejected.");
    }
  });

  return (
    <div {...getRootProps()} className={`knowledge-dropzone ${isDragActive ? "active" : ""}`}>
      <input {...getInputProps()} />
      {processing ? (
        <div className="knowledge-dropzone-inner">
          <div className="kd-spinner" />
          <p>Extracting text from {fileName}...</p>
        </div>
      ) : (
        <div className="knowledge-dropzone-inner">
          <Upload size={28} style={{ color: "var(--primary)", marginBottom: "8px" }} />
          <p>{isDragActive ? "Drop it here" : "Drag & drop a file, or click to browse"}</p>
          <span>TXT · MD · CSV · JSON · DOCX · PDF — max 10MB</span>
        </div>
      )}
    </div>
  );
}

// ─── URL extractor ────────────────────────────────────────────────────────────

function URLInput({ onExtracted }) {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [fetching, setFetching] = useState(false);

  async function tryFetch() {
    if (!url.trim()) return;
    setFetching(true);
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      const html = json.contents || "";
      // Strip HTML tags to get plain text
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, 8000);

      const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || url;
      onExtracted(title, `Source: ${url}\n\n${text}`);
      toast.success("URL content extracted.");
    } catch {
      // CORS fallback — save as reference
      const content = `Source URL: ${url}\n\n${summary || "[Add a summary of this URL's content]"}`;
      onExtracted(url, content);
      toast("Saved as reference — CORS blocked direct extraction. Add a summary if needed.", { icon: "ℹ️" });
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className="knowledge-url-form">
      <input
        className="knowledge-url-input"
        placeholder="https://example.com/page"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && tryFetch()}
      />
      <textarea
        placeholder="Optional: paste a summary or key points from this URL..."
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={3}
        className="knowledge-url-summary"
      />
      <motion.button
        className="primary-btn"
        onClick={tryFetch}
        disabled={!url.trim() || fetching}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {fetching ? "Fetching..." : <><Link size={14} /> Extract & Save</>}
      </motion.button>
    </div>
  );
}

// ─── Maxun scrape tab ─────────────────────────────────────────────────────────

function MaxunScrapeTab({ onExtracted }) {
  const [connected, setConnected] = useState(null);
  const [robots, setRobots] = useState([]);
  const [selectedRobot, setSelectedRobot] = useState("");
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState("");

  useEffect(() => {
    isMaxunConnected().then((ok) => {
      setConnected(ok);
      if (ok) {
        listRobots()
          .then((data) => setRobots(Array.isArray(data) ? data : (data?.robots || data?.data || [])))
          .catch(() => setRobots([]));
      }
    });
  }, []);

  async function handleRun() {
    if (!selectedRobot) return;
    setRunning(true);
    try {
      await runRobot(selectedRobot);
      toast("Robot started! Fetching latest run...", { icon: "⚙️" });
      await new Promise((r) => setTimeout(r, 3000));
      const data = await listRuns(selectedRobot);
      const runList = Array.isArray(data) ? data : (data?.runs || data?.data || []);
      setRuns(runList.slice(0, 5));
      if (runList.length > 0) setSelectedRun(runList[0].id);
      toast.success("Scrape complete — pick a run to import.");
    } catch (err) {
      toast.error(err.message || "Scrape failed.");
    } finally {
      setRunning(false);
    }
  }

  function handleImport() {
    const run = runs.find((r) => r.id === selectedRun || r.id === Number(selectedRun));
    if (!run) return;
    const robot = robots.find((r) => r.id === selectedRobot);
    const data = run.capturedData || run.data || run.result;
    const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    onExtracted(`${robot?.name || "Maxun Scrape"} — ${new Date().toLocaleDateString()}`, content);
  }

  if (connected === false) {
    return (
      <div className="maxun-kb-banner">
        <Globe size={16} style={{ color: "#f97316" }} />
        <span>Maxun not connected. Go to <strong>Integrations → Maxun</strong> and paste your ngrok URL.</span>
      </div>
    );
  }

  if (connected === null) return <p className="muted" style={{ padding: "16px 0" }}>Checking Maxun connection...</p>;

  return (
    <div className="maxun-kb-panel">
      <div className="maxun-kb-row">
        <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Robot</label>
        <select value={selectedRobot} onChange={(e) => setSelectedRobot(e.target.value)} style={{ flex: 1 }}>
          <option value="">Select a robot...</option>
          {robots.map((r) => (
            <option key={r.id} value={r.id}>{r.name || `Robot ${r.id}`}</option>
          ))}
        </select>
        <motion.button
          className="primary-btn"
          onClick={handleRun}
          disabled={!selectedRobot || running}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {running ? "Running..." : <><Play size={13} /> Run Scrape</>}
        </motion.button>
      </div>

      {runs.length > 0 && (
        <div className="maxun-kb-row" style={{ marginTop: "10px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Run Result</label>
          <select value={selectedRun} onChange={(e) => setSelectedRun(e.target.value)} style={{ flex: 1 }}>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                Run #{String(r.id).slice(-6)} — {r.status} — {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
              </option>
            ))}
          </select>
          <motion.button
            className="primary-btn"
            onClick={handleImport}
            disabled={!selectedRun}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FileText size={13} /> Import to Write
          </motion.button>
        </div>
      )}

      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px" }}>
        Running a robot triggers Maxun to scrape the site. After it finishes, pick the run result and click Import to fill in the knowledge entry.
      </p>
    </div>
  );
}

// ─── Knowledge card ───────────────────────────────────────────────────────────

function KnowledgeCard({ item, agentName, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = item.content?.length > 150;

  return (
    <motion.div
      className="knowledge-card"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="knowledge-card-head">
        <h3>{item.title}</h3>
        <span className="mp-skill">{item.type}</span>
      </div>

      <p className="knowledge-card-agent">
        <strong>Agent:</strong> {agentName}
      </p>

      <div className="knowledge-card-content">
        <p>
          {expanded || !isLong
            ? item.content
            : item.content.slice(0, 150) + "…"}
        </p>
        {isLong && (
          <button
            className="knowledge-expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> More</>}
          </button>
        )}
      </div>

      {(item.tags || []).length > 0 && (
        <div className="knowledge-tags">
          {item.tags.map((tag) => (
            <span className="mp-skill" key={tag}>{tag}</span>
          ))}
        </div>
      )}

      <button
        className="knowledge-delete-btn"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 size={13} />
      </button>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Knowledge() {
  const [items, setItems] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addTab, setAddTab] = useState("write"); // "write" | "upload" | "url"

  const [form, setForm] = useState({
    title: "", type: "SOP", content: "", tags: "", agent_id: ""
  });

  async function loadData() {
    try {
      const [knowledgeData, agentData] = await Promise.all([
        getKnowledge(), getAgents()
      ]);
      setItems(knowledgeData || []);
      setAgents(agentData || []);
    } catch {
      toast.error("Failed to load knowledge.");
    } finally {
      setLoading(false);
    }
  }

  async function save(overrides = {}) {
    const data = { ...form, ...overrides };
    if (!data.title || !data.content) {
      toast.error("Title and content are required.");
      return;
    }
    try {
      await createKnowledge({
        title: data.title,
        type: data.type,
        content: data.content,
        tags: typeof data.tags === "string"
          ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : data.tags || [],
        agent_id: data.agent_id || null
      });
      setForm({ title: "", type: "SOP", content: "", tags: "", agent_id: "" });
      toast.success("Knowledge saved.");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to save.");
    }
  }

  function handleFileExtracted(title, content) {
    setForm((f) => ({ ...f, title: f.title || title, content }));
    setAddTab("write");
  }

  function handleUrlExtracted(title, content) {
    setForm((f) => ({ ...f, title: f.title || title, content, type: "Research" }));
    setAddTab("write");
  }

  async function removeKnowledge(id) {
    try {
      await deleteKnowledge(id);
      toast.success("Deleted.");
      loadData();
    } catch {
      toast.error("Failed to delete.");
    }
  }

  function getAgentName(id) {
    if (!id) return "Global";
    return agents.find((a) => a.id === id)?.name || "Unknown";
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setPage(0); }, [search, typeFilter]);

  const filtered = items.filter((item) => {
    const matchType = typeFilter === "All" || item.type === typeFilter;
    const text = [item.title, item.content, item.type, ...(item.tags || [])]
      .filter(Boolean).join(" ").toLowerCase();
    return matchType && text.includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <SkeletonPage rows={8} />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Knowledge Base</h1>
          <p className="muted">Nexus memory system — SOPs, prompts, research, client data.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{items.length} entries</span>
        </div>
      </div>

      {/* Add Knowledge Panel */}
      <div className="panel knowledge-add-panel">
        <div className="knowledge-add-tabs">
          {[
            { id: "write", icon: Plus, label: "Write" },
            { id: "upload", icon: Upload, label: "Upload File" },
            { id: "url", icon: Link, label: "From URL" },
            { id: "maxun", icon: Globe, label: "Scrape with Maxun" }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`knowledge-add-tab ${addTab === id ? "active" : ""}`}
              onClick={() => setAddTab(id)}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {addTab === "write" && (
            <motion.div
              key="write"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <div className="knowledge-write-grid">
                <input
                  placeholder="Title *"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <select
                  value={form.agent_id}
                  onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
                >
                  <option value="">Global Knowledge</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <input
                  placeholder="Tags: marketing, social, crm"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <textarea
                placeholder="Knowledge content — SOPs, prompts, research, client context..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
                style={{ width: "100%", marginTop: "12px" }}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <motion.button
                  className="primary-btn"
                  onClick={() => save()}
                  disabled={!form.title || !form.content}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FileText size={14} /> Save Knowledge
                </motion.button>
                {(form.title || form.content) && (
                  <button
                    className="secondary-btn"
                    onClick={() => setForm({ title: "", type: "SOP", content: "", tags: "", agent_id: "" })}
                  >
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {addTab === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <FileUploadZone onExtracted={handleFileExtracted} />
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px" }}>
                After upload, you'll be taken to the Write tab to review and edit before saving.
              </p>
            </motion.div>
          )}

          {addTab === "url" && (
            <motion.div
              key="url"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <URLInput onExtracted={handleUrlExtracted} />
            </motion.div>
          )}

          {addTab === "maxun" && (
            <motion.div
              key="maxun"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <MaxunScrapeTab onExtracted={handleFileExtracted} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search + Filter */}
      <div className="knowledge-filter-bar">
        <div className="mp-search" style={{ flex: 1 }}>
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
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <span style={{ color: "var(--text-muted)", fontSize: "13px", whiteSpace: "nowrap" }}>
          {filtered.length} items
        </span>
      </div>

      {/* Grid */}
      {paginated.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "48px" }}>
          <FileText size={32} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
          <p className="muted">No knowledge entries found.</p>
          <button className="primary-btn" style={{ marginTop: "12px" }} onClick={() => setAddTab("write")}>
            <Plus size={14} /> Add your first entry
          </button>
        </div>
      ) : (
        <motion.div className="knowledge-grid" layout>
          <AnimatePresence>
            {paginated.map((item) => (
              <KnowledgeCard
                key={item.id}
                item={item}
                agentName={getAgentName(item.agent_id)}
                onDelete={removeKnowledge}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="secondary-btn"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button
            className="secondary-btn"
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
