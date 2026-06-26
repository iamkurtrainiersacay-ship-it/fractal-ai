import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../../../core/workspace/WorkspaceContext";
import {
  Share2,
  Bot,
  Brain,
  Workflow,
  BarChart3,
  Plug,
  Activity,
  ShieldCheck,
  Database,
  Zap
} from "lucide-react";

const apps = [
  {
    title: "Social Distribution",
    description: "Review, schedule, and publish AI-generated content.",
    route: "/social-distribution",
    icon: Share2
  },
  {
    title: "AI Agents",
    description: "Run specialized agents and chat workflows.",
    route: "/run-agent",
    icon: Bot
  },
  {
    title: "Knowledge Base",
    description: "Manage internal memory and context.",
    route: "/knowledge",
    icon: Brain
  },
  {
    title: "Workflows",
    description: "Build repeatable AI automation systems.",
    route: "/workflows",
    icon: Workflow
  }
];

function useMetrics() {
  const { workspace } = useWorkspace();
  return [
    { label: "Apps Installed", value: "6" },
    { label: "AI Modules", value: "4" },
    { label: "System Status", value: "Live" },
    { label: "Workspace", value: workspace.name.split(" ")[0] }
  ];
}

const health = [
  { label: "Supabase", status: "Connected", icon: Database },
  { label: "OpenAI", status: "Ready", icon: Zap },
  { label: "Make.com", status: "Online", icon: Activity },
  { label: "Security", status: "Protected", icon: ShieldCheck }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const metrics = useMetrics();

  return (
    <div className="mission-page">
      <section className="mission-hero">
        <div>
          <p className="sd-eyebrow">Fractal AI Operating System</p>
          <h1>Mission Control</h1>
          <p>
            Central command for agents, workflows, social distribution,
            knowledge, analytics, and automation.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => navigate("/applications")}
        >
          Open Applications
        </button>
      </section>

      <section className="mission-metrics">
        {metrics.map((metric) => (
          <div className="mission-metric-card" key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </section>

      <section className="mission-grid">
        <div className="mission-panel large">
          <div className="mission-panel-head">
            <div>
              <h2>Applications</h2>
              <p>Launch core Fractal modules.</p>
            </div>
          </div>

          <div className="mission-app-list">
            {apps.map((app) => {
              const Icon = app.icon;

              return (
                <button
                  key={app.title}
                  className="mission-app-row"
                  onClick={() => navigate(app.route)}
                >
                  <div className="mission-app-icon">
                    <Icon size={20} />
                  </div>

                  <div>
                    <strong>{app.title}</strong>
                    <span>{app.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mission-panel">
          <div className="mission-panel-head">
            <div>
              <h2>System Health</h2>
              <p>Core infrastructure status.</p>
            </div>
          </div>

          <div className="health-list">
            {health.map((item) => {
              const Icon = item.icon;

              return (
                <div className="health-row" key={item.label}>
                  <div className="health-left">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>

                  <strong>{item.status}</strong>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mission-panel">
          <div className="mission-panel-head">
            <div>
              <h2>AI Activity</h2>
              <p>Recent platform movement.</p>
            </div>
          </div>

          <div className="activity-feed">
            <div className="activity-item">
              <span>Today</span>
              <p>Social Distribution module upgraded.</p>
            </div>

            <div className="activity-item">
              <span>Today</span>
              <p>Applications hub added.</p>
            </div>

            <div className="activity-item">
              <span>Recent</span>
              <p>OpenAI execution secured through Supabase Edge Functions.</p>
            </div>

            <div className="activity-item">
              <span>Recent</span>
              <p>Agent chat and persistent thread foundation added.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
