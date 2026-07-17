import { supabase } from "../core/database/supabase";

export async function createActivityLog(log) {
  const { data, error } = await supabase
    .from("activity_logs")
    .insert([log]);

  if (error) {
    console.error("Activity log error:", error);
    return null;
  }

  return data;
}

export async function getActivityLogs() {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get activity logs error:", error);
    return [];
  }

  return data || [];
}

export async function getActivityLogsByAgent(agentId) {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("entity_id", agentId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Get agent logs error:", error);
    return [];
  }

  return data || [];
}
