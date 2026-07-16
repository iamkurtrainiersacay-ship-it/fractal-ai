import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, ChevronDown } from "lucide-react";

const KNOWLEDGE_BASE = [
  {
    keywords: ["workflow", "create workflow", "build workflow", "automation"],
    title: "Creating Workflows",
    answer: "Go to **Workflows** from the sidebar. Click **Create Workflow**, give it a name and description. Then add **Steps** — each step assigns an agent to process the input. Steps run sequentially, passing output to the next agent. Click **Run Workflow** with your input to execute the full chain."
  },
  {
    keywords: ["agent", "create agent", "add agent", "install agent", "new agent"],
    title: "Adding AI Agents",
    answer: "Go to **Applications → Agent Marketplace** to browse and install pre-built agents (Sales, Marketing, Research, etc.). Click **Install** on any agent card. To create a custom agent, go to **AI Agents** and click **Create Agent** — set a name, role, model, and system prompt."
  },
  {
    keywords: ["run agent", "chat agent", "use agent", "talk to agent"],
    title: "Running an Agent",
    answer: "Go to **Applications → AI Agents** or click **AI Agents** in the sidebar. Select an agent, optionally choose a workspace and client context, then type your message and hit send. The agent uses its system prompt, knowledge base, and memory to respond."
  },
  {
    keywords: ["multi agent", "multiple agents", "collaborate", "team"],
    title: "Multi-Agent Collaboration",
    answer: "Go to **AI Agents** in the sidebar — this opens the Multi-Agent Workspace. Select multiple agents from the sidebar, type a shared task, and click **Run Team**. Each agent runs sequentially, seeing the previous agents' output as context."
  },
  {
    keywords: ["social", "distribution", "post", "schedule", "content"],
    title: "Social Distribution",
    answer: "Go to **Applications → Social Distribution**. Your AI-generated posts appear in the queue (synced every 30s). Click a post to edit it, then **Save**, **Reject**, or **Schedule** it. Scheduled posts are sent to Make.com for publishing. Use the Operations Center to create new content assets."
  },
  {
    keywords: ["knowledge", "sop", "memory", "add knowledge"],
    title: "Knowledge Base",
    answer: "Go to **Knowledge** in the sidebar. Click **Save Knowledge** to add SOPs, prompts, client data, or research. You can assign knowledge to a specific agent or keep it global. All knowledge is automatically injected into agent prompts when they run."
  },
  {
    keywords: ["workspace", "switch workspace", "create workspace"],
    title: "Managing Workspaces",
    answer: "Click the **workspace dropdown** in the sidebar to switch between workspaces. To create or manage workspaces, go to **Settings → Workspaces tab**. Each workspace separates your data and context for different projects or clients."
  },
  {
    keywords: ["analytics", "usage", "cost", "tokens", "stats"],
    title: "Analytics & Usage",
    answer: "Go to **Analytics** in the sidebar. You'll see charts for agent runs over time, token usage, costs, and a breakdown by agent. All data comes from your actual activity logs."
  },
  {
    keywords: ["integration", "connect", "api key", "openai", "supabase"],
    title: "Setting Up Integrations",
    answer: "Go to **Integrations** in the sidebar. Click **Connect** on any service (OpenAI, Supabase, Gmail, etc.), enter your API key or credentials, and click **Save**. Keys are stored securely in your database. Click **Edit** to update or **Disconnect** to remove."
  },
  {
    keywords: ["command center", "search", "shortcut", "ctrl k", "cmd k"],
    title: "Command Center",
    answer: "Press **Ctrl+K** (or Cmd+K on Mac) anywhere in the app to open the Command Center. Type to search and jump to any page instantly — Dashboard, Agents, Social Distribution, Workflows, and more."
  },
  {
    keywords: ["project", "projects", "github"],
    title: "Managing Projects",
    answer: "Go to **Applications → Workspace → Projects**. Add projects with a name, description, GitHub repo URL, and CLI commands. Projects help you organize your development work alongside your AI operations."
  },
  {
    keywords: ["content asset", "asset", "make", "generate"],
    title: "Creating Content Assets",
    answer: "Go to **Applications → Content Assets** or use the Asset Creator in Social Distribution's Operations Center. Fill in title, category, content type, and description. When you create an asset, it triggers a Make.com webhook that generates AI posts automatically."
  },
  {
    keywords: ["memory", "agent memory", "remember", "learn"],
    title: "Agent Memory",
    answer: "Go to **AI Agents → select an agent → Memory tab**. Add memory items (facts, preferences, instructions) that persist across conversations. Memory is injected into the agent's context every time it runs, making it smarter over time."
  },
  {
    keywords: ["settings", "configure", "setup"],
    title: "Platform Settings",
    answer: "Go to **Settings** in the sidebar. The **General** tab shows platform overview, **Workspaces** tab lets you create/edit/delete workspaces, and **Backend** tab shows infrastructure status (Supabase, OpenAI, Make.com connections)."
  },
  {
    keywords: ["login", "auth", "password", "account", "logout"],
    title: "Authentication",
    answer: "The login page appears when you're not authenticated. Enter your username and password to sign in. Sessions last 24 hours before requiring re-login. To log out, clear your session from the browser (this will be added to Settings in a future update)."
  }
];

function findAnswers(query) {
  if (!query.trim()) return [];

  const q = query.toLowerCase();
  const scored = KNOWLEDGE_BASE.map((item) => {
    let score = 0;
    for (const kw of item.keywords) {
      if (q.includes(kw)) score += 3;
      else if (kw.split(" ").some((word) => q.includes(word))) score += 1;
    }
    if (item.title.toLowerCase().includes(q)) score += 2;
    return { ...item, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored;
}

function formatAnswer(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export default function AskFractal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [history]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;

    const answers = findAnswers(query);
    const response = answers.length > 0
      ? answers.map((a) => `**${a.title}**\n${a.answer}`).join("\n\n---\n\n")
      : "I couldn't find a specific answer for that. Try asking about **workflows**, **agents**, **social distribution**, **knowledge**, **analytics**, **integrations**, **workspaces**, or **settings**.";

    setHistory((prev) => [
      ...prev,
      { role: "user", text: query },
      { role: "assistant", text: response }
    ]);
    setQuery("");
    setResults([]);
  }

  function handleInput(value) {
    setQuery(value);
    if (value.length > 2) {
      setResults(findAnswers(value));
    } else {
      setResults([]);
    }
  }

  function selectSuggestion(item) {
    setHistory((prev) => [
      ...prev,
      { role: "user", text: item.title },
      { role: "assistant", text: `**${item.title}**\n${item.answer}` }
    ]);
    setQuery("");
    setResults([]);
  }

  return (
    <>
      <button
        className="ask-nexus-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Ask Nexus"
      >
        {isOpen ? <ChevronDown size={20} /> : <Sparkles size={20} />}
        <span>Ask Nexus</span>
      </button>

      {isOpen && (
        <div className="ask-nexus-panel">
          <div className="ask-nexus-header">
            <Sparkles size={16} />
            <h3>Ask Nexus</h3>
            <button className="ask-nexus-close" onClick={() => setIsOpen(false)}>
              <X size={14} />
            </button>
          </div>

          <div className="ask-nexus-chat" ref={chatRef}>
            {history.length === 0 && (
              <div className="ask-nexus-empty">
                <Sparkles size={28} style={{ color: "var(--primary)", marginBottom: "8px" }} />
                <p>Ask me anything about Nexus Prime</p>
                <div className="ask-nexus-suggestions">
                  {["How do I create a workflow?", "How do I use agents?", "How does Social Distribution work?"].map((q) => (
                    <button
                      key={q}
                      className="ask-nexus-suggestion"
                      onClick={() => { setQuery(q); handleInput(q); }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {history.map((msg, i) => (
              <div key={i} className={`ask-nexus-msg ${msg.role}`}>
                <div
                  className="ask-nexus-bubble"
                  dangerouslySetInnerHTML={{ __html: formatAnswer(msg.text) }}
                />
              </div>
            ))}
          </div>

          {results.length > 0 && (
            <div className="ask-nexus-autocomplete">
              {results.map((item) => (
                <button
                  key={item.title}
                  className="ask-nexus-ac-item"
                  onClick={() => selectSuggestion(item)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.answer.slice(0, 60)}...</span>
                </button>
              ))}
            </div>
          )}

          <form className="ask-nexus-input" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              placeholder="Ask a question..."
              value={query}
              onChange={(e) => handleInput(e.target.value)}
            />
            <button type="submit" disabled={!query.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
