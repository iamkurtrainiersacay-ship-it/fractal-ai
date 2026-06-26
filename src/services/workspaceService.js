import { supabase } from "../core/database/supabase";

export async function getWorkspaces() {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createWorkspace(workspace) {
  const { data, error } = await supabase
    .from("workspaces")
    .insert([workspace])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkspace(id, updates) {
  const { data, error } = await supabase
    .from("workspaces")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkspace(id) {
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getClients(workspaceId) {
  let query = supabase.from("clients").select("*").order("created_at", { ascending: true });

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
