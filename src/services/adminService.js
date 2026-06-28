import { supabase } from "../core/database/supabase";

export async function getUsers() {
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteUser(id) {
  const { error } = await supabase
    .from("app_users")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function toggleSuperAdmin(id, isSuperAdmin) {
  const { data, error } = await supabase
    .from("app_users")
    .update({ is_super_admin: isSuperAdmin })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserOnlineStatus(userId, isOnline) {
  const { error } = await supabase
    .from("app_users")
    .update({
      is_online: isOnline,
      last_seen: new Date().toISOString()
    })
    .eq("id", userId);

  if (error) console.error("Online status update error:", error);
}

export async function logSession(userId, username, action, metadata = {}) {
  const { error } = await supabase
    .from("activity_logs")
    .insert([{
      action,
      entity_type: "session",
      entity_id: userId,
      metadata: { username, ...metadata }
    }]);

  if (error) console.error("Session log error:", error);
}
