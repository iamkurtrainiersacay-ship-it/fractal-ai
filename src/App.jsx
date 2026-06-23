import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Workflows from "./pages/Workflows";
import Projects from "./pages/Projects";
import Knowledge from "./pages/Knowledge";
import Integrations from "./pages/Integrations";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AgentRunner from "./pages/AgentRunner";
import Auth from "./pages/Auth";

import { getSession } from "./services/authService";
import "./App.css";

function ProtectedLayout() {
  const user = getSession();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/run-agent" element={<AgentRunner />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </HashRouter>
  );
}
