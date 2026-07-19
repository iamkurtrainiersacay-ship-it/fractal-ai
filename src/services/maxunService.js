import { supabase } from "../core/database/supabase";

// Supabase Edge Function URL — routes requests to Maxun server-to-server (no CORS issues)
const PROXY_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/maxun-proxy`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function proxyFetch(path, options = {}) {
  const url = `${PROXY_FN}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ANON_KEY}`,
      ...options.headers,
    },
    body: options.body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Maxun proxy ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// Check if Maxun is configured (non-throwing)
export async function isMaxunConnected() {
  const { data } = await supabase
    .from("integrations")
    .select("config")
    .eq("service_key", "maxun")
    .eq("connected", true)
    .maybeSingle();
  return !!(data?.config?.base_url);
}

// List all robots in Maxun
export async function listRobots() {
  return proxyFetch("/api/v1/robot/getAll");
}

// Trigger a robot run
export async function runRobot(robotId) {
  return proxyFetch("/api/v1/robot/run", {
    method: "POST",
    body: JSON.stringify({ id: robotId }),
  });
}

// List all runs (optionally filtered by robotId)
export async function listRuns(robotId) {
  const qs = robotId ? `?robotId=${robotId}` : "";
  return proxyFetch(`/api/v1/run/getAll${qs}`);
}

// Get a single run result
export async function getRunResult(runId) {
  return proxyFetch(`/api/v1/run/${runId}`);
}
