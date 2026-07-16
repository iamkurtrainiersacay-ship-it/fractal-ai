import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Image, X, Upload, Send, Plus, Brain } from "lucide-react";
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

const MAX_IMAGE_SIZE_MB = 5;

// ─── Image helpers ────────────────────────────────────────────────────────────

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isImageFile(file) {
  return file && file.type.startsWith("image/");
}

// ─── Message renderer (handles text + images) ─────────────────────────────────

function MessageContent({ content, images }) {
  return (
    <div className="msg-content">
      {images && images.length > 0 && (
        <div className="msg-images">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Attached image ${i + 1}`}
              className="msg-image"
            />
          ))}
        </div>
      )}
      {content && <p className="msg-text">{content}</p>}
    </div>
  );
}

// ─── Image preview strip ──────────────────────────────────────────────────────

function ImagePreviewStrip({ images, onRemove }) {
  if (!images.length) return null;
  return (
    <div className="chat-image-strip">
      {images.map((img, i) => (
        <div key={i} className="chat-image-thumb">
          <img src={img.url} alt="" />
          <button
            className="chat-image-remove"
            onClick={() => onRemove(i)}
            type="button"
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Drag overlay ─────────────────────────────────────────────────────────────

function DragOverlay({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="chat-drag-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Upload size={32} />
          <p>Drop image here</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgentRunner() {
  const location = useLocation();
  const [agents, setAgents] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [clients, setClients] = useState([]);
  const [threads, setThreads] = useState([]);

  const [selectedAgentId, setSelectedAgentId] = useState(
    location.state?.agent?.id || ""
  );
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [activeThread, setActiveThread] = useState(null);

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);

  // Image state
  const [attachedImages, setAttachedImages] = useState([]);
  const [dragging, setDragging] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // ── Data loading ─────────────────────────────────────────────────────────────

  async function loadBaseData() {
    try {
      const [agentData, workspaceData] = await Promise.all([
        getAgents(),
        getWorkspaces()
      ]);

      setAgents(agentData || []);
      setWorkspaces(workspaceData || []);

      const preselectedId = location.state?.agent?.id;

      if (agentData?.length) {
        const id = preselectedId || agentData[0].id;
        setSelectedAgentId(id);
        loadThreads(id);
      }

      if (workspaceData?.length && !selectedWorkspaceId) {
        setSelectedWorkspaceId(workspaceData[0].id);
        loadClients(workspaceData[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadClients(workspaceId) {
    const data = await getClients(workspaceId).catch(() => []);
    setClients(data || []);
  }

  async function loadThreads(agentId) {
    if (!agentId) return;
    const data = await getChatThreads(agentId).catch(() => []);
    setThreads(data || []);
  }

  async function loadThreadMessages(thread) {
    setActiveThread(thread);
    const data = await getChatMessages(thread.id).catch(() => []);
    setMessages((data || []).map((item) => ({
      role: item.role,
      content: item.content,
      images: [] // images not persisted, show placeholder
    })));
  }

  async function startNewThread() {
    const agent = agents.find((a) => a.id === selectedAgentId);
    if (!agent) { toast.error("Select an agent first."); return; }

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
    const next = !activeThread.memory_enabled;
    await updateThreadMemory(activeThread.id, next);
    setActiveThread({ ...activeThread, memory_enabled: next });
    await loadThreads(selectedAgentId);
  }

  // ── Image capture ─────────────────────────────────────────────────────────────

  const captureImages = useCallback(async (files) => {
    const imageFiles = Array.from(files).filter(isImageFile);
    if (!imageFiles.length) return;

    const oversized = imageFiles.filter(f => f.size > MAX_IMAGE_SIZE_MB * 1024 * 1024);
    if (oversized.length) {
      toast.error(`Image too large (max ${MAX_IMAGE_SIZE_MB}MB)`);
      return;
    }

    const newImages = await Promise.all(
      imageFiles.map(async (file) => ({
        url: await readFileAsDataUrl(file),
        name: file.name || "image"
      }))
    );

    setAttachedImages((prev) => [...prev, ...newImages]);
  }, []);

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItems = Array.from(items)
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (imageItems.length) {
      e.preventDefault();
      captureImages(imageItems);
    }
  }

  function handleDragEnter(e) {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    captureImages(e.dataTransfer.files);
  }

  function removeImage(index) {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileInput(e) {
    captureImages(e.target.files);
    e.target.value = "";
  }

  // ── Send message ──────────────────────────────────────────────────────────────

  async function sendMessage() {
    if (!prompt.trim() && !attachedImages.length) return;

    const agent = agents.find((a) => a.id === selectedAgentId);
    if (!agent) { toast.error("Select an agent first."); return; }

    let thread = activeThread;
    if (!thread) {
      const title = prompt.substring(0, 40) || (attachedImages.length ? "Image" : "New chat");
      thread = await createChatThread({
        agentId: agent.id,
        workspaceId: selectedWorkspaceId,
        clientId: selectedClientId,
        title
      });
      setActiveThread(thread);
      await loadThreads(agent.id);
    }

    const imageUrls = attachedImages.map((img) => img.url);
    const userMessage = { role: "user", content: prompt, images: imageUrls };

    setMessages((prev) => [...prev, userMessage]);

    // Persist text content only (images are large — don't store base64 in DB)
    const dbContent = [
      prompt,
      imageUrls.length ? `[${imageUrls.length} image(s) attached]` : ""
    ].filter(Boolean).join(" ");

    await saveChatMessage(thread.id, "user", dbContent).catch(() => {});

    const currentPrompt = prompt;
    const currentImages = [...attachedImages];
    setPrompt("");
    setAttachedImages([]);
    setRunning(true);

    try {
      // Build agent prompt — include image context for vision-capable models
      const imageNote = currentImages.length
        ? `\n\n[The user has attached ${currentImages.length} image(s) to this message. If you are a vision-capable model, describe and analyze them. The images are embedded in the conversation.]`
        : "";

      const contextPrompt = thread.memory_enabled
        ? `${currentPrompt}${imageNote}`
        : `${currentPrompt}${imageNote}\n\nNote: Memory is disabled for this thread.`;

      const result = await runAgent(agent, contextPrompt, currentImages.map(i => i.url));

      const assistantMessage = { role: "assistant", content: result.output, images: [] };
      setMessages((prev) => [...prev, assistantMessage]);
      await saveChatMessage(thread.id, "assistant", result.output).catch(() => {});
    } catch (error) {
      const fail = { role: "assistant", content: "Agent failed. Check browser console.", images: [] };
      setMessages((prev) => [...prev, fail]);
      await saveChatMessage(thread.id, "assistant", fail.content).catch(() => {});
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

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => { loadBaseData(); }, []);
  useEffect(() => { if (selectedWorkspaceId) loadClients(selectedWorkspaceId); }, [selectedWorkspaceId]);
  useEffect(() => {
    if (selectedAgentId) {
      loadThreads(selectedAgentId);
      setActiveThread(null);
      setMessages([]);
    }
  }, [selectedAgentId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, running]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div
      className="chat-page"
      onPaste={handlePaste}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <DragOverlay visible={dragging} />

      <div className="chat-hero">
        <div>
          <p className="eyebrow">Nexus Prime</p>
          <h1>Agent Chat</h1>
          <p className="muted">
            Persistent threads, workspace context, client separation, and memory.
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
          <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <label>Workspace</label>
          <select value={selectedWorkspaceId} onChange={(e) => setSelectedWorkspaceId(e.target.value)}>
            {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>

          <label>Client</label>
          <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
            <option value="">No client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <button className="primary-btn full-width" onClick={startNewThread}>
            <Plus size={14} /> New Chat
          </button>

          {activeThread && (
            <button className="secondary-btn full-width" onClick={toggleMemory}>
              <Brain size={14} /> Memory: {activeThread.memory_enabled ? "On" : "Off"}
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
                <div className="nexus-orb">✦</div>
                <h2>Start a Nexus thread</h2>
                <p>Choose an agent, workspace, and client. Then start chatting.</p>
                <p className="muted" style={{ marginTop: "12px", fontSize: "12px" }}>
                  Tip: Paste or drag an image anywhere to attach it
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={index}
                  className={`chat-message ${message.role}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="message-avatar">
                    {message.role === "user" ? "You" : "AI"}
                  </div>
                  <div className="message-bubble">
                    <MessageContent content={message.content} images={message.images} />
                  </div>
                </motion.div>
              ))
            )}

            {running && (
              <motion.div
                className="chat-message assistant"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="message-avatar">AI</div>
                <div className="message-bubble typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="chat-input-bar">
            <ImagePreviewStrip images={attachedImages} onRemove={removeImage} />

            <div className="chat-input-row">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleFileInput}
              />
              <button
                type="button"
                className="chat-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image (or paste / drag)"
              >
                <Image size={18} />
              </button>

              <textarea
                ref={textareaRef}
                placeholder={attachedImages.length ? "Add a caption (optional)..." : "Message Nexus... (paste or drag an image to attach)"}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={running || (!prompt.trim() && !attachedImages.length)}
              >
                {running ? "…" : <Send size={16} />}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
