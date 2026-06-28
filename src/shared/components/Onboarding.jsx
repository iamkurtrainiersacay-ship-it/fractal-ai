import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  X,
  Rocket,
  MousePointerClick
} from "lucide-react";

const STEPS = [
  {
    title: "Welcome to Fractal AI",
    description: "Let's walk through your AI Operating System together. You'll interact with real features as we go.",
    target: null,
    action: "click-next",
    position: "center"
  },
  {
    title: "This is your Dashboard",
    description: "Mission Control gives you a bird's-eye view of everything — agents, health, and shortcuts. Click anywhere on the Dashboard to continue.",
    target: ".mission-hero",
    action: "click-target",
    position: "bottom",
    route: "/"
  },
  {
    title: "Open Applications",
    description: "Click 'Applications' in the sidebar to see all your available modules.",
    target: "a[href='#/applications']",
    action: "click-target",
    position: "right",
    route: null
  },
  {
    title: "Your App Launcher",
    description: "This is where you launch every module — Social Distribution, Agents, Knowledge, and more. Click any app card to explore.",
    target: ".apps-grid",
    action: "click-next",
    position: "top",
    route: "/applications"
  },
  {
    title: "Meet your AI Agents",
    description: "Click 'AI Agents' in the sidebar to see your agent workspace.",
    target: "a[href='#/multi-agent']",
    action: "click-target",
    position: "right"
  },
  {
    title: "Multi-Agent Workspace",
    description: "Here you can select multiple AI agents and run them together on a shared task. Each agent sees the previous agent's output.",
    target: ".multi-agent-panel",
    action: "click-next",
    position: "bottom",
    route: "/multi-agent"
  },
  {
    title: "Try the Workspace Switcher",
    description: "Click the workspace dropdown in the sidebar to switch between different projects or clients.",
    target: ".ws-switcher-btn",
    action: "click-target",
    position: "right"
  },
  {
    title: "Workspace Switcher",
    description: "You can create separate workspaces for different operations. Close this dropdown and let's continue.",
    target: ".ws-switcher",
    action: "click-next",
    position: "right"
  },
  {
    title: "Open Knowledge Base",
    description: "Click 'Knowledge' in the sidebar — this is your AI memory system.",
    target: "a[href='#/knowledge']",
    action: "click-target",
    position: "right"
  },
  {
    title: "Knowledge Base",
    description: "Store SOPs, prompts, client data, and research here. Everything you add is automatically injected into your agents' context.",
    target: ".page-header",
    action: "click-next",
    position: "bottom",
    route: "/knowledge"
  },
  {
    title: "Try Command Center",
    description: "Press Ctrl+K (or Cmd+K on Mac) to open the spotlight search — it lets you jump to any page instantly.",
    target: null,
    action: "keyboard",
    key: "k",
    position: "center"
  },
  {
    title: "Check out Analytics",
    description: "Click 'Analytics' in the sidebar to see your usage data and charts.",
    target: "a[href='#/analytics']",
    action: "click-target",
    position: "right"
  },
  {
    title: "Analytics Dashboard",
    description: "Track agent runs, token usage, costs over time, and see which agents are most active — all with real-time charts.",
    target: ".analytics-summary",
    action: "click-next",
    position: "bottom",
    route: "/analytics"
  },
  {
    title: "You're all set!",
    description: "You've explored the core of Fractal AI. Go build something amazing — install agents from the Marketplace, create workflows, or start distributing content.",
    target: null,
    action: "finish",
    position: "center"
  }
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [spotlightStyle, setSpotlightStyle] = useState(null);
  const navigate = useNavigate();

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const positionTooltip = useCallback(() => {
    if (!current.target || current.position === "center") {
      setTooltipStyle({});
      setSpotlightStyle(null);
      return;
    }

    const el = document.querySelector(current.target);
    if (!el) {
      setTooltipStyle({});
      setSpotlightStyle(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const pad = 12;

    setSpotlightStyle({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: "16px"
    });

    const pos = current.position;
    const tooltip = {};

    if (pos === "right") {
      tooltip.top = rect.top + rect.height / 2;
      tooltip.left = rect.right + 20;
      tooltip.transform = "translateY(-50%)";
    } else if (pos === "bottom") {
      tooltip.top = rect.bottom + 20;
      tooltip.left = rect.left + rect.width / 2;
      tooltip.transform = "translateX(-50%)";
    } else if (pos === "top") {
      tooltip.top = rect.top - 20;
      tooltip.left = rect.left + rect.width / 2;
      tooltip.transform = "translate(-50%, -100%)";
    } else if (pos === "left") {
      tooltip.top = rect.top + rect.height / 2;
      tooltip.left = rect.left - 20;
      tooltip.transform = "translate(-100%, -50%)";
    }

    const maxLeft = window.innerWidth - 380;
    const maxTop = window.innerHeight - 250;
    if (tooltip.left > maxLeft) tooltip.left = maxLeft;
    if (tooltip.top > maxTop) tooltip.top = maxTop;
    if (tooltip.left < 16) tooltip.left = 16;
    if (tooltip.top < 16) tooltip.top = 16;

    setTooltipStyle(tooltip);
  }, [current]);

  useEffect(() => {
    if (current.route !== undefined && current.route !== null) {
      navigate(current.route);
    }

    const timer = setTimeout(positionTooltip, 150);
    return () => clearTimeout(timer);
  }, [step, current, navigate, positionTooltip]);

  useEffect(() => {
    window.addEventListener("resize", positionTooltip);
    return () => window.removeEventListener("resize", positionTooltip);
  }, [positionTooltip]);

  useEffect(() => {
    if (current.action !== "click-target") return;

    function handleClick(e) {
      const el = document.querySelector(current.target);
      if (el && (el.contains(e.target) || el === e.target)) {
        setTimeout(() => advance(), 300);
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [step, current]);

  useEffect(() => {
    if (current.action !== "keyboard") return;

    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === current.key) {
        setTimeout(() => advance(), 800);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [step, current]);

  function advance() {
    if (step >= STEPS.length - 1) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  }

  function skip() {
    onComplete();
  }

  const isCenter = !current.target || current.position === "center";

  return (
    <div className="tour-overlay">
      {spotlightStyle && (
        <>
          <div className="tour-backdrop tour-backdrop-top" style={{
            top: 0, left: 0, right: 0,
            height: spotlightStyle.top
          }} />
          <div className="tour-backdrop tour-backdrop-bottom" style={{
            top: spotlightStyle.top + spotlightStyle.height,
            left: 0, right: 0, bottom: 0
          }} />
          <div className="tour-backdrop tour-backdrop-left" style={{
            top: spotlightStyle.top,
            left: 0,
            width: spotlightStyle.left,
            height: spotlightStyle.height
          }} />
          <div className="tour-backdrop tour-backdrop-right" style={{
            top: spotlightStyle.top,
            left: spotlightStyle.left + spotlightStyle.width,
            right: 0,
            height: spotlightStyle.height
          }} />
          <div className="tour-spotlight" style={spotlightStyle} />
        </>
      )}

      {!spotlightStyle && <div className="tour-backdrop-full" />}

      <div
        className={`tour-tooltip ${isCenter ? "tour-tooltip-center" : ""}`}
        style={isCenter ? {} : tooltipStyle}
      >
        <div className="tour-progress">
          <div className="tour-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <button className="tour-skip" onClick={skip} title="Skip tour">
          <X size={14} />
        </button>

        <div className="tour-content">
          {current.action === "click-target" && (
            <div className="tour-action-badge">
              <MousePointerClick size={13} />
              <span>Click to continue</span>
            </div>
          )}
          {current.action === "keyboard" && (
            <div className="tour-action-badge">
              <span>Press Ctrl+K</span>
            </div>
          )}

          <h3 className="tour-title">{current.title}</h3>
          <p className="tour-desc">{current.description}</p>

          <div className="tour-footer">
            <span className="tour-counter">{step + 1} / {STEPS.length}</span>

            {(current.action === "click-next" || current.action === "finish") && (
              <button className="primary-btn" onClick={advance}>
                {current.action === "finish" ? (
                  <><Rocket size={14} /> Get Started</>
                ) : (
                  <><ArrowRight size={14} /> Next</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
