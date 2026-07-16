import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Share2, Bot, Brain, Workflow,
  BarChart3, Plug, Settings, Home, LayoutGrid, Loader
} from "lucide-react";
import { supabase } from "../../core/database/supabase";

const NAV_COMMANDS = [
  { label: "Dashboard",            path: "/",                    icon: Home },
  { label: "Applications",         path: "/applications",        icon: LayoutGrid },
  { label: "Social Distribution",  path: "/social-distribution", icon: Share2 },
  { label: "Run AI Agent",         path: "/run-agent",           icon: Bot },
  { label: "Knowledge Base",       path: "/knowledge",           icon: Brain },
  { label: "Workflows",            path: "/workflows",           icon: Workflow },
  { label: "Analytics",            path: "/analytics",           icon: BarChart3 },
  { label: "Integrations",         path: "/integrations",        icon: Plug },
  { label: "Settings",             path: "/settings",            icon: Settings }
];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

async function searchSupabase(q) {
  const term = `%${q}%`;
  const [agentRes, knowledgeRes, workflowRes] = await Promise.all([
    supabase.from("agents").select("id,name,role,status").ilike("name", term).limit(5),
    supabase.from("knowledge").select("id,title,type").ilike("title", term).limit(5),
    supabase.from("workflows").select("id,name,description").ilike("name", term).limit(5)
  ]);
  return {
    agents: agentRes.data || [],
    knowledge: knowledgeRes.data || [],
    workflows: workflowRes.data || []
  };
}

function ItemIcon({ item }) {
  if (item.type === "agent") return <Bot size={17} />;
  if (item.type === "knowledge") return <Brain size={17} />;
  if (item.type === "workflow") return <Workflow size={17} />;
  const Icon = item.icon || Search;
  return <Icon size={17} />;
}

export default function CommandCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) { setQuery(""); setResults(null); setSelected(0); }
    else setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    searchSupabase(debouncedQuery)
      .then(setResults)
      .catch(() => setResults(null))
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  const navFiltered = NAV_COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const agentItems = results?.agents || [];
  const knowledgeItems = results?.knowledge || [];
  const workflowItems = results?.workflows || [];

  const allItems = [
    ...navFiltered.map(c => ({ type: "nav", ...c })),
    ...agentItems.map(a => ({ type: "agent", label: a.name, sub: a.role, id: a.id })),
    ...knowledgeItems.map(k => ({ type: "knowledge", label: k.title, sub: k.type, id: k.id })),
    ...workflowItems.map(w => ({ type: "workflow", label: w.name, sub: w.description, id: w.id }))
  ];

  const go = useCallback((item) => {
    if (item.type === "nav") navigate(item.path);
    else if (item.type === "agent") navigate("/agents");
    else if (item.type === "knowledge") navigate("/knowledge");
    else if (item.type === "workflow") navigate("/workflows");
    setOpen(false);
    setQuery("");
  }, [navigate]);

  useEffect(() => {
    function onKey(e) {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected(s => Math.min(s + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected(s => Math.max(s - 1, 0));
      } else if (e.key === "Enter" && allItems[selected]) {
        e.preventDefault();
        go(allItems[selected]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, allItems, selected, go]);

  const agentStart = navFiltered.length;
  const knowledgeStart = agentStart + agentItems.length;
  const workflowStart = knowledgeStart + knowledgeItems.length;

  function renderGroup(label, items, startIdx) {
    if (!items.length) return null;
    return (
      <div className="command-group" key={label}>
        <div className="command-group-label">{label}</div>
        {items.map((item, i) => {
          const globalIdx = startIdx + i;
          return (
            <motion.button
              key={`${item.type}-${item.label}-${i}`}
              className={`command-item ${globalIdx === selected ? "active" : ""}`}
              onClick={() => go(item)}
              onMouseEnter={() => setSelected(globalIdx)}
              whileHover={{ x: 2 }}
            >
              <div className="command-icon"><ItemIcon item={item} /></div>
              <div className="command-item-text">
                <span>{item.label}</span>
                {item.sub && <small>{item.sub}</small>}
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  if (!open) return null;

  const hasLiveResults = agentItems.length > 0 || knowledgeItems.length > 0 || workflowItems.length > 0;

  return (
    <AnimatePresence>
      <div className="command-overlay" onClick={() => setOpen(false)}>
        <motion.div
          className="command-panel"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className="command-search">
            {searching
              ? <Loader size={18} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
              : <Search size={18} />
            }
            <input
              ref={inputRef}
              placeholder="Search agents, knowledge, workflows, or navigate..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            />
            <span>Esc</span>
          </div>

          <div className="command-results">
            {!query && renderGroup(
              "Navigation",
              navFiltered.map(c => ({ type: "nav", ...c })),
              0
            )}

            {query && !searching && !hasLiveResults && navFiltered.length === 0 && (
              <div className="command-empty">No results for "{query}"</div>
            )}

            {query && renderGroup(
              "Navigation",
              navFiltered.map(c => ({ type: "nav", ...c })),
              0
            )}
            {query && renderGroup(
              "Agents",
              agentItems.map(a => ({ type: "agent", label: a.name, sub: a.role || "AI Agent", id: a.id })),
              agentStart
            )}
            {query && renderGroup(
              "Knowledge",
              knowledgeItems.map(k => ({ type: "knowledge", label: k.title, sub: k.type, id: k.id })),
              knowledgeStart
            )}
            {query && renderGroup(
              "Workflows",
              workflowItems.map(w => ({ type: "workflow", label: w.name, sub: w.description, id: w.id })),
              workflowStart
            )}

            {query && searching && (
              <div className="command-searching">
                <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
                Searching...
              </div>
            )}
          </div>

          <div className="command-footer">
            <span><kbd>↑↓</kbd> navigate</span>
            <span><kbd>↵</kbd> open</span>
            <span><kbd>Esc</kbd> close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
