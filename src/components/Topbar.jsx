import { Zap } from "lucide-react";

export default function Topbar() {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Command Center</p>
        <h2>Fractal.ai</h2>
        <p className="muted">Unified AI operations platform.</p>
      </div>

      <button className="primary-btn">
        <Zap size={18} />
        Launch Agent
      </button>
    </header>
  );
}
