import { supabase } from "../lib/supabase";
import { createActivityLog } from "./activityService";

export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createProject(project) {
  const { data, error } = await supabase
    .from("projects")
    .insert([project])
    .select();

  if (error) throw error;

  await createActivityLog({
    action: `Project created: ${project.name}`,
    entity_type: "project",
    entity_id: data?.[0]?.id,
    metadata: project
  });

  return data;
}

export async function updateProject(id, updates) {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw error;

  await createActivityLog({
    action: "Project updated",
    entity_type: "project",
    entity_id: id,
    metadata: updates
  });

  return data;
}

export async function deleteProject(id) {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) throw error;

  await createActivityLog({
    action: "Project deleted",
    entity_type: "project",
    entity_id: id
  });
}
