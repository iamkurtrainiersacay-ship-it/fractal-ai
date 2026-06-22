import { useEffect, useState } from "react";
import { getAgents } from "../services/agentService";
import { runAgent } from "../services/openaiService";
import {
  getKnowledgeForAgent,
  buildKnowledgeContext
} from "../services/knowledgeService";

export default function AgentRunner() {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  async function loadAgents() {
    const data = await getAgents();
    setAgents(data || []);

    if (data && data.length > 0) {
      setSelectedAgentId(data[0].id);
    }
  }

  async function handleRunAgent() {
    const selectedAgent = agents.find((item) => item.id === selectedAgentId);

    if (!selectedAgent) {
      alert("Select an agent first.");
      return;
    }

    if (!prompt) {
      alert("Enter a prompt.");
      return;
    }

    setResponse("Running agent with knowledge...");

    try {
      const knowledgeItems = await getKnowledgeForAgent(selectedAgent);
      const knowledgeContext = buildKnowledgeContext(knowledgeItems);

      const enhancedPrompt = `
AGENT:
${selectedAgent.name}

ROLE:
${selectedAgent.role || ""}

KNOWLEDGE BASE:
${knowledgeContext}

USER REQUEST:
${prompt}
`;

      const result = await runAgent(selectedAgent, enhancedPrompt);
      setResponse(result.output);
    } catch (error) {
      console.error(error);
      setResponse("Agent run failed. Check browser console.");
    }
  }

  useEffect(() => {
    loadAgents();
  }, []);

  return (
    <div className="page">
      <h1>Run Agent</h1>
      <p className="muted">Select an agent, send a prompt, and view the result.</p>

      <div className="panel">
        <h3>Agent Runner</h3>

        <div className="form-grid">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} - {agent.model}
              </option>
            ))}
          </select>

          <textarea
            rows="6"
            placeholder="Enter prompt for this agent..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <button className="primary-btn" onClick={handleRunAgent}>
            Run Agent
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Response</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {response || "No response yet."}
        </pre>
      </div>
    </div>
  );
}
