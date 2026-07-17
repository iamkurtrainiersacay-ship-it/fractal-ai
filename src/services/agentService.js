import { supabase } from "../core/database/supabase";

// The WorkspaceContext fallback used when no workspace row exists yet is a
// synthetic "default" id, not a real uuid — filtering on it would error at
// the DB level, so treat it the same as "no workspace selected".
function isRealWorkspaceId(workspaceId) {
  return Boolean(workspaceId) && workspaceId !== "default";
}

export async function getAgents(workspaceId) {
  let query = supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (isRealWorkspaceId(workspaceId)) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;

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

export async function updateAgent(id, updates, workspaceId) {
  let query = supabase
    .from("agents")
    .update(updates)
    .eq("id", id);

  if (isRealWorkspaceId(workspaceId)) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query.select();

  if (error) throw error;

  return data;
}

export async function deleteAgent(id, workspaceId) {
  let query = supabase
    .from("agents")
    .delete()
    .eq("id", id);

  if (isRealWorkspaceId(workspaceId)) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { error } = await query;

  if (error) throw error;
}
