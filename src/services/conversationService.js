import { supabase } from "../lib/supabase";

export async function getAgentConversations(agentId) {
  const { data, error } = await supabase
    .from("agent_conversations")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw error;

  return (data || []).reverse();
}

export async function saveAgentConversation(agentId, userMessage, assistantResponse) {
  const { error } = await supabase
    .from("agent_conversations")
    .insert({
      agent_id: agentId,
      user_message: userMessage,
      assistant_response: assistantResponse
    });

  if (error) throw error;
}
