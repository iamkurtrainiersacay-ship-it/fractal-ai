import { useState } from "react";
import {
  Sparkles,
  LayoutGrid,
  Bot,
  Share2,
  Brain,
  BarChart3,
  Workflow,
  Layers,
  Plug,
  Settings,
  ArrowRight,
  ArrowLeft,
  X,
  Rocket
} from "lucide-react";

const STEPS = [
  {
    icon: Sparkles,
    color: "#8b5cf6",
    title: "Welcome to Fractal AI",
    subtitle: "Your AI Operating System",
    description:
      "Fractal AI is your central command for managing AI agents, automating workflows, distributing content, and running your entire AI-powered operation from one place.",
    tip: "Let's take a quick tour of what you can do."
  },
  {
    icon: LayoutGrid,
    color: "#8b5cf6",
    title: "Mission Control",
    subtitle: "Dashboard",
    description:
      "Your dashboard gives you a bird's-eye view of the entire platform — active agents, system health, recent activity, and quick shortcuts to every module.",
    tip: "This is your home base. You'll land here every time you log in."
  },
  {
    icon: Bot,
    color: "#6366f1",
    title: "AI Agents",
    subtitle: "Your AI Team",
    description:
      "Create, configure, and run specialized AI agents. Each agent has its own system prompt, memory, and knowledge context. Run them solo or collaborate with multiple agents on a single task.",
    tip: "Head to the Marketplace to install pre-built agents like Sales, Marketing, or Research agents."
  },
  {
    icon: Share2,
    color: "#38bdf8",
    title: "Social Distribution",
    subtitle: "Content Operations",
    description:
      "Review, edit, and schedule AI-generated social media posts across platforms. Create content assets that trigger AI generation via Make.com, then approve and publish from one queue.",
    tip: "Posts sync every 30 seconds. Use Ctrl+S to quick-save edits."
  },
  {
    icon: Brain,
    color: "#10b981",
    title: "Knowledge Base",
    subtitle: "AI Memory System",
    description:
      "Store SOPs, prompts, client data, research, and workflows. Knowledge is automatically injected into agent prompts — assign items to specific agents or keep them global.",
    tip: "The more knowledge you add, the smarter your agents become."
  },
  {
    icon: Workflow,
    color: "#a855f7",
    title: "Workflows",
    subtitle: "Automation Engine",
    description:
      "Build multi-step workflows that chain agents together. Each step passes its output to the next — perfect for research-to-report pipelines or content generation flows.",
    tip: "Create a workflow, add steps with assigned agents, then run it with a single input."
  },
  {
    icon: Layers,
    color: "#06b6d4",
    title: "Workspaces",
    subtitle: "Organize Everything",
    description:
      "Workspaces let you separate different projects, clients, or departments. Switch between workspaces from the sidebar — each one has its own context and data.",
    tip: "Use the workspace switcher in the sidebar to manage multiple operations."
  },
  {
    icon: BarChart3,
    color: "#f59e0b",
    title: "Analytics",
    subtitle: "Track Performance",
    description:
      "Monitor agent runs, token usage, costs, and performance over time with interactive charts. See which agents are most active and track your AI spending.",
    tip: "Charts update automatically as you run more agents."
  },
  {
    icon: Plug,
    color: "#ef4444",
    title: "Integrations",
    subtitle: "Connect Services",
    description:
      "Connect external services like OpenAI, Supabase, Gmail, WordPress, Make.com, Zoho, Discord, and Claude. Store API keys securely and manage connections from one place.",
    tip: "Your Supabase and Make.com connections power the core platform."
  },
  {
    icon: Settings,
    color: "#71717a",
    title: "Settings",
    subtitle: "Configure Your Platform",
    description:
      "Manage workspaces, view system status, and configure platform settings. Create new workspaces, edit existing ones, or check backend infrastructure health.",
    tip: "You can create unlimited workspaces for different projects or clients."
  },
  {
    icon: Rocket,
    color: "#8b5cf6",
    title: "You're All Set!",
    subtitle: "Start Building",
    description:
      "You now know everything you need to get started. Explore the platform, install some agents from the Marketplace, add knowledge, and start running your AI operations.",
    tip: "You can revisit this guide anytime from Settings."
  }
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const progress = ((step + 1) / STEPS.length) * 100;

  function next() {
    if (isLast) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  function skip() {
    onComplete();
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <button className="onboarding-skip" onClick={skip} title="Skip guide">
          <X size={18} />
        </button>

        <div className="onboarding-progress">
          <div className="onboarding-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="onboarding-step-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`onboarding-dot ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        <div className="onboarding-icon" style={{ background: current.color }}>
          <Icon size={32} />
        </div>

        <p className="onboarding-subtitle">{current.subtitle}</p>
        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-desc">{current.description}</p>

        <div className="onboarding-tip">
          <Sparkles size={14} />
          <span>{current.tip}</span>
        </div>

        <div className="onboarding-actions">
          {!isFirst && (
            <button className="secondary-btn" onClick={prev}>
              <ArrowLeft size={14} /> Back
            </button>
          )}

          <button className="primary-btn" onClick={next} style={{ marginLeft: "auto" }}>
            {isLast ? "Get Started" : "Next"}
            {!isLast && <ArrowRight size={14} />}
            {isLast && <Rocket size={14} />}
          </button>
        </div>

        <p className="onboarding-counter">
          {step + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
