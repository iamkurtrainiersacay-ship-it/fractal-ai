import { getAgents } from "../../../services/agentService";
import { runAgent } from "../../../services/openaiService";
import { createWorkflowRun } from "./workflowRunService";
import { getWorkflowSteps } from "./workflowStepService";

export async function executeWorkflow(workflow, input) {
  const agents = await getAgents();
  const steps = await getWorkflowSteps(workflow.id);

  if (!agents || agents.length === 0) {
    throw new Error("No agents available to execute workflow.");
  }

  let context = input;
  let fullOutput = "";

  if (!steps || steps.length === 0) {
    const agent = agents[0];

    const fallbackPrompt = `
You are executing a Fractal workflow.

WORKFLOW:
${workflow.name}

DESCRIPTION:
${workflow.description || "No description"}

STEPS:
${(workflow.steps || []).join(" -> ") || "No steps"}

INPUT:
${input}

Execute this workflow step-by-step and return the final operational output.
`;

    const result = await runAgent(agent, fallbackPrompt);
    fullOutput = result.output;
  } else {
    for (const step of steps) {
      const agent =
        agents.find((item) => item.id === step.agent_id) || agents[0];

      const stepPrompt = `
You are executing one step in a multi-agent Fractal workflow.

WORKFLOW:
${workflow.name}

STEP ORDER:
${step.step_order}

STEP NAME:
${step.name}

STEP INSTRUCTION:
${step.instruction}

CURRENT CONTEXT:
${context}

Return the output for this step only.
`;

      const result = await runAgent(agent, stepPrompt);

      fullOutput += `
==============================
STEP ${step.step_order}: ${step.name}
AGENT: ${agent.name}
==============================

${result.output}

`;

      context = result.output;
    }
  }

  await createWorkflowRun({
    workflow_id: workflow.id,
    workflow_name: workflow.name,
    status: "completed",
    input,
    output: fullOutput
  });

  return fullOutput;
}
