import { supabase } from "../../../core/database/supabase";
import { createActivityLog } from "../../../services/activityService";

export async function getWorkflows() {
  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createWorkflow(workflow) {
  const { data, error } = await supabase
    .from("workflows")
    .insert([workflow])
    .select();

  if (error) {
    console.error("createWorkflow error:", error);
    throw error;
  }

  await createActivityLog({
    action: `Workflow created: ${workflow.name}`,
    entity_type: "workflow",
    entity_id: data?.[0]?.id,
    metadata: workflow
  });

  return data;
}

export async function updateWorkflow(id, updates) {
  const { data, error } = await supabase
    .from("workflows")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw error;

  await createActivityLog({
    action: "Workflow updated",
    entity_type: "workflow",
    entity_id: id,
    metadata: updates
  });

  return data;
}

export async function deleteWorkflow(id) {
  const { error } = await supabase
    .from("workflows")
    .delete()
    .eq("id", id);

  if (error) throw error;

  await createActivityLog({
    action: "Workflow deleted",
    entity_type: "workflow",
    entity_id: id
  });
}
