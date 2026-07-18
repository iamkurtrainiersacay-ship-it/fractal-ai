import { getAgents } from "../../../services/agentService";
import { runAgent } from "../../../services/openaiService";
import { createWorkflowRun } from "./workflowRunService";
import { getWorkflowSteps } from "./workflowStepService";
import { runRobot, listRuns } from "../../../services/maxunService";

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
You are executing a Nexus workflow.

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
      // Maxun scrape step — robot ID stored as "maxun:{robotId}"
      if (step.agent_id?.startsWith("maxun:")) {
        const robotId = step.agent_id.replace("maxun:", "");
        try {
          await runRobot(robotId);
          await new Promise((r) => setTimeout(r, 4000));
          const runsData = await listRuns(robotId);
          const runs = Array.isArray(runsData) ? runsData : (runsData?.runs || runsData?.data || []);
          const latest = runs[0];
          const scraped = latest
            ? (typeof (latest.capturedData || latest.data || latest.result) === "string"
              ? (latest.capturedData || latest.data || latest.result)
              : JSON.stringify(latest.capturedData || latest.data || latest.result, null, 2))
            : "No scraped data returned.";
          const stepOutput = `[Maxun Scrape — Step ${step.step_order}: ${step.name}]\n${scraped}`;
          fullOutput += `\n==============================\nSTEP ${step.step_order}: ${step.name}\nTYPE: Maxun Scrape\n==============================\n\n${stepOutput}\n\n`;
          context = scraped;
        } catch {
          context = `[Maxun step failed — ${step.name}]`;
        }
        continue;
      }

      const agent =
        agents.find((item) => item.id === step.agent_id) || agents[0];

      const stepPrompt = `
You are executing one step in a multi-agent Nexus workflow.

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
