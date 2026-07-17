const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function extractOutputText(data) {
  if (data.output_text) return data.output_text;

  const parts = [];

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.text) parts.push(content.text);
      if (content.value) parts.push(content.value);
    }
  }

  return parts.join("\n").trim() || "No response returned.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { agent, prompt, knowledge, history } = await req.json();

    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is missing.");
    }

    const systemPrompt = `
You are ${agent?.name || "Fractal AI Agent"}.

Role:
${agent?.role || "AI Assistant"}

Operating Style:
- Be direct, practical, and execution-focused.
- Use business and systems thinking.
- Use the knowledge base when relevant.
- Remember prior conversation history when useful.
- Give structured answers when appropriate.
`;

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "system",
            content: `Knowledge Base:\n${knowledge || ""}`
          },
          {
            role: "system",
            content: `Recent Conversation History:\n${history || ""}`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      throw new Error(data.error?.message || "OpenAI request failed.");
    }

    return new Response(
      JSON.stringify({
        output: extractOutputText(data),
        usage: data.usage || null
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
