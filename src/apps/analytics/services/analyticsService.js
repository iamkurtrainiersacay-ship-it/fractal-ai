import { supabase } from "../../../core/database/supabase";

export async function getAnalytics() {
  const { data: logs, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Analytics error:", error);
    return { runs: 0, tokens: 0, errors: 0, cost: 0, daily: [], byAgent: [] };
  }

  const agentRuns = (logs || []).filter((log) => log.action === "agent_run");

  const tokens = agentRuns.reduce((sum, log) => {
    return sum + (Number(log.metadata?.total_tokens) || 0);
  }, 0);

  const cost = agentRuns.reduce((sum, log) => {
    return sum + (Number(log.metadata?.estimated_cost) || 0);
  }, 0);

  const dailyMap = {};
  agentRuns.forEach((log) => {
    const day = new Date(log.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
    if (!dailyMap[day]) {
      dailyMap[day] = { date: day, runs: 0, tokens: 0, cost: 0 };
    }
    dailyMap[day].runs += 1;
    dailyMap[day].tokens += Number(log.metadata?.total_tokens) || 0;
    dailyMap[day].cost += Number(log.metadata?.estimated_cost) || 0;
  });

  const daily = Object.values(dailyMap).map((d) => ({
    ...d,
    cost: Number(d.cost.toFixed(4))
  }));

  const agentMap = {};
  agentRuns.forEach((log) => {
    const name = log.metadata?.agent_name || "Unknown";
    if (!agentMap[name]) {
      agentMap[name] = { name, runs: 0, tokens: 0 };
    }
    agentMap[name].runs += 1;
    agentMap[name].tokens += Number(log.metadata?.total_tokens) || 0;
  });

  const byAgent = Object.values(agentMap).sort((a, b) => b.runs - a.runs);

  return {
    runs: agentRuns.length,
    tokens,
    errors: 0,
    cost: cost.toFixed(4),
    daily,
    byAgent
  };
}
