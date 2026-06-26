import { useEffect, useState } from "react";
import { getAgents } from "../../../services/agentService";
import { runAgent } from "../../../services/openaiService";

export default function MultiAgentWorkspace() {
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);

  async function loadAgents() {
    const data = await getAgents();
    setAgents(data || []);
  }

  useEffect(() => {
    loadAgents();
  }, []);

  function toggleAgent(agentId) {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  }

  async function runTeam() {
    if (!prompt.trim()) return;
    if (!selectedAgents.length) {
      alert("Select at least one agent.");
      return;
    }

    setRunning(true);

    const userMessage = {
      role: "user",
      agent: "You",
      content: prompt
    };

    setMessages((prev) => [...prev, userMessage]);

    let sharedContext = prompt;

    try {
      for (const agentId of selectedAgents) {
        const agent = agents.find((item) => item.id === agentId);
        if (!agent) continue;

        const result = await runAgent(
          agent,
          `
Shared team task:
${prompt}

Current team context:
${sharedContext}

Respond as ${agent.name}. Add useful output for the next agent.
`
        );

        const agentMessage = {
          role: "agent",
          agent: agent.name,
          content: result.output
        };

        setMessages((prev) => [...prev, agentMessage]);

        sharedContext += `

${agent.name}:
${result.output}
`;
      }

      setPrompt("");
    } catch (error) {
      console.error(error);
      alert("Multi-agent run failed. Check console.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="multi-agent-page">
      <section className="mission-hero">
        <div>
          <p className="sd-eyebrow">Fractal AI Team</p>
          <h1>Multi-Agent Workspace</h1>
          <p>
            Select multiple agents and let them collaborate on one shared task.
          </p>
        </div>

        <button className="primary-btn" onClick={runTeam} disabled={running}>
          {running ? "Running Team..." : "Run AI Team"}
        </button>
      </section>

      <section className="multi-agent-grid">
        <aside className="multi-agent-panel">
          <h2>Agents</h2>
          <p className="muted">Choose the agents for this task.</p>

          <div className="agent-selector-list">
            {agents.map((agent) => (
              <button
                key={agent.id}
                className={
                  selectedAgents.includes(agent.id)
                    ? "agent-selector active"
                    : "agent-selector"
                }
                onClick={() => toggleAgent(agent.id)}
              >
                <strong>{agent.name}</strong>
                <span>{agent.role || "AI Agent"}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="multi-agent-panel">
          <h2>Team Task</h2>

          <textarea
            className="multi-agent-input"
            placeholder="Example: Build a LinkedIn campaign for our AI infrastructure services..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div className="team-flow">
            {selectedAgents.length === 0 ? (
              <p className="muted">No agents selected.</p>
            ) : (
              selectedAgents.map((id, index) => {
                const agent = agents.find((item) => item.id === id);
                return (
                  <div key={id} className="team-flow-step">
                    <span>{index + 1}</span>
                    <strong>{agent?.name || "Agent"}</strong>
                  </div>
                );
              })
            )}
          </div>
        </main>

        <aside className="multi-agent-panel">
          <h2>Team Status</h2>

          <div className="health-list">
            <div className="health-row">
              <span>Selected Agents</span>
              <strong>{selectedAgents.length}</strong>
            </div>

            <div className="health-row">
              <span>Status</span>
              <strong>{running ? "Running" : "Ready"}</strong>
            </div>

            <div className="health-row">
              <span>Mode</span>
              <strong>Sequential</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="multi-agent-panel">
        <h2>Collaboration Output</h2>

        <div className="multi-agent-chat">
          {messages.length === 0 ? (
            <div className="sd-empty">
              <div className="sd-empty-orb">✦</div>
              <h2>No team run yet</h2>
              <p>Select agents, enter a task, and run the AI team.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "team-message user"
                    : "team-message agent"
                }
              >
                <div className="team-message-name">{message.agent}</div>
                <div className="team-message-body">{message.content}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
