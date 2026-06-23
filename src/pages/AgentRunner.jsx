import { useEffect, useRef, useState } from "react";
import { getAgents } from "../services/agentService";
import { runAgent } from "../services/openaiService";

export default function AgentRunner() {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const bottomRef = useRef(null);

  async function loadAgents() {
    const data = await getAgents();
    setAgents(data || []);

    if (data?.length && !selectedAgentId) {
      setSelectedAgentId(data[0].id);
    }
  }

  async function sendMessage() {
    if (!prompt.trim()) return;

    const agent = agents.find((item) => item.id === selectedAgentId);
    if (!agent) {
      alert("Select an agent first.");
      return;
    }

    const userMessage = {
      role: "user",
      content: prompt
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setRunning(true);

    try {
      const result = await runAgent(agent, prompt);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.output
        }
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Agent failed. Check browser console."
        }
      ]);
    } finally {
      setRunning(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, running]);

  const selectedAgent = agents.find((item) => item.id === selectedAgentId);

  return (
    <div className="chat-page">
      <div className="chat-hero">
        <div>
          <p className="eyebrow">Command Center</p>
          <h1>Fractal Chat</h1>
          <p className="muted">
            Talk to your agents in a focused, session-based workspace.
          </p>
        </div>

        <div className="agent-pill">
          <span>Active Agent</span>
          <strong>{selectedAgent?.name || "None"}</strong>
        </div>
      </div>

      <div className="chat-shell">
        <div className="chat-sidebar">
          <h3>Agent</h3>

          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} · {agent.model}
              </option>
            ))}
          </select>

          {selectedAgent && (
            <div className="agent-context-card">
              <h4>{selectedAgent.name}</h4>
              <p>{selectedAgent.role}</p>
              <small>
                Temporary chat memory. Clears when this window closes.
              </small>
            </div>
          )}

          <button
            className="secondary-btn full-width"
            onClick={() => setMessages([])}
          >
            Clear Chat
          </button>
        </div>

        <div className="chat-main">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <div className="fractal-orb">✦</div>
                <h2>Start a conversation</h2>
                <p>
                  Ask Fractal to plan, reason, write, research, or execute through an agent.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`chat-message ${message.role}`}
                >
                  <div className="message-avatar">
                    {message.role === "user" ? "You" : "AI"}
                  </div>

                  <div className="message-bubble">
                    {message.content}
                  </div>
                </div>
              ))
            )}

            {running && (
              <div className="chat-message assistant">
                <div className="message-avatar">AI</div>
                <div className="message-bubble typing">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="chat-input-bar">
            <textarea
              placeholder="Message Fractal..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={running}
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
