import { supabase } from "../core/database/supabase";

export async function getUsers() {
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Failed to load users:", error.message);
    return [];
  }
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
  try {
    const { error } = await supabase
      .from("app_users")
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq("id", userId);

    if (error) console.warn("Online status update skipped:", error.message);
  } catch {
    // silently ignore if columns don't exist yet
  }
}

export async function logSession(userId, username, action, metadata = {}) {
  try {
    const { error } = await supabase
      .from("activity_logs")
      .insert([{
        action,
        entity_type: "session",
        entity_id: userId,
        metadata: { username, ...metadata }
      }]);

    if (error) console.warn("Session log skipped:", error.message);
  } catch {
    // silently ignore
  }
}
