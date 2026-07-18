import { supabase } from "../core/database/supabase";

async function getConfig() {
  const { data } = await supabase
    .from("integrations")
    .select("config")
    .eq("service_key", "maxun")
    .eq("connected", true)
    .maybeSingle();
  return data?.config || null;
}

async function apiFetch(path, options = {}) {
  const config = await getConfig();
  if (!config?.base_url) {
    throw new Error("Maxun not connected. Go to Integrations → Maxun to set your URL.");
  }
  const base = config.base_url.replace(/\/$/, "");
  const headers = { "Content-Type": "application/json" };
  if (config.api_key) headers["Authorization"] = `Bearer ${config.api_key}`;
  const res = await fetch(`${base}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Maxun ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// List all robots in Maxun
export async function listRobots() {
  return apiFetch("/api/v1/robot/getAll");
}

// Trigger a robot run
export async function runRobot(robotId) {
  return apiFetch("/api/v1/robot/run", {
    method: "POST",
    body: JSON.stringify({ id: robotId }),
  });
}

// List all runs (optionally filtered by robotId)
export async function listRuns(robotId) {
  const qs = robotId ? `?robotId=${robotId}` : "";
  return apiFetch(`/api/v1/run/getAll${qs}`);
}

// Get a single run result
export async function getRunResult(runId) {
  return apiFetch(`/api/v1/run/${runId}`);
}

// Check if Maxun is configured (non-throwing)
export async function isMaxunConnected() {
  const config = await getConfig();
  return !!(config?.base_url);
}
