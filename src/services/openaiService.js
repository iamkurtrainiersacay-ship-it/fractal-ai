import { supabase } from "../core/database/supabase";
import { getKnowledge, getKnowledgeForAgent } from "./knowledgeService";
import { createActivityLog } from "./activityService";
import {
  getAgentConversations,
  saveAgentConversation
} from "../apps/agents/services/conversationService";
import {
  getAgentMemory,
  buildMemoryContext
} from "../apps/agents/services/agentMemoryService";

function formatKnowledge(items) {
  return (items || [])
    .map(
      (item) => `
Title: ${item.title}
Type: ${item.type}
Content: ${item.content}
Tags: ${(item.tags || []).join(", ")}
`
    )
    .join("\n\n");
}

function formatHistory(items) {
  return (items || [])
    .map(
      (item) => `
User: ${item.user_message}
Assistant: ${item.assistant_response}
`
    )
    .join("\n\n");
}

export async function runAgent(agent, prompt) {
  const [knowledgeItems, conversations, memoryItems] = await Promise.all([
    getKnowledgeForAgent(agent),
    getAgentConversations(agent.id),
    getAgentMemory(agent.id)
  ]);

  const knowledge = formatKnowledge(knowledgeItems);
  const history = formatHistory(conversations);
  const memory = buildMemoryContext(memoryItems);

  const { data, error } = await supabase.functions.invoke("run-agent", {
    body: {
      agent,
      prompt,
      knowledge,
      history,
      memory
    }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  const output = data?.output || "No response returned.";

  await saveAgentConversation(agent.id, prompt, output);

  await createActivityLog({
    action: "agent_run",
    entity_type: "agent",
    entity_id: agent.id,
    metadata: {
      agent_name: agent.name,
      model: agent.model || "gpt-4.1-mini",
      prompt,
      response: output,
      total_tokens: data?.usage?.total_tokens || 0,
      estimated_cost: data?.usage?.estimated_cost || 0,
      usage: data?.usage || null
    }
  });

  return { output };
}
