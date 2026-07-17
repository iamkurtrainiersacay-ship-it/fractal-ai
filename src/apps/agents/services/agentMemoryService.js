import { supabase } from "../../../core/database/supabase";

export async function getAgentMemory(agentId, workspaceId) {
  let query = supabase
    .from("agent_memory")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (workspaceId && workspaceId !== "default") {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Get agent memory error:", error);
    return [];
  }

  return data || [];
}

export async function createAgentMemory(memory) {
  const { data, error } = await supabase
    .from("agent_memory")
    .insert([memory])
    .select();

  if (error) {
    console.error("Create agent memory error:", error);
    throw error;
  }

  return data;
}

export async function deleteAgentMemory(id) {
  const { error } = await supabase
    .from("agent_memory")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete agent memory error:", error);
    throw error;
  }
}

export function buildMemoryContext(memoryItems = []) {
  if (!memoryItems.length) return "No saved memory.";

  return memoryItems
    .map((item) => `MEMORY TYPE: ${item.memory_type || "fact"}\n${item.memory}`)
    .join("\n\n");
}
