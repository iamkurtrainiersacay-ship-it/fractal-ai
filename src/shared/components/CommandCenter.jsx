import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Share2,
  Bot,
  Brain,
  Workflow,
  BarChart3,
  Plug,
  Settings,
  Home,
  LayoutGrid
} from "lucide-react";

const commands = [
  { label: "Open Dashboard", path: "/", icon: Home },
  { label: "Open Applications", path: "/applications", icon: LayoutGrid },
  { label: "Open Social Distribution", path: "/social-distribution", icon: Share2 },
  { label: "Run AI Agent", path: "/run-agent", icon: Bot },
  { label: "Open Knowledge Base", path: "/knowledge", icon: Brain },
  { label: "Open Workflows", path: "/workflows", icon: Workflow },
  { label: "Open Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Open Integrations", path: "/integrations", icon: Plug },
  { label: "Open Settings", path: "/settings", icon: Settings }
];

export default function CommandCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filtered = useMemo(() => {
    return commands.filter((command) =>
      command.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  function runCommand(command) {
    navigate(command.path);
    setOpen(false);
    setQuery("");
  }

  if (!open) return null;

  return (
    <div className="command-overlay">
      <div className="command-panel">
        <div className="command-search">
          <Search size={20} />
          <input
            autoFocus
            placeholder="Ask Fractal or jump to a module..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span>Esc</span>
        </div>

        <div className="command-results">
          {filtered.length === 0 ? (
            <div className="command-empty">
              No command found.
            </div>
          ) : (
            filtered.map((command) => {
              const Icon = command.icon;

              return (
                <button
                  key={command.label}
                  className="command-item"
                  onClick={() => runCommand(command)}
                >
                  <div className="command-icon">
                    <Icon size={18} />
                  </div>

                  <span>{command.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
