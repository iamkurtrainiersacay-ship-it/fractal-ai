import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plug,
  Database,
  Mail,
  Globe,
  Zap,
  MessageSquare,
  Bot,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  X
} from "lucide-react";
import { supabase } from "../../../core/database/supabase";

const INTEGRATIONS = [
  {
    key: "openai",
    name: "OpenAI",
    description: "GPT models for agent execution and text generation.",
    icon: Bot,
    color: "#10b981",
    fields: [{ name: "api_key", label: "API Key", secret: true }]
  },
  {
    key: "supabase",
    name: "Supabase",
    description: "Database, auth, storage, and edge functions.",
    icon: Database,
    color: "#3ecf8e",
    fields: [
      { name: "project_url", label: "Project URL", secret: false },
      { name: "anon_key", label: "Anon Key", secret: true }
    ]
  },
  {
    key: "gmail",
    name: "Gmail",
    description: "Email sending and inbox monitoring.",
    icon: Mail,
    color: "#ea4335",
    fields: [{ name: "api_key", label: "App Password", secret: true }]
  },
  {
    key: "wordpress",
    name: "WordPress",
    description: "Blog publishing and content management.",
    icon: Globe,
    color: "#21759b",
    fields: [
      { name: "site_url", label: "Site URL", secret: false },
      { name: "api_key", label: "Application Password", secret: true }
    ]
  },
  {
    key: "make",
    name: "Make.com",
    description: "Workflow automation and webhook triggers.",
    icon: Zap,
    color: "#6d28d9",
    fields: [{ name: "api_key", label: "API Token", secret: true }]
  },
  {
    key: "zoho",
    name: "Zoho",
    description: "CRM and business suite integration.",
    icon: Sparkles,
    color: "#f59e0b",
    fields: [{ name: "api_key", label: "API Key", secret: true }]
  },
  {
    key: "discord",
    name: "Discord",
    description: "Bot messaging and server notifications.",
    icon: MessageSquare,
    color: "#5865f2",
    fields: [{ name: "bot_token", label: "Bot Token", secret: true }]
  },
  {
    key: "claude",
    name: "Claude",
    description: "Anthropic Claude models for advanced reasoning.",
    icon: Sparkles,
    color: "#d97706",
    fields: [{ name: "api_key", label: "API Key", secret: true }]
  },
  {
    key: "maxun",
    name: "Maxun",
    description: "No-code web scraping robots — extract data from any website into your Knowledge Base.",
    icon: Globe,
    color: "#f97316",
    fields: [
      { name: "base_url", label: "Maxun URL (ngrok https://)", secret: false },
      { name: "api_key", label: "API Key (optional)", secret: true }
    ],
    setupNote: "Maxun runs on localhost — expose it with: ngrok http 8080 (or whatever port Maxun uses)"
  }
];

export default function Integrations() {
  const [configs, setConfigs] = useState({});
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    try {
      const { data, error } = await supabase
        .from("integrations")
        .select("*");

      if (error) {
        console.warn("Integrations table not found — create it in Supabase.");
        return;
      }

      const map = {};
      (data || []).forEach((row) => {
        map[row.service_key] = row;
      });
      setConfigs(map);
    } catch {
      setConfigs({});
    }
  }

  function startEditing(integration) {
    const existing = configs[integration.key];
    const fields = {};
    integration.fields.forEach((f) => {
      fields[f.name] = existing?.config?.[f.name] || "";
    });
    setForm(fields);
    setEditing(integration.key);
    setShowSecrets({});
  }

  function cancelEditing() {
    setEditing(null);
    setForm({});
    setShowSecrets({});
  }

  async function saveConfig(integration) {
    setSaving(true);
    try {
      const existing = configs[integration.key];
      const payload = {
        service_key: integration.key,
        service_name: integration.name,
        config: form,
        connected: Object.values(form).some((v) => v.trim() !== ""),
        updated_at: new Date().toISOString()
      };

      if (existing) {
        const { error } = await supabase
          .from("integrations")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("integrations")
          .insert([payload]);
        if (error) throw error;
      }

      toast.success(`${integration.name} configuration saved.`);
      await loadConfigs();
      setEditing(null);
      setForm({});
    } catch (err) {
      toast.error(err.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect(integration) {
    try {
      const existing = configs[integration.key];
      if (!existing) return;

      const { error } = await supabase
        .from("integrations")
        .update({ connected: false, config: {} })
        .eq("id", existing.id);

      if (error) throw error;
      toast.success(`${integration.name} disconnected.`);
      await loadConfigs();
    } catch (err) {
      toast.error(err.message || "Failed to disconnect.");
    }
  }

  function maskValue(value) {
    if (!value || value.length < 8) return "••••••••";
    return value.slice(0, 4) + "••••" + value.slice(-4);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Integrations</h1>
        <p>Connect external services and manage API credentials securely.</p>
      </div>

      <div className="integration-grid">
        {INTEGRATIONS.map((integration) => {
          const Icon = integration.icon;
          const config = configs[integration.key];
          const isConnected = config?.connected;
          const isEditing = editing === integration.key;

          return (
            <div className="panel" key={integration.key} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  className="app-icon"
                  style={{
                    background: integration.color,
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    marginBottom: 0,
                    flexShrink: 0
                  }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{integration.name}</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                    {integration.description}
                  </p>
                </div>
                {isConnected && !isEditing && (
                  <span className="status-badge uploaded" style={{ fontSize: "11px" }}>Connected</span>
                )}
              </div>

              {isEditing ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {integration.setupNote && (
                    <div style={{ fontSize: "12px", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: "8px", padding: "10px 12px", color: "var(--text-secondary)" }}>
                      <strong style={{ color: "#f97316" }}>Setup: </strong>{integration.setupNote}
                    </div>
                  )}
                  {integration.fields.map((field) => (
                    <div key={field.name} style={{ display: "grid", gap: "4px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                        {field.label}
                      </label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input
                          type={field.secret && !showSecrets[field.name] ? "password" : "text"}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          value={form[field.name] || ""}
                          onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                          style={{ flex: 1 }}
                        />
                        {field.secret && (
                          <button
                            className="secondary-btn"
                            style={{ padding: "8px 10px" }}
                            onClick={() => setShowSecrets({ ...showSecrets, [field.name]: !showSecrets[field.name] })}
                            type="button"
                          >
                            {showSecrets[field.name] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button className="primary-btn" onClick={() => saveConfig(integration)} disabled={saving}>
                      <Check size={14} /> {saving ? "Saving..." : "Save"}
                    </button>
                    <button className="secondary-btn" onClick={cancelEditing}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {isConnected && (
                    <div style={{ display: "grid", gap: "4px" }}>
                      {integration.fields.map((field) => (
                        <div key={field.name} style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {field.label}: {field.secret ? maskValue(config?.config?.[field.name]) : (config?.config?.[field.name] || "—")}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                    <button
                      className="primary-btn"
                      onClick={() => startEditing(integration)}
                      style={{ flex: 1 }}
                    >
                      <Plug size={14} /> {isConnected ? "Edit" : "Connect"}
                    </button>
                    {isConnected && (
                      <button
                        className="danger-btn"
                        onClick={() => disconnect(integration)}
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
