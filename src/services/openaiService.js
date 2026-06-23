import { createActivityLog } from "./activityService";

export async function runAgent(agent, prompt) {
  const output = `OpenAI execution is disabled in the public WordPress build.

Agent: ${agent.name}

Prompt received:
${prompt}

Next step:
Move OpenAI calls to a secure backend endpoint, Supabase Edge Function, or WordPress REST API proxy.`;

  await createActivityLog({
    action: "agent_run_disabled_public",
    entity_type: "agent",
    entity_id: agent.id,
    metadata: {
      agent_name: agent.name,
      prompt,
      response: output
    }
  });

  return { output };
}
