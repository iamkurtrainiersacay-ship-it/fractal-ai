import { supabase } from "../lib/supabase";

export async function getAnalytics() {
  const { data: logs, error } = await supabase
    .from("activity_logs")
    .select("*");

  if (error) {
    console.error("Analytics error:", error);
    return { runs: 0, tokens: 0, errors: 1, cost: 0 };
  }

  const agentRuns = (logs || []).filter((log) => log.action === "agent_run");

  const tokens = agentRuns.reduce((sum, log) => {
    return sum + (Number(log.metadata?.total_tokens) || 0);
  }, 0);

  const cost = agentRuns.reduce((sum, log) => {
    return sum + (Number(log.metadata?.estimated_cost) || 0);
  }, 0);

  return {
    runs: agentRuns.length,
    tokens,
    errors: 0,
    cost: cost.toFixed(4)
  };
}
