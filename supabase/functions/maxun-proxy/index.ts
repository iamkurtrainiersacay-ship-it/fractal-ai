import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set ALLOWED_ORIGIN in Supabase Dashboard → Project Settings → Edge Functions → Secrets
// e.g. https://fractal-ai-blond.vercel.app
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-nexus-user-id, x-nexus-workspace-id",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Only these exact paths (or patterns) may be forwarded to Maxun
const ALLOWED_PATH_PATTERNS: RegExp[] = [
  /^\/api\/sdk\/robots$/,
  /^\/api\/sdk\/robots\/[\w-]+\/execute$/,
  /^\/api\/sdk\/robots\/[\w-]+\/runs$/,
  /^\/api\/sdk\/robots\/[\w-]+\/runs\/[\w-]+$/,
  /^\/api\/sdk\/robots\/[\w-]+$/,
  /^\/api\/sdk\/status$/,
];

function isAllowedPath(path: string): boolean {
  const [pathname, qs] = path.split("?");
  return ALLOWED_PATH_PATTERNS.some((re) => re.test(qs ? `${pathname}?${qs}` : pathname));
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // Only allow GET and POST
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonError(405, "Method not allowed.");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── 1. Authenticate ──────────────────────────────────────────────────────────
  // This app uses custom auth (not Supabase Auth). The signed-in user's ID is
  // sent as a custom header and verified against the app_users table.
  const userId = req.headers.get("x-nexus-user-id");
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    return jsonError(401, "Authentication required — no user ID provided.");
  }

  // Verify this user actually exists in the system (service role bypasses RLS)
  const { data: appUser } = await supabase
    .from("app_users")
    .select("id")
    .eq("id", userId.trim())
    .maybeSingle();

  if (!appUser) {
    return jsonError(401, "Unauthorized — user not recognised.");
  }

  // ── 2. Validate Maxun path ───────────────────────────────────────────────────
  const url = new URL(req.url);
  const requestedPath = url.searchParams.get("path") ?? "/api/v1/robot/getAll";

  if (!isAllowedPath(requestedPath)) {
    return jsonError(400, `Path not permitted: ${requestedPath}`);
  }

  // ── 3. Load Maxun config (future: filter by workspace_id) ───────────────────
  // TODO: once integrations table has workspace_id, filter by the caller's workspace.
  const { data: integration } = await supabase
    .from("integrations")
    .select("config")
    .eq("service_key", "maxun")
    .eq("connected", true)
    .maybeSingle();

  const baseUrl = integration?.config?.base_url as string | undefined;
  if (!baseUrl) {
    return jsonError(400, "Maxun is not configured. Go to Integrations → Maxun.");
  }

  // ── 4. Forward request to Maxun with a hard timeout ─────────────────────────
  const maxunUrl = `${baseUrl.replace(/\/$/, "")}${requestedPath}`;
  const upstreamHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
  if (integration?.config?.api_key) {
    upstreamHeaders["x-api-key"] = integration.config.api_key;
  }

  const body = req.method === "POST" ? await req.text() : undefined;

  const isExecute = requestedPath.includes("/execute");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), isExecute ? 120_000 : 30_000);

  try {
    const maxunRes = await fetch(maxunUrl, {
      method: req.method,
      headers: upstreamHeaders,
      body,
      signal: controller.signal,
    });

    const responseText = await maxunRes.text();
    return new Response(responseText, {
      status: maxunRes.status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.includes("aborted");
    return jsonError(isTimeout ? 504 : 502, isTimeout ? "Maxun request timed out." : `Upstream error: ${message}`);
  } finally {
    clearTimeout(timer);
  }
});
