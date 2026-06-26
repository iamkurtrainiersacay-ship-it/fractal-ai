import { useEffect, useRef, useState } from "react";
import { getAgents } from "../../../services/agentService";
import { runAgent } from "../../../services/openaiService";
import { getWorkspaces, getClients } from "../../../services/workspaceService";
import {
  getChatThreads,
  createChatThread,
  updateThreadMemory,
  getChatMessages,
  saveChatMessage
} from "../services/chatThreadService";

export default function AgentRunner() {
  const [agents, setAgents] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [clients, setClients] = useState([]);
  const [threads, setThreads] = useState([]);

  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [activeThread, setActiveThread] = useState(null);

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);

  const bottomRef = useRef(null);

  async function loadBaseData() {
    const agentData = await getAgents();
    const workspaceData = await getWorkspaces();

    setAgents(agentData || []);
    setWorkspaces(workspaceData || []);

    if (agentData?.length && !selectedAgentId) {
      setSelectedAgentId(agentData[0].id);
      loadThreads(agentData[0].id);
    }

    if (workspaceData?.length && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaceData[0].id);
      loadClients(workspaceData[0].id);
    }
  }

  async function loadClients(workspaceId) {
    const clientData = await getClients(workspaceId);
    setClients(clientData || []);
  }

  async function loadThreads(agentId) {
    if (!agentId) return;
    const threadData = await getChatThreads(agentId);
    setThreads(threadData || []);
  }

  async function loadThreadMessages(thread) {
    setActiveThread(thread);
    const data = await getChatMessages(thread.id);
    setMessages(
      (data || []).map((item) => ({
        role: item.role,
        content: item.content
      }))
    );
  }

  async function startNewThread() {
    const agent = agents.find((item) => item.id === selectedAgentId);

    if (!agent) {
      alert("Select an agent first.");
      return;
    }

    const thread = await createChatThread({
      agentId: agent.id,
      workspaceId: selectedWorkspaceId,
      clientId: selectedClientId,
      title: `${agent.name} Chat`
    });

    setActiveThread(thread);
    setMessages([]);
    await loadThreads(agent.id);
  }

  async function toggleMemory() {
    if (!activeThread) return;

    const nextValue = !activeThread.memory_enabled;

    await updateThreadMemory(activeThread.id, nextValue);

    setActiveThread({
      ...activeThread,
      memory_enabled: nextValue
    });

    await loadThreads(selectedAgentId);
  }

  async function sendMessage() {
    if (!prompt.trim()) return;

    const agent = agents.find((item) => item.id === selectedAgentId);

    if (!agent) {
      alert("Select an agent first.");
      return;
    }

    let thread = activeThread;

    if (!thread) {
      thread = await createChatThread({
        agentId: agent.id,
        workspaceId: selectedWorkspaceId,
        clientId: selectedClientId,
        title: prompt.substring(0, 40)
      });

      setActiveThread(thread);
      await loadThreads(agent.id);
    }

    const userMessage = {
      role: "user",
      content: prompt
    };

    setMessages((prev) => [...prev, userMessage]);
    await saveChatMessage(thread.id, "user", prompt);

    const currentPrompt = prompt;
    setPrompt("");
    setRunning(true);

    try {
      const contextPrompt = thread.memory_enabled
        ? currentPrompt
        : `${currentPrompt}

Note: Memory is disabled for this thread. Do not rely on prior chat history unless included in this message.`;

      const result = await runAgent(agent, contextPrompt);

      const assistantMessage = {
        role: "assistant",
        content: result.output
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await saveChatMessage(thread.id, "assistant", result.output);
    } catch (error) {
      console.error(error);

      const failMessage = {
        role: "assistant",
        content: "Agent failed. Check browser console."
      };

      setMessages((prev) => [...prev, failMessage]);
      await saveChatMessage(thread.id, "assistant", failMessage.content);
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
    loadBaseData();
  }, []);

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadClients(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    if (selectedAgentId) {
      loadThreads(selectedAgentId);
      setActiveThread(null);
      setMessages([]);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, running]);

  const selectedAgent = agents.find((item) => item.id === selectedAgentId);

  return (
    <div className="chat-page">
      <div className="chat-hero">
        <div>
          <p className="eyebrow">Fractal OS</p>
          <h1>Agent Chat</h1>
          <p className="muted">
            Persistent threads, workspace context, client separation, and optional memory.
          </p>
        </div>

        <div className="agent-pill">
          <span>Active Agent</span>
          <strong>{selectedAgent?.name || "None"}</strong>
        </div>
      </div>

      <div className="chat-shell">
        <aside className="chat-sidebar">
          <h3>Context</h3>

          <label>Agent</label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>

          <label>Workspace</label>
          <select
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
          >
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>

          <label>Client</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            <option value="">No client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <button className="primary-btn full-width" onClick={startNewThread}>
            New Chat
          </button>

          {activeThread && (
            <button className="secondary-btn full-width" onClick={toggleMemory}>
              Memory: {activeThread.memory_enabled ? "On" : "Off"}
            </button>
          )}

          <div className="thread-list">
            <h4>Threads</h4>

            {threads.length === 0 ? (
              <p className="muted">No threads yet.</p>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  className={`thread-item ${activeThread?.id === thread.id ? "active" : ""}`}
                  onClick={() => loadThreadMessages(thread)}
                >
                  <span>{thread.title}</span>
                  <small>{thread.memory_enabled ? "Memory on" : "Memory off"}</small>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="chat-main">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <div className="fractal-orb">✦</div>
                <h2>Start a Fractal thread</h2>
                <p>
                  Choose an agent, workspace, and client. Then start chatting.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`chat-message ${message.role}`}>
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

            <button className="send-btn" onClick={sendMessage} disabled={running}>
              ↑
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
