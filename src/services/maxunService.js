import { supabase } from "../core/database/supabase";

const PROXY_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/maxun-proxy`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Read the signed-in user's ID from the custom session stored in localStorage.
function getSignedInUserId() {
  try {
    const raw = localStorage.getItem("nexus_user");
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.user?.id || session?.id || null;
  } catch {
    return null;
  }
}

async function proxyFetch(path, options = {}) {
  const userId = getSignedInUserId();
  if (!userId) throw new Error("Not signed in.");

  const url = `${PROXY_FN}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ANON_KEY}`,
      "x-nexus-user-id": String(userId),
    },
    body: options.body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed?.message || parsed?.error || text;
    } catch { /* keep raw */ }
    throw new Error(`Maxun ${res.status}: ${message || res.statusText}`);
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

export async function listRobots() {
  return proxyFetch("/api/sdk/robots");
}

export async function runRobot(robotId) {
  return proxyFetch(`/api/sdk/robots/${encodeURIComponent(robotId)}/execute`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function listRuns(robotId) {
  return proxyFetch(`/api/sdk/robots/${encodeURIComponent(robotId)}/runs`);
}

export async function getRunResult(robotId, runId) {
  return proxyFetch(`/api/sdk/robots/${encodeURIComponent(robotId)}/runs/${encodeURIComponent(runId)}`);
}
