import { supabase } from "../core/database/supabase";

export async function getAgents() {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

export async function createAgent(agent) {
  const { data, error } = await supabase
    .from("agents")
    .insert([agent])
    .select();

  if (error) throw error;

  return data;
}

export async function updateAgent(id, updates) {
  const { data, error } = await supabase
    .from("agents")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw error;

  return data;
}

export async function deleteAgent(id) {
  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
