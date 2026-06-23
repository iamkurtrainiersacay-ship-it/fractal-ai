import { supabase } from "../lib/supabase";

export async function getChatThreads(agentId) {
  const { data, error } = await supabase
    .from("agent_chat_threads")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createChatThread({ agentId, workspaceId, clientId, title }) {
  const { data, error } = await supabase
    .from("agent_chat_threads")
    .insert({
      agent_id: agentId,
      workspace_id: workspaceId || null,
      client_id: clientId || null,
      title: title || "New Chat",
      memory_enabled: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateThreadMemory(threadId, enabled) {
  const { error } = await supabase
    .from("agent_chat_threads")
    .update({ memory_enabled: enabled })
    .eq("id", threadId);

  if (error) throw error;
}

export async function getChatMessages(threadId) {
  const { data, error } = await supabase
    .from("agent_chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function saveChatMessage(threadId, role, content) {
  const { error } = await supabase
    .from("agent_chat_messages")
    .insert({
      thread_id: threadId,
      role,
      content
    });

  if (error) throw error;
}
