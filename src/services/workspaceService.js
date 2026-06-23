import { supabase } from "../lib/supabase";

export async function getWorkspaces() {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
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
