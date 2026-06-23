import { supabase } from "../lib/supabase";

export async function getWorkflowSteps(workflowId) {
  const { data, error } = await supabase
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", workflowId)
    .order("step_order", { ascending: true });

  if (error) {
    console.error("Get workflow steps error:", error);
    return [];
  }

  return data || [];
}

export async function createWorkflowStep(step) {
  const { data, error } = await supabase
    .from("workflow_steps")
    .insert([step])
    .select();

  if (error) {
    console.error("Create workflow step error:", error);
    throw error;
  }

  return data;
}

export async function deleteWorkflowStep(id) {
  const { error } = await supabase
    .from("workflow_steps")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete workflow step error:", error);
    throw error;
  }
}
