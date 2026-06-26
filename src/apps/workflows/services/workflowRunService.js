import { supabase } from "../../../core/database/supabase";
import { createActivityLog } from "../../../services/activityService";

export async function createWorkflowRun(run) {
  const { data, error } = await supabase
    .from("workflow_runs")
    .insert([run])
    .select();

  if (error) {
    console.error("Create workflow run error:", error);
    throw error;
  }

  await createActivityLog({
    action: "workflow_run",
    entity_type: "workflow",
    entity_id: run.workflow_id,
    metadata: {
      workflow_name: run.workflow_name,
      input: run.input,
      output: run.output,
      status: run.status
    }
  });

  return data;
}

export async function getWorkflowRuns() {
  const { data, error } = await supabase
    .from("workflow_runs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get workflow runs error:", error);
    return [];
  }

  return data || [];
}

export async function deleteWorkflowRun(id) {
  const { error } = await supabase
    .from("workflow_runs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete workflow run error:", error);
    throw error;
  }
}
