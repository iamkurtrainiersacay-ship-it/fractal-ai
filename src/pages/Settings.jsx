export default function Settings() {
  return (
    <div className="page">
      <h1>Settings</h1>
      <p className="muted">Supabase, OpenAI, model routing, workspace settings, and security.</p>

      <div className="panel">
        <h3>Backend</h3>
        <p>Supabase connection ready.</p>
      </div>

      <div className="panel">
        <h3>Model Router</h3>
        <p>Default model: GPT-5.5</p>
      </div>
    </div>
  );
}
