import { integrations } from "../data/mockData";

export default function Integrations() {
  return (
    <div className="page">
      <h1>Integrations</h1>
      <p className="muted">Connect OpenAI, Supabase, Gmail, WordPress, Make.com, Zoho, Discord, and Claude.</p>

      <div className="card-grid">
        {integrations.map(item => (
          <div className="panel" key={item}>
            <h3>{item}</h3>
            <p>Status: Not connected</p>
            <button className="primary-btn">Connect</button>
          </div>
        ))}
      </div>
    </div>
  );
}
