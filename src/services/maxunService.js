import { supabase } from "../core/database/supabase";

const PROXY_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/maxun-proxy`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Read the signed-in user's ID from the custom session stored in localStorage.
// This app uses custom auth (not Supabase Auth) — session is at nexus_user.
function getSignedInUserId(): string | null {
  try {
    const raw = localStorage.getItem("nexus_user");
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.user?.id || session?.id || null;
  } catch {
    return null;
  }
}

async function proxyFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const userId = getSignedInUserId();
  if (!userId) throw new Error("Not signed in.");

  const url = `${PROXY_FN}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      // Supabase requires the anon key to invoke edge functions
      "Authorization": `Bearer ${ANON_KEY}`,
      // Custom header carries the verified user identity server-side
      "x-nexus-user-id": userId,
      ...(options.headers as Record<string, string> | undefined),
    },
    body: options.body as string | undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text;
    try { message = JSON.parse(text)?.error ?? text; } catch { /* keep raw */ }
    throw new Error(`Maxun ${res.status}: ${message || res.statusText}`);
  }
  return res.json();
}

// Check if Maxun is configured (non-throwing — used to show/hide the setup banner)
export async function isMaxunConnected(): Promise<boolean> {
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
export async function runRobot(robotId: string) {
  return proxyFetch("/api/v1/robot/run", {
    method: "POST",
    body: JSON.stringify({ id: robotId }),
  });
}

// List all runs (optionally filtered by robotId)
export async function listRuns(robotId?: string) {
  const qs = robotId ? `?robotId=${robotId}` : "";
  return proxyFetch(`/api/v1/run/getAll${qs}`);
}

// Get a single run result
export async function getRunResult(runId: string) {
  return proxyFetch(`/api/v1/run/${runId}`);
}
