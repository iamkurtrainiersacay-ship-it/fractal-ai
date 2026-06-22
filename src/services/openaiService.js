import OpenAI from "openai";
import { getKnowledge } from "./knowledgeService";
import { createActivityLog } from "./activityService";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

function formatKnowledge(items) {
  return (items || [])
    .map(
      (item) => `
Title: ${item.title}
Type: ${item.type}
Content: ${item.content}
Tags: ${(item.tags || []).join(", ")}
`
    )
    .join("\n\n");
}

function estimateCost(model, inputTokens, outputTokens) {
  const rates = {
    "gpt-5.5": { input: 0.00125, output: 0.01 },
    "gpt-5.4": { input: 0.00125, output: 0.01 },
    "gpt-5.4-mini": { input: 0.00015, output: 0.0006 }
  };

  const rate = rates[model] || rates["gpt-5.5"];

  return ((inputTokens / 1000) * rate.input) + ((outputTokens / 1000) * rate.output);
}

export async function runAgent(agent, prompt) {
  const knowledge = await getKnowledge();

  const systemPrompt = `
You are ${agent.name}.

Role:
${agent.role || "AI Assistant"}

Knowledge Base:
${formatKnowledge(knowledge)}

Instructions:
Use the knowledge base whenever relevant.
`;

  const model = "gpt-5.1";

  const response = await client.responses.create({
    model,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ]
  });

  const output = response.output_text || "No response returned.";

  const inputTokens = response.usage?.input_tokens || 0;
  const outputTokens = response.usage?.output_tokens || 0;
  const totalTokens = response.usage?.total_tokens || inputTokens + outputTokens;
  const estimatedCost = estimateCost(model, inputTokens, outputTokens);

  await createActivityLog({
    action: "agent_run",
    entity_type: "agent",
    entity_id: agent.id,
    metadata: {
      agent_name: agent.name,
      model,
      prompt,
      response: output,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      estimated_cost: estimatedCost
    }
  });

  return { output };
}
