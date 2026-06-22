import { supabase } from "../lib/supabase";

export async function getKnowledge() {
  const { data, error } = await supabase
    .from("knowledge")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get knowledge error:", error);
    return [];
  }

  return data || [];
}

export async function createKnowledge(item) {
  const { data, error } = await supabase
    .from("knowledge")
    .insert([item])
    .select();

  if (error) {
    console.error("Create knowledge error:", error);
    throw error;
  }

  return data;
}

export async function updateKnowledge(id, updates) {
  const { data, error } = await supabase
    .from("knowledge")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Update knowledge error:", error);
    throw error;
  }

  return data;
}

export async function deleteKnowledge(id) {
  const { error } = await supabase
    .from("knowledge")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete knowledge error:", error);
    throw error;
  }
}

export async function getKnowledgeForAgent(agent) {
  const { data, error } = await supabase
    .from("knowledge")
    .select("*")
    .or(`agent_id.eq.${agent.id},agent_id.is.null`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get agent knowledge error:", error);
    return [];
  }

  return data || [];
}

export function buildKnowledgeContext(knowledgeItems = []) {
  if (!knowledgeItems.length) return "No matching knowledge found.";

  return knowledgeItems
    .map((item) => {
      return `
TITLE: ${item.title}
TYPE: ${item.type || "General"}
TAGS: ${(item.tags || []).join(", ")}

${item.content}
`;
    })
    .join("\n\n-----------------\n\n");
}
