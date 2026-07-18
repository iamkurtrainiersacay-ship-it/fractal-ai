import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Sidebar from "./shared/components/Sidebar";
import Topbar from "./shared/components/Topbar";
import CommandCenter from "./shared/components/CommandCenter";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import Onboarding from "./shared/components/Onboarding";

import Dashboard from "./apps/dashboard/pages/Dashboard";
import Agents from "./apps/agents/pages/Agents";
import Workflows from "./apps/workflows/pages/Workflows";
import Projects from "./apps/projects/pages/Projects";
import Knowledge from "./apps/knowledge/pages/Knowledge";
import SocialDistribution from "./apps/social/pages/SocialDistribution";
import Integrations from "./apps/integrations/pages/Integrations";
import Analytics from "./apps/analytics/pages/Analytics";
import Settings from "./apps/settings/pages/Settings";
import AgentRunner from "./apps/agents/pages/AgentRunner";
import MultiAgentWorkspace from "./apps/agents/pages/MultiAgentWorkspace";
import AgentMarketplace from "./apps/agents/pages/AgentMarketplace";
import ContentAssets from "./apps/content/pages/ContentAssets";
import Scraper from "./apps/scraper/pages/Scraper";
import Admin from "./apps/admin/pages/Admin";
import FractalCommand from "./apps/command/pages/FractalCommand";
import Applications from "./pages/Applications";
import Workspace from "./apps/workspace/pages/Workspace";
import Auth from "./pages/Auth";

import { getSession } from "./services/authService";
import { startSessionTracking } from "./services/sessionService";
import { WorkspaceProvider } from "./core/workspace/WorkspaceContext";
import "./App.css";

const ONBOARDING_KEY = "nexus_onboarding_complete";
const OLD_ONBOARDING_KEY = "fractal_onboarding_complete";

function ProtectedLayout() {
  const user = getSession();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Migrate old key once
    const oldVal = localStorage.getItem(OLD_ONBOARDING_KEY);
    if (oldVal && !localStorage.getItem(ONBOARDING_KEY)) {
      localStorage.setItem(ONBOARDING_KEY, oldVal);
      localStorage.removeItem(OLD_ONBOARDING_KEY);
    }
    return !localStorage.getItem(ONBOARDING_KEY);
  });

  useEffect(() => {
    if (user) startSessionTracking();
  }, []);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  function completeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }

  const isSuperAdmin = user?.user?.is_super_admin || user?.is_super_admin;

  return (
    <>
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      <div className="app">
        <Sidebar isSuperAdmin={isSuperAdmin} />
        <main className="main">
          <Topbar />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/workspace" element={<Workspace />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/social-distribution" element={<SocialDistribution />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/run-agent" element={<AgentRunner />} />
              <Route path="/multi-agent" element={<MultiAgentWorkspace />} />
              <Route path="/marketplace" element={<AgentMarketplace />} />
              <Route path="/content-assets" element={<ContentAssets />} />
              <Route path="/scraper" element={<Scraper />} />
              <Route path="/command" element={<FractalCommand />} />
              {isSuperAdmin && <Route path="/admin" element={<Admin />} />}
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <HashRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(20, 20, 28, 0.95)",
              color: "#f4f4f5",
              border: "1px solid rgba(139, 92, 246, 0.15)",
              borderRadius: "12px",
              fontSize: "13px"
            }
          }}
        />
        <CommandCenter />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </HashRouter>
    </WorkspaceProvider>
  );
}
