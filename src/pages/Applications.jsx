import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, Share2, Bot, BarChart3, Plug, Workflow,
  Sparkles, FolderOpen, ArrowRight, Layers, Globe
} from "lucide-react";
import { supabase } from "../core/database/supabase";

const APPS = [
  {
    title: "AI Agents",
    description: "Configure, run, and manage your specialized AI workforce.",
    icon: Bot,
    route: "/agents",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.25)",
    statTable: "agents",
    statLabel: "agents"
  },
  {
    title: "Executive Advisors",
    description: "Curated CEO, CFO, CIO, and other C-suite advisors, plus specialists for every business function.",
    icon: Sparkles,
    route: "/marketplace",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.25)",
    statTable: null,
    statLabel: "advisors & agents",
    staticStat: "20"
  },
  {
    title: "Knowledge Base",
    description: "Enterprise memory — SOPs, prompts, research, and client data.",
    icon: Brain,
    route: "/knowledge",
    color: "#10b981",
    glow: "rgba(16,185,129,0.25)",
    statTable: "knowledge",
    statLabel: "entries"
  },
  {
    title: "Workflows",
    description: "Build and execute AI-powered multi-agent automation pipelines.",
    icon: Workflow,
    route: "/workflows",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.25)",
    statTable: "workflows",
    statLabel: "workflows"
  },
  {
    title: "Social Distribution",
    description: "AI-powered social media content creation and scheduling.",
    icon: Share2,
    route: "/social-distribution",
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.25)",
    statTable: null,
    statLabel: "platform",
    staticStat: "Multi"
  },
  {
    title: "Analytics",
    description: "Agent usage intelligence, token tracking, and cost analysis.",
    icon: BarChart3,
    route: "/analytics",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.25)",
    statTable: "activity_logs",
    statLabel: "events"
  },
  {
    title: "Projects",
    description: "Track projects, link GitHub repos, and manage deployments.",
    icon: FolderOpen,
    route: "/projects",
    color: "#34d399",
    glow: "rgba(52,211,153,0.25)",
    statTable: "projects",
    statLabel: "projects"
  },
  {
    title: "Integrations",
    description: "Connect OpenAI, Supabase, Gmail, Make.com, and more.",
    icon: Plug,
    route: "/integrations",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.25)",
    statTable: "integrations",
    statLabel: "connected"
  },
  {
    title: "Workspace",
    description: "Overview of your active workspace — agents, tasks, and activity.",
    icon: Layers,
    route: "/workspace",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.2)",
    statTable: null,
    statLabel: "active",
    staticStat: "Live"
  },
  {
    title: "Web Scraper",
    description: "Run Maxun robots to extract data from any website and feed it to your agents.",
    icon: Globe,
    route: "/scraper",
    color: "#f97316",
    glow: "rgba(249,115,22,0.25)",
    statTable: null,
    statLabel: "robots",
    staticStat: "Maxun"
  }
];

async function getTableCount(table) {
  try {
    if (table === "integrations") {
      const { count } = await supabase
        .from(table).select("id", { count: "exact", head: true })
        .eq("connected", true);
      return count || 0;
    }
    const { count } = await supabase
      .from(table).select("id", { count: "exact", head: true });
    return count || 0;
  } catch {
    return 0;
  }
}

export default function Applications() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});

  useEffect(() => {
    Promise.all(
      APPS.filter(a => a.statTable).map(async (app) => {
        const count = await getTableCount(app.statTable);
        return [app.statTable, count];
      })
    ).then(entries => {
      setStats(Object.fromEntries(entries));
    });
  }, []);

  function getStat(app) {
    if (app.staticStat) return app.staticStat;
    if (app.statTable && stats[app.statTable] !== undefined) {
      return stats[app.statTable].toLocaleString();
    }
    return "—";
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="sd-eyebrow">Nexus Prime</p>
          <h1>Applications</h1>
          <p className="muted">Your complete AI operating system — all modules in one place.</p>
        </div>
        <div className="apps-header-stat">
          <strong>{APPS.length}</strong>
          <span>Modules</span>
        </div>
      </div>

      <div className="apps-grid-v4">
        {APPS.map((app, idx) => {
          const Icon = app.icon;
          const stat = getStat(app);

          return (
            <motion.div
              key={app.title}
              className="app-card-v4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, type: "spring", stiffness: 300, damping: 28 }}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
              onClick={() => navigate(app.route)}
              style={{ "--app-color": app.color, "--app-glow": app.glow }}
            >
              <div className="app-card-v4-top">
                <div className="app-card-v4-icon" style={{ background: `${app.color}18`, border: `1px solid ${app.color}30` }}>
                  <Icon size={22} style={{ color: app.color }} />
                </div>
                <div className="app-card-v4-stat">
                  <span>{stat}</span>
                  <small>{app.statLabel}</small>
                </div>
              </div>

              <h2>{app.title}</h2>
              <p>{app.description}</p>

              <div className="app-card-v4-footer">
                <span className="app-card-v4-open">
                  Open <ArrowRight size={13} />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
