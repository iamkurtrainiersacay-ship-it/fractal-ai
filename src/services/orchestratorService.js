import { supabase } from "../core/database/supabase";
import { getToolDefinitions, getTool } from "./toolRegistry";
import { createActivityLog } from "./activityService";

const ORCHESTRATOR_PROMPT = `You are Nexus Prime — an AI Operating System orchestrator. Users give you natural language commands and you decide which platform tools to call to fulfill them.

You have access to these tools:
{TOOLS}

RESPONSE FORMAT:
You must respond with valid JSON only. No markdown, no explanation outside JSON.

If the user's request requires tool calls, respond with:
{
  "plan": "Brief description of what you'll do",
  "steps": [
    { "tool": "tool_name", "params": { "param1": "value1" }, "reason": "why this step" }
  ]
}

If the user's request is a question you can answer without tools (like "what can you do?"), respond with:
{
  "plan": "Direct answer",
  "steps": [],
  "answer": "Your response here"
}

Rules:
- Always use the minimum number of tool calls needed
- Chain tools logically — e.g. search knowledge before running an agent so it has context
- For content campaigns: create_content_asset triggers AI generation automatically
- For agent tasks: use run_agent with a clear prompt
- You can call multiple tools in sequence
- If unsure which agent to use, call list_agents first
- Be specific with prompts you pass to agents`;

function buildSystemPrompt() {
  const tools = getToolDefinitions();
  const toolText = tools.map(t => {
    const params = Object.keys(t.parameters).length > 0
      ? `Parameters: ${JSON.stringify(t.parameters)}`
      : "No parameters";
    return `- ${t.name}: ${t.description}\n  ${params}`;
  }).join("\n");

  return ORCHESTRATOR_PROMPT.replace("{TOOLS}", toolText);
}

function parseResponse(text) {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function orchestrate(userPrompt, onStep) {
  const systemPrompt = buildSystemPrompt();

  onStep?.({ type: "thinking", message: "Analyzing your request..." });

  const { data, error } = await supabase.functions.invoke("run-agent", {
    body: {
      agent: {
        name: "Nexus Orchestrator",
        system_prompt: systemPrompt,
        model: "gpt-4.1-mini"
      },
      prompt: userPrompt,
      knowledge: "",
      history: "",
      memory: ""
    }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  const output = data?.output || "";
  const plan = parseResponse(output);

  if (!plan) {
    return {
      plan: "I understood your request but couldn't structure a plan.",
      steps: [],
      results: [],
      answer: output
    };
  }

  if (plan.answer && (!plan.steps || plan.steps.length === 0)) {
    return {
      plan: plan.plan || "Direct response",
      steps: [],
      results: [],
      answer: plan.answer
    };
  }

  onStep?.({ type: "plan", message: plan.plan, stepCount: plan.steps?.length || 0 });

  const results = [];

  for (let i = 0; i < (plan.steps || []).length; i++) {
    const step = plan.steps[i];
    const tool = getTool(step.tool);

    onStep?.({
      type: "executing",
      index: i,
      total: plan.steps.length,
      tool: step.tool,
      reason: step.reason
    });

    if (!tool) {
      results.push({
        tool: step.tool,
        reason: step.reason,
        status: "error",
        result: { error: `Unknown tool: ${step.tool}` }
      });
      continue;
    }

    try {
      const result = await tool.execute(step.params || {});
      results.push({
        tool: step.tool,
        reason: step.reason,
        status: "success",
        result
      });

      onStep?.({
        type: "completed",
        index: i,
        total: plan.steps.length,
        tool: step.tool,
        result
      });
    } catch (err) {
      results.push({
        tool: step.tool,
        reason: step.reason,
        status: "error",
        result: { error: err.message }
      });

      onStep?.({
        type: "error",
        index: i,
        tool: step.tool,
        error: err.message
      });
    }
  }

  await createActivityLog({
    action: "orchestrator_run",
    entity_type: "command_center",
    metadata: {
      prompt: userPrompt,
      plan: plan.plan,
      steps: plan.steps?.length || 0,
      results_summary: results.map(r => `${r.tool}: ${r.status}`).join(", ")
    }
  });

  return {
    plan: plan.plan,
    steps: plan.steps || [],
    results,
    answer: null
  };
}
