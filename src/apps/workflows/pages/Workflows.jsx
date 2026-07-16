import { useEffect, useState } from "react";
import { SkeletonPage } from "../../../shared/components/Skeleton";
import {
  getWorkflows,
  createWorkflow,
  deleteWorkflow
} from "../services/workflowService";
import { getAgents } from "../../../services/agentService";
import { executeWorkflow } from "../services/workflowEngineService";
import {
  getWorkflowRuns,
  deleteWorkflowRun
} from "../services/workflowRunService";
import {
  getWorkflowSteps,
  createWorkflowStep,
  deleteWorkflowStep
} from "../services/workflowStepService";

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [workflowRuns, setWorkflowRuns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stepsByWorkflow, setStepsByWorkflow] = useState({});
  const [running, setRunning] = useState(null);
  const [workflowInputs, setWorkflowInputs] = useState({});
  const [activeOutput, setActiveOutput] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    trigger: "",
    steps: ""
  });

  const [stepForms, setStepForms] = useState({});

  async function loadData() {
    try {
      const [workflowData, runData, agentData] = await Promise.all([
        getWorkflows(),
        getWorkflowRuns(),
        getAgents()
      ]);

      setWorkflows(workflowData || []);
      setWorkflowRuns(runData || []);
      setAgents(agentData || []);

      const stepMap = {};
      for (const workflow of workflowData || []) {
        stepMap[workflow.id] = await getWorkflowSteps(workflow.id);
      }
      setStepsByWorkflow(stepMap);
    } finally {
      setLoading(false);
    }
  }

  async function addWorkflow() {
    if (!form.name) return alert("Workflow name required");

    await createWorkflow({
      name: form.name,
      description: form.description,
      trigger: form.trigger,
      status: "Draft",
      steps: form.steps.split(",").map((s) => s.trim()).filter(Boolean)
    });

    setForm({ name: "", description: "", trigger: "", steps: "" });
    loadData();
  }

  async function removeWorkflow(id) {
    await deleteWorkflow(id);
    loadData();
  }

  async function removeWorkflowRun(id) {
    await deleteWorkflowRun(id);
    loadData();
  }

  async function copyOutput(output) {
    await navigator.clipboard.writeText(output || "");
    alert("Output copied.");
  }

  function viewFullRun(run) {
    setActiveOutput(run.output || "No output available.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function addStep(workflowId) {
    const current = stepForms[workflowId] || {
      name: "",
      instruction: "",
      agent_id: "",
      step_order: ""
    };

    if (!current.name || !current.instruction || !current.agent_id) {
      alert("Step name, instruction, and agent are required.");
      return;
    }

    await createWorkflowStep({
      workflow_id: workflowId,
      agent_id: current.agent_id,
      step_order: Number(current.step_order || 1),
      name: current.name,
      instruction: current.instruction
    });

    setStepForms({
      ...stepForms,
      [workflowId]: { name: "", instruction: "", agent_id: "", step_order: "" }
    });

    loadData();
  }

  async function removeStep(id) {
    await deleteWorkflowStep(id);
    loadData();
  }

  async function runWorkflow(workflow) {
    const input = workflowInputs[workflow.id];

    if (!input) {
      alert("Enter workflow input first.");
      return;
    }

    try {
      setRunning(workflow.id);
      setActiveOutput("Running workflow...");

      const result = await executeWorkflow(workflow, input);

      setActiveOutput(result);
      await loadData();
    } catch (error) {
      console.error(error);
      setActiveOutput("Workflow failed. Check browser console.");
    } finally {
      setRunning(null);
    }
  }

  function updateStepForm(workflowId, key, value) {
    const current = stepForms[workflowId] || {
      name: "",
      instruction: "",
      agent_id: "",
      step_order: ""
    };

    setStepForms({
      ...stepForms,
      [workflowId]: {
        ...current,
        [key]: value
      }
    });
  }

  function getAgentName(agentId) {
    const agent = agents.find((item) => item.id === agentId);
    return agent ? agent.name : "Unknown agent";
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <SkeletonPage rows={6} />;

  return (
    <div className="page">
      <h1>Workflows</h1>
      <p className="muted">Build, execute, and track AI-powered multi-agent workflows.</p>

      <div className="panel">
        <h3>Create Workflow</h3>

        <div className="form-grid">
          <input placeholder="Workflow Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Trigger" value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} />
          <input placeholder="Fallback steps separated by commas" value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} />
          <button className="primary-btn" onClick={addWorkflow}>Create Workflow</button>
        </div>
      </div>

      <div className="card-grid">
        {workflows.map((workflow) => {
          const currentStepForm = stepForms[workflow.id] || {
            name: "",
            instruction: "",
            agent_id: "",
            step_order: ""
          };

          const workflowSteps = stepsByWorkflow[workflow.id] || [];

          return (
            <div key={workflow.id} className="panel">
              <h3>{workflow.name}</h3>
              <p>{workflow.description}</p>
              <p><strong>Trigger:</strong> {workflow.trigger}</p>
              <p><strong>Fallback Steps:</strong> {(workflow.steps || []).join(" -> ")}</p>

              <div className="panel" style={{ marginTop: "14px" }}>
                <h4>Agent Steps</h4>

                {workflowSteps.length === 0 ? (
                  <p>No assigned agent steps yet.</p>
                ) : (
                  workflowSteps.map((step) => (
                    <div className="list-card" key={step.id}>
                      <strong>Step {step.step_order}: {step.name}</strong>
                      <p><strong>Agent:</strong> {getAgentName(step.agent_id)}</p>
                      <p>{step.instruction}</p>
                      <button className="danger-btn" onClick={() => removeStep(step.id)}>Delete Step</button>
                    </div>
                  ))
                )}

                <div className="form-grid">
                  <input placeholder="Order" value={currentStepForm.step_order} onChange={(e) => updateStepForm(workflow.id, "step_order", e.target.value)} />
                  <input placeholder="Step name" value={currentStepForm.name} onChange={(e) => updateStepForm(workflow.id, "name", e.target.value)} />

                  <select value={currentStepForm.agent_id} onChange={(e) => updateStepForm(workflow.id, "agent_id", e.target.value)}>
                    <option value="">Select agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>

                  <input placeholder="Instruction for this step" value={currentStepForm.instruction} onChange={(e) => updateStepForm(workflow.id, "instruction", e.target.value)} />
                  <button className="primary-btn" onClick={() => addStep(workflow.id)}>Add Step</button>
                </div>
              </div>

              <input
                className="workflow-input"
                placeholder="Workflow input e.g. John owns a dental clinic in Austin and wants more booked appointments."
                value={workflowInputs[workflow.id] || ""}
                onChange={(e) =>
                  setWorkflowInputs({
                    ...workflowInputs,
                    [workflow.id]: e.target.value
                  })
                }
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button className="primary-btn" disabled={running === workflow.id} onClick={() => runWorkflow(workflow)}>
                  {running === workflow.id ? "Running..." : "Run Workflow"}
                </button>

                <button className="danger-btn" onClick={() => removeWorkflow(workflow.id)}>Delete Workflow</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel workflow-output-panel">
        <h3>Workflow Output</h3>
        <pre className="workflow-output">
          {activeOutput || "Run a workflow to see the full output here."}
        </pre>
      </div>

      <div className="panel">
        <h3>Recent Workflow Runs</h3>

        {workflowRuns.length === 0 ? (
          <p>No workflow runs yet.</p>
        ) : (
          workflowRuns.map((run) => (
            <div className="list-card" key={run.id}>
              <strong>{run.workflow_name}</strong>
              <p><strong>Status:</strong> {run.status}</p>
              <p><strong>Input:</strong> {run.input}</p>
              <p><strong>Output:</strong> {run.output?.substring(0, 300)}...</p>
              <small>{new Date(run.created_at).toLocaleString()}</small>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "center" }}>
                <button className="primary-btn" onClick={() => viewFullRun(run)}>
                  View Full Run
                </button>

                <button className="primary-btn" onClick={() => copyOutput(run.output)}>
                  Copy Output
                </button>

                <button className="danger-btn" onClick={() => removeWorkflowRun(run.id)}>
                  Delete Run
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
