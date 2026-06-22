import { NavLink } from "react-router-dom";
import { Home, Bot, Workflow, FolderKanban, Brain, Plug, BarChart3, Settings, Sparkles } from "lucide-react";

const nav = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Agents", path: "/agents", icon: Bot },
  { name: "Workflows", path: "/workflows", icon: Workflow },
  { name: "Projects", path: "/projects", icon: FolderKanban },
  { name: "Knowledge", path: "/knowledge", icon: Brain },
  { name: "Integrations", path: "/integrations", icon: Plug },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
  { name: "Settings", path: "/settings", icon: Settings },
   { name: "Run Agent", path: "/run-agent", icon: Sparkles }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon"><Sparkles size={22} /></div>
        <div>
          <h1>Fractal.ai</h1>
          <p>AI Operations OS</p>
        </div>
      </div>

      <nav className="nav">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.name} to={item.path} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-card">
        <h3>System Secure</h3>
        <p>Local-first command and agent operations layer.</p>
      </div>
    </aside>
  );
}
