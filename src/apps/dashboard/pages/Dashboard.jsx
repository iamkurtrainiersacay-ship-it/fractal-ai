import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useWorkspace } from "../../../core/workspace/WorkspaceContext";
import { StaggerContainer, StaggerItem, FadeIn } from "../../../shared/components/PageTransition";
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
      <FadeIn>
        <section className="mission-hero">
          <div>
            <motion.p
              className="sd-eyebrow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              Fractal AI Operating System
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              Mission Control
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              Central command for agents, workflows, social distribution,
              knowledge, analytics, and automation.
            </motion.p>
          </div>

          <motion.button
            className="primary-btn"
            onClick={() => navigate("/applications")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            Open Applications
          </motion.button>
        </section>
      </FadeIn>

      <StaggerContainer className="mission-metrics" stagger={0.06}>
        {metrics.map((metric) => (
          <StaggerItem key={metric.label}>
            <motion.div
              className="mission-metric-card"
              whileHover={{ y: -3, boxShadow: "0 0 25px rgba(139,92,246,0.2)" }}
              transition={{ duration: 0.2 }}
            >
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <section className="mission-grid">
        <FadeIn delay={0.2} className="mission-panel large">
          <div className="mission-panel-head">
            <div>
              <h2>Applications</h2>
              <p>Launch core Fractal modules.</p>
            </div>
          </div>

          <StaggerContainer className="mission-app-list" stagger={0.07}>
            {apps.map((app) => {
              const Icon = app.icon;
              return (
                <StaggerItem key={app.title}>
                  <motion.button
                    className="mission-app-row"
                    onClick={() => navigate(app.route)}
                    whileHover={{ x: 4, boxShadow: "0 0 20px rgba(139,92,246,0.15)" }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="mission-app-icon">
                      <Icon size={20} />
                    </div>
                    <div>
                      <strong>{app.title}</strong>
                      <span>{app.description}</span>
                    </div>
                  </motion.button>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </FadeIn>

        <FadeIn delay={0.3} className="mission-panel">
          <div className="mission-panel-head">
            <div>
              <h2>System Health</h2>
              <p>Core infrastructure status.</p>
            </div>
          </div>

          <StaggerContainer className="health-list" stagger={0.05}>
            {health.map((item) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.label}>
                  <div className="health-row">
                    <div className="health-left">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    <motion.strong
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      {item.status}
                    </motion.strong>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </FadeIn>

        <FadeIn delay={0.4} className="mission-panel">
          <div className="mission-panel-head">
            <div>
              <h2>AI Activity</h2>
              <p>Recent platform movement.</p>
            </div>
          </div>

          <StaggerContainer className="activity-feed" stagger={0.06}>
            {[
              { time: "Today", text: "Social Distribution module upgraded." },
              { time: "Today", text: "Applications hub added." },
              { time: "Recent", text: "OpenAI execution secured through Supabase Edge Functions." },
              { time: "Recent", text: "Agent chat and persistent thread foundation added." }
            ].map((item, i) => (
              <StaggerItem key={i}>
                <div className="activity-item">
                  <span>{item.time}</span>
                  <p>{item.text}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </FadeIn>
      </section>
    </div>
  );
}
