import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Download, Check, Search, Sparkles, ArrowLeft, Cpu, Wrench, Users } from "lucide-react";
import { getAgents, createAgent } from "../../../services/agentService";
import {
  agentTemplates,
  agentCategories,
  agentCategoryGroups,
  executiveAdvisorTemplateIds
} from "../data/agentTemplates";
import { useWorkspace } from "../../../core/workspace/WorkspaceContext";

const categoryLabels = Object.fromEntries(agentCategories.map((c) => [c.id, c.label]));

export default function AgentMarketplace() {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id;
  const [installed, setInstalled] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [installing, setInstalling] = useState(null);
  const [installingTeam, setInstallingTeam] = useState(false);

  useEffect(() => {
    loadInstalled();
  }, [workspaceId]);

  async function loadInstalled() {
    try {
      const agents = await getAgents(workspaceId);
      setInstalled((agents || []).map((a) => a.name.toLowerCase()));
    } catch {
      setInstalled([]);
    }
  }

  function isInstalled(template) {
    return installed.includes(template.name.toLowerCase());
  }

  function buildAgentPayload(template, userId) {
    return {
      name: template.name,
      role: template.role,
      model: template.model,
      system_prompt: template.system_prompt,
      description: template.description,
      status: "active",
      created_by: userId || null,
      workspace_id: workspaceId !== "default" ? workspaceId : null
    };
  }

  async function handleInstall(template) {
    if (isInstalled(template)) return;
    setInstalling(template.template_id);

    try {
      const session = JSON.parse(localStorage.getItem("nexus_user") || "{}");
      const userId = session?.user?.id || session?.id;
      await createAgent(buildAgentPayload(template, userId));
      await loadInstalled();
      toast.success(`${template.name} installed!`);
    } catch (err) {
      console.error("Install agent error:", err);
      toast.error("Failed to install agent.");
    } finally {
      setInstalling(null);
    }
  }

  async function handleInstallExecutiveTeam() {
    setInstallingTeam(true);
    try {
      const session = JSON.parse(localStorage.getItem("nexus_user") || "{}");
      const userId = session?.user?.id || session?.id;
      const toInstall = agentTemplates.filter(
        (t) => executiveAdvisorTemplateIds.includes(t.template_id) && !isInstalled(t)
      );

      for (const template of toInstall) {
        await createAgent(buildAgentPayload(template, userId));
      }

      await loadInstalled();
      toast.success(
        toInstall.length > 0
          ? `Executive Team installed (${toInstall.length} advisor${toInstall.length === 1 ? "" : "s"}).`
          : "Executive Team already installed."
      );
    } catch (err) {
      console.error("Install executive team error:", err);
      toast.error("Failed to install the Executive Team.");
    } finally {
      setInstallingTeam(false);
    }
  }

  const executiveTeamInstalled = agentTemplates
    .filter((t) => executiveAdvisorTemplateIds.includes(t.template_id))
    .every(isInstalled);

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
          <p className="sd-eyebrow">Executive Advisors</p>
          <h1 className="mp-title">Meet Your AI Executive Team</h1>
          <p className="muted">Curated C-suite advisors, plus specialists for every business function. Install in one click.</p>
        </div>

        <button className="secondary-btn" onClick={() => navigate("/agents")}>
          <ArrowLeft size={16} /> My Agents
        </button>
      </section>

      <section className="mp-controls">
        <div className="mp-search">
          <Search size={16} />
          <input
            placeholder="Search advisors and agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className={executiveTeamInstalled ? "mp-install-btn installed" : "primary-btn"}
          onClick={handleInstallExecutiveTeam}
          disabled={installingTeam || executiveTeamInstalled}
        >
          {installingTeam ? (
            <><div className="auth-spinner" /> Installing Executive Team...</>
          ) : executiveTeamInstalled ? (
            <><Check size={16} /> Executive Team Installed</>
          ) : (
            <><Users size={16} /> Install Executive Team</>
          )}
        </button>

        <div
          className={category === "all" ? "mp-cat active" : "mp-cat"}
          role="button"
          tabIndex={0}
          onClick={() => setCategory("all")}
          style={{ display: "inline-block", width: "fit-content" }}
        >
          All Advisors
        </div>

        {agentCategoryGroups.map((group) => (
          <div key={group.id} className="mp-cat-group">
            <p className="mp-cat-group-label">{group.label}</p>
            <div className="mp-categories">
              {group.categories.map((catId) => (
                <button
                  key={catId}
                  className={category === catId ? "mp-cat active" : "mp-cat"}
                  onClick={() => setCategory(catId)}
                >
                  {categoryLabels[catId] || catId}
                </button>
              ))}
            </div>
          </div>
        ))}
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
                <div className="mp-card-cat">{categoryLabels[template.category] || template.category}</div>
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

              {template.tools?.length > 0 && (
                <div className="mp-card-skills mp-card-tools">
                  {template.tools.map((tool) => (
                    <span key={tool} className="mp-skill mp-tool">{tool}</span>
                  ))}
                </div>
              )}

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
                  <><Download size={16} /> Install Advisor</>
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
