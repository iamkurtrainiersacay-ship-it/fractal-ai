import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Check, Search, Sparkles, ArrowLeft, Cpu, Wrench } from "lucide-react";
import { getAgents, createAgent } from "../../../services/agentService";
import { agentTemplates, agentCategories } from "../data/agentTemplates";

export default function AgentMarketplace() {
  const navigate = useNavigate();
  const [installed, setInstalled] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [installing, setInstalling] = useState(null);

  useEffect(() => {
    loadInstalled();
  }, []);

  async function loadInstalled() {
    try {
      const agents = await getAgents();
      setInstalled((agents || []).map((a) => a.name.toLowerCase()));
    } catch {
      setInstalled([]);
    }
  }

  function isInstalled(template) {
    return installed.includes(template.name.toLowerCase());
  }

  async function handleInstall(template) {
    if (isInstalled(template)) return;
    setInstalling(template.template_id);

    try {
      await createAgent({
        name: template.name,
        role: template.role,
        model: template.model,
        system_prompt: template.system_prompt,
        status: "active"
      });
      await loadInstalled();
    } catch (err) {
      console.error("Install agent error:", err);
    } finally {
      setInstalling(null);
    }
  }

  const filtered = agentTemplates.filter((t) => {
    const matchCat = category === "all" || t.category === category;
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.role.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="marketplace-page">
      <section className="mp-hero">
        <div>
          <p className="sd-eyebrow">Agent Marketplace</p>
          <h1 className="mp-title">Install AI Agents</h1>
          <p className="muted">Pre-built agents for every business function. Install in one click.</p>
        </div>

        <button className="secondary-btn" onClick={() => navigate("/agents")}>
          <ArrowLeft size={16} /> My Agents
        </button>
      </section>

      <section className="mp-controls">
        <div className="mp-search">
          <Search size={16} />
          <input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mp-categories">
          {agentCategories.map((cat) => (
            <button
              key={cat.id}
              className={category === cat.id ? "mp-cat active" : "mp-cat"}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mp-grid">
        {filtered.map((template) => {
          const alreadyInstalled = isInstalled(template);
          const isLoading = installing === template.template_id;

          return (
            <div key={template.template_id} className="mp-card">
              <div className="mp-card-top">
                <div className="mp-card-icon">
                  <Sparkles size={20} />
                </div>
                <div className="mp-card-cat">{template.category}</div>
              </div>

              <h3>{template.name}</h3>
              <p className="mp-card-role">{template.role}</p>
              <p className="mp-card-desc">{template.description}</p>

              <div className="mp-card-meta">
                <span><Cpu size={12} /> {template.model}</span>
                <span><Wrench size={12} /> {template.skills.length} skills</span>
              </div>

              <div className="mp-card-skills">
                {template.skills.map((skill) => (
                  <span key={skill} className="mp-skill">{skill}</span>
                ))}
              </div>

              <button
                className={alreadyInstalled ? "mp-install-btn installed" : "mp-install-btn"}
                onClick={() => handleInstall(template)}
                disabled={alreadyInstalled || isLoading}
              >
                {isLoading ? (
                  <><div className="auth-spinner" /> Installing...</>
                ) : alreadyInstalled ? (
                  <><Check size={16} /> Installed</>
                ) : (
                  <><Download size={16} /> Install Agent</>
                )}
              </button>
            </div>
          );
        })}
      </section>

      {filtered.length === 0 && (
        <div className="sd-empty">
          <div className="sd-empty-orb">?</div>
          <h2>No agents found</h2>
          <p>Try a different search or category.</p>
        </div>
      )}
    </div>
  );
}
