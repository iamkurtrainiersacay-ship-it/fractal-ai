import { supabase } from "../lib/supabase";
import { getKnowledge } from "./knowledgeService";
import { createActivityLog } from "./activityService";
import {
  getAgentConversations,
  saveAgentConversation
} from "./conversationService";

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
  const knowledgeItems = await getKnowledge();
  const conversations = await getAgentConversations(agent.id);

  const knowledge = formatKnowledge(knowledgeItems);
  const history = formatHistory(conversations);

  const { data, error } = await supabase.functions.invoke("run-agent", {
    body: {
      agent,
      prompt,
      knowledge,
      history
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
      model: "gpt-4.1-mini",
      prompt,
      response: output,
      usage: data?.usage || null
    }
  });

  return { output };
}
