import { BrowserRouter, Routes, Route } from "react-router-dom";
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

import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <main className="main">
          <Topbar />
          <Routes>
            <Route path="/run-agent" element={<AgentRunner />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
