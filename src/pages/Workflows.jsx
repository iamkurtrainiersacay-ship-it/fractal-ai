import { useEffect, useState } from "react";
import {
  getWorkflows,
  createWorkflow,
  deleteWorkflow
} from "../services/workflowService";

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    trigger: "",
    steps: ""
  });

  async function loadWorkflows() {
    const data = await getWorkflows();
    setWorkflows(data || []);
  }

  async function addWorkflow() {
    if (!form.name) return alert("Workflow name is required.");

    await createWorkflow({
      name: form.name,
      description: form.description,
      trigger: form.trigger,
      status: "Draft",
      steps: form.steps
        .split(",")
        .map((step) => step.trim())
        .filter(Boolean)
    });

    setForm({
      name: "",
      description: "",
      trigger: "",
      steps: ""
    });

    loadWorkflows();
  }

  async function removeWorkflow(id) {
    await deleteWorkflow(id);
    loadWorkflows();
  }

  function runWorkflow(workflow) {
    alert(`Running workflow: ${workflow.name}`);
  }

  useEffect(() => {
    loadWorkflows();
  }, []);

  return (
    <div className="page">
      <h1>Workflows</h1>
      <p className="muted">
        Build automation flows using triggers, agents, decisions, and actions.
      </p>

      <div className="panel">
        <h3>Create Workflow</h3>

        <div className="form-grid">
          <input
            placeholder="Workflow name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <input
            placeholder="Trigger e.g. New lead submitted"
            value={form.trigger}
            onChange={(e) => setForm({ ...form, trigger: e.target.value })}
          />

          <input
            placeholder="Steps: Capture Lead, Research, Qualify, Notify"
            value={form.steps}
            onChange={(e) => setForm({ ...form, steps: e.target.value })}
          />

          <button className="primary-btn" onClick={addWorkflow}>
            Create Workflow
          </button>
        </div>
      </div>

      <div className="card-grid">
        {workflows.map((workflow) => (
          <div className="panel" key={workflow.id}>
            <h3>{workflow.name}</h3>
            <p>{workflow.description}</p>
            <p><strong>Trigger:</strong> {workflow.trigger || "None"}</p>
            <p><strong>Status:</strong> {workflow.status}</p>
            <p><strong>Steps:</strong> {(workflow.steps || []).join(" -> ") || "None"}</p>

            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button className="primary-btn" onClick={() => runWorkflow(workflow)}>
                Run Workflow
              </button>

              <button className="danger-btn" onClick={() => removeWorkflow(workflow.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
