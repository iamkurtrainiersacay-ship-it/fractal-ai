import { NavLink } from "react-router-dom";
import { useWorkspace } from "../../core/workspace/WorkspaceContext";

import {
  Home,
  LayoutGrid,
  Bot,
  Workflow,
  Brain,
  Plug,
  BarChart3,
  Settings,
  Layers,
  ChevronDown,
  ShieldCheck
} from "lucide-react";

import { useState, useRef, useEffect } from "react";
import AskFractal from "./AskFractal";

const nav = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Applications", path: "/applications", icon: LayoutGrid },
  { name: "Workspace", path: "/workspace", icon: Layers },
  { name: "AI Agents", path: "/multi-agent", icon: Bot },
  { name: "Knowledge", path: "/knowledge", icon: Brain },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
  { name: "Integrations", path: "/integrations", icon: Plug },
  { name: "Workflows", path: "/workflows", icon: Workflow },
  { name: "Settings", path: "/settings", icon: Settings }
];

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar({ isSuperAdmin }) {
  const { workspace, workspaces, switchWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">&#10022;</div>
        <div>
          <h1>Fractal AI</h1>
          <p>AI Operating System</p>
        </div>
      </div>

      <div className="ws-switcher" ref={dropdownRef}>
        <button
          className="ws-switcher-btn"
          onClick={() => setOpen(!open)}
        >
          <div className="ws-avatar">{getInitials(workspace.name)}</div>
          <div className="ws-switcher-info">
            <span>Workspace</span>
            <strong>{workspace.name}</strong>
          </div>
          <ChevronDown size={16} className={open ? "ws-chevron open" : "ws-chevron"} />
        </button>

        {open && workspaces.length > 0 && (
          <div className="ws-dropdown">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                className={ws.id === workspace.id ? "ws-dropdown-item active" : "ws-dropdown-item"}
                onClick={() => {
                  switchWorkspace(ws);
                  setOpen(false);
                }}
              >
                <div className="ws-avatar-sm">{getInitials(ws.name)}</div>
                <div>
                  <strong>{ws.name}</strong>
                  {ws.description && <span>{ws.description}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="nav">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
        {isSuperAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive ? "nav-item active nav-admin" : "nav-item nav-admin"
            }
          >
            <ShieldCheck size={18} />
            <span>Super Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-card">
        <h3>Applications Installed</h3>
        <p>6 Active Modules</p>
      </div>

      <AskFractal />
    </aside>
  );
}
