




















import { useNavigate } from "react-router-dom";
import {
  Brain,
  Share2,
  Bot,
  BarChart3,
  Plug,
  Workflow,
  Sparkles
} from "lucide-react";

const apps = [
  {
    title: "Social Distribution",
    description: "AI-powered social media operations.",
    icon: Share2,
    route: "/social-distribution",
    color: "#38bdf8"
  },
  {
    title: "AI Agents",
    description: "Run specialized AI agents.",
    icon: Bot,
    route: "/run-agent",
    color: "#8b5cf6"
  },
  {
    title: "Agent Marketplace",
    description: "Install pre-built AI agents.",
    icon: Sparkles,
    route: "/marketplace",
    color: "#a855f7"
  },
  {
    title: "Knowledge",
    description: "Enterprise AI knowledge base.",
    icon: Brain,
    route: "/knowledge",
    color: "#10b981"
  },
  {
    title: "Analytics",
    description: "Business intelligence dashboard.",
    icon: BarChart3,
    route: "/analytics",
    color: "#f59e0b"
  },
  {
    title: "Integrations",
    description: "Connected services.",
    icon: Plug,
    route: "/integrations",
    color: "#ef4444"
  },
  {
    title: "Workflows",
    description: "Automation engine.",
    icon: Workflow,
    route: "/workflows",
    color: "#6366f1"
  }
];

export default function Applications() {

  const navigate = useNavigate();

  return (
    <div className="page">

      <div className="page-header">
        <h1>Applications</h1>
        <p>Launch every AI application from one place.</p>
      </div>

      <div className="apps-grid">

        {apps.map((app)=>{

          const Icon = app.icon;

          return(

            <div
              key={app.title}
              className="app-card"
              onClick={()=>navigate(app.route)}
            >

              <div
                className="app-icon"
                style={{background:app.color}}
              >
                <Icon size={28}/>
              </div>

              <h2>{app.title}</h2>

              <p>{app.description}</p>

              <button>
                Open Application
              </button>

            </div>

          )

        })}

      </div>

    </div>
  );

}
