import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // Get Maxun config from integrations table
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data } = await supabase
      .from("integrations")
      .select("config")
      .eq("service_key", "maxun")
      .eq("connected", true)
      .maybeSingle();

    const baseUrl = data?.config?.base_url;
    if (!baseUrl) {
      return new Response(JSON.stringify({ error: "Maxun not configured in Integrations." }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Forward the request to Maxun
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/api/v1/robot/getAll";
    const maxunUrl = `${baseUrl.replace(/\/$/, "")}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    };
    if (data?.config?.api_key) {
      headers["Authorization"] = `Bearer ${data.config.api_key}`;
    }

    const body = req.method === "POST" ? await req.text() : undefined;

    const maxunRes = await fetch(maxunUrl, {
      method: req.method,
      headers,
      body,
    });

    const text = await maxunRes.text();
    return new Response(text, {
      status: maxunRes.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
