import { useEffect, useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { SkeletonPage } from "../../../shared/components/Skeleton";
import toast from "react-hot-toast";
import {
  Plus, Trash2, Play, ChevronDown, ChevronRight,
  Copy, Workflow as WorkflowIcon, Bot
} from "lucide-react";
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
  deleteWorkflowStep,
  updateWorkflowStep
} from "../services/workflowStepService";

// ─── Step card (draggable) ─────────────────────────────────────────────────────

function StepCard({ step, agents, onRemove, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const agentName = agents.find(a => a.id === step.agent_id)?.name || "No agent";

  return (
    <Reorder.Item
      value={step}
      dragListener={false}
      dragControls={undefined}
    >
      <motion.div
        className="wf-step-card"
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="wf-step-header" onClick={() => setExpanded(!expanded)}>
          <div className="wf-step-left">
            <span className="wf-step-num">{step.step_order}</span>
            <div>
              <strong className="wf-step-name">{step.name || "Unnamed step"}</strong>
              <span className="wf-step-agent"><Bot size={11} /> {agentName}</span>
            </div>
          </div>
          <div className="wf-step-right">
            <button
              className="wf-step-del"
              onClick={(e) => { e.stopPropagation(); onRemove(step.id); }}
            >
              <Trash2 size={13} />
            </button>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              className="wf-step-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="wf-step-field">
                <label>Agent</label>
                <select
                  value={step.agent_id || ""}
                  onChange={(e) => onUpdate(step.id, "agent_id", e.target.value)}
                >
                  <option value="">Select agent</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="wf-step-field">
                <label>Step Name</label>
                <input
                  value={step.name || ""}
                  onChange={(e) => onUpdate(step.id, "name", e.target.value)}
                  placeholder="e.g. Research Prospect"
                />
              </div>
              <div className="wf-step-field">
                <label>Instruction</label>
                <textarea
                  value={step.instruction || ""}
                  onChange={(e) => onUpdate(step.id, "instruction", e.target.value)}
                  placeholder="What should this agent do with the workflow input?"
                  rows={3}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Reorder.Item>
  );
}

// ─── Workflow card ────────────────────────────────────────────────────────────

function WorkflowCard({
  workflow, steps, agents,
  onDelete, onRun, onAddStep, onRemoveStep, onUpdateStep,
  running, workflowInput, onInputChange
}) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [newStep, setNewStep] = useState({ name: "", agent_id: "", instruction: "" });
  const [addingStep, setAddingStep] = useState(false);

  async function handleAddStep() {
    if (!newStep.name || !newStep.agent_id || !newStep.instruction) {
      toast.error("Step name, agent, and instruction are required.");
      return;
    }
    setAddingStep(true);
    try {
      await onAddStep(workflow.id, {
        ...newStep,
        step_order: steps.length + 1
      });
      setNewStep({ name: "", agent_id: "", instruction: "" });
    } finally {
      setAddingStep(false);
    }
  }

  return (
    <div className="panel wf-card">
      <div className="wf-card-header">
        <div className="wf-card-title-row">
          <div className="wf-card-icon"><WorkflowIcon size={18} /></div>
          <div>
            <h3>{workflow.name}</h3>
            {workflow.description && <p className="muted">{workflow.description}</p>}
          </div>
        </div>
        <div className="wf-card-actions">
          <span className="mp-skill">{steps.length} steps</span>
          <button
            className="secondary-btn"
            onClick={() => setShowBuilder(!showBuilder)}
          >
            {showBuilder ? "Hide Builder" : "Edit Steps"}
          </button>
          <button
            className="danger-btn"
            onClick={() => onDelete(workflow.id)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showBuilder && (
          <motion.div
            className="wf-builder"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="wf-builder-inner">
              <h4 className="wf-builder-title">Workflow Steps</h4>

              {steps.length === 0 ? (
                <div className="wf-empty-steps">
                  <p className="muted">No steps yet. Add your first step below.</p>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={steps}
                  onReorder={() => {}}
                  className="wf-steps-list"
                >
                  <AnimatePresence>
                    {steps
                      .slice()
                      .sort((a, b) => a.step_order - b.step_order)
                      .map(step => (
                        <StepCard
                          key={step.id}
                          step={step}
                          agents={agents}
                          onRemove={onRemoveStep}
                          onUpdate={onUpdateStep}
                        />
                      ))}
                  </AnimatePresence>
                </Reorder.Group>
              )}

              {/* Add step form */}
              <div className="wf-add-step">
                <h5>Add Step</h5>
                <div className="wf-add-step-grid">
                  <input
                    placeholder="Step name *"
                    value={newStep.name}
                    onChange={(e) => setNewStep(s => ({ ...s, name: e.target.value }))}
                  />
                  <select
                    value={newStep.agent_id}
                    onChange={(e) => setNewStep(s => ({ ...s, agent_id: e.target.value }))}
                  >
                    <option value="">Select agent *</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <textarea
                  placeholder="What should this agent do? *"
                  value={newStep.instruction}
                  onChange={(e) => setNewStep(s => ({ ...s, instruction: e.target.value }))}
                  rows={2}
                  style={{ width: "100%", marginTop: "8px" }}
                />
                <motion.button
                  className="primary-btn"
                  style={{ marginTop: "10px" }}
                  onClick={handleAddStep}
                  disabled={addingStep}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus size={14} /> {addingStep ? "Adding..." : "Add Step"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run zone */}
      <div className="wf-run-zone">
        <textarea
          className="wf-run-input"
          placeholder="Workflow input — e.g. John owns a dental clinic in Austin and wants more booked appointments."
          value={workflowInput}
          onChange={(e) => onInputChange(e.target.value)}
          rows={2}
        />
        <motion.button
          className="primary-btn"
          onClick={() => onRun(workflow)}
          disabled={running === workflow.id || !workflowInput?.trim() || steps.length === 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {running === workflow.id ? (
            <><span className="wf-spinner" /> Running...</>
          ) : (
            <><Play size={14} /> Run Workflow</>
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [workflowRuns, setWorkflowRuns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stepsByWorkflow, setStepsByWorkflow] = useState({});
  const [running, setRunning] = useState(null);
  const [workflowInputs, setWorkflowInputs] = useState({});
  const [activeOutput, setActiveOutput] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRuns, setShowRuns] = useState(false);

  const [form, setForm] = useState({ name: "", description: "", trigger: "" });

  async function loadData() {
    try {
      const [workflowData, runData, agentData] = await Promise.all([
        getWorkflows(), getWorkflowRuns(), getAgents()
      ]);
      setWorkflows(workflowData || []);
      setWorkflowRuns(runData || []);
      setAgents(agentData || []);

      const stepMap = {};
      await Promise.all(
        (workflowData || []).map(async (wf) => {
          stepMap[wf.id] = await getWorkflowSteps(wf.id);
        })
      );
      setStepsByWorkflow(stepMap);
    } finally {
      setLoading(false);
    }
  }

  async function addWorkflow() {
    if (!form.name) { toast.error("Workflow name required."); return; }
    try {
      await createWorkflow({
        name: form.name,
        description: form.description,
        trigger: form.trigger,
        status: "Draft",
        steps: []
      });
      setForm({ name: "", description: "", trigger: "" });
      setShowCreateForm(false);
      toast.success("Workflow created.");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to create workflow.");
    }
  }

  async function removeWorkflow(id) {
    if (!window.confirm("Delete this workflow?")) return;
    await deleteWorkflow(id);
    toast.success("Workflow deleted.");
    loadData();
  }

  async function addStep(workflowId, stepData) {
    await createWorkflowStep({ workflow_id: workflowId, ...stepData });
    toast.success("Step added.");
    loadData();
  }

  async function removeStep(id) {
    await deleteWorkflowStep(id);
    loadData();
  }

  async function updateStepField(stepId, field, value) {
    // Optimistic update locally
    setStepsByWorkflow(prev => {
      const next = { ...prev };
      for (const wfId in next) {
        next[wfId] = next[wfId].map(s =>
          s.id === stepId ? { ...s, [field]: value } : s
        );
      }
      return next;
    });
    // Persist to DB (debounced via blur is fine, here we call on every change)
    try {
      await updateWorkflowStep(stepId, { [field]: value });
    } catch {
      // Silently ignore — data is in local state
    }
  }

  async function runWorkflow(workflow) {
    const input = workflowInputs[workflow.id];
    if (!input?.trim()) { toast.error("Enter workflow input first."); return; }
    try {
      setRunning(workflow.id);
      setActiveOutput("Running workflow...");
      const result = await executeWorkflow(workflow, input);
      setActiveOutput(result);
      await loadData();
      toast.success("Workflow completed.");
    } catch (error) {
      console.error(error);
      setActiveOutput("Workflow failed. Check console.");
      toast.error("Workflow execution failed.");
    } finally {
      setRunning(null);
    }
  }

  useEffect(() => { loadData(); }, []);

  if (loading) return <SkeletonPage rows={6} />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Workflows</h1>
          <p className="muted">Build and execute AI-powered multi-agent pipelines.</p>
        </div>
        <motion.button
          className="primary-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={16} /> New Workflow
        </motion.button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            className="panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ marginBottom: "20px" }}
          >
            <h3 style={{ marginBottom: "14px" }}>Create Workflow</h3>
            <div className="form-grid">
              <input
                placeholder="Workflow name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <input
                placeholder="Trigger (e.g. New lead, Manual)"
                value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <motion.button
                className="primary-btn"
                onClick={addWorkflow}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Create
              </motion.button>
              <button className="secondary-btn" onClick={() => setShowCreateForm(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workflow cards */}
      {workflows.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "48px" }}>
          <WorkflowIcon size={32} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
          <p className="muted">No workflows yet. Create your first pipeline.</p>
          <button className="primary-btn" style={{ marginTop: "12px" }} onClick={() => setShowCreateForm(true)}>
            <Plus size={14} /> Create Workflow
          </button>
        </div>
      ) : (
        <div className="wf-cards">
          <AnimatePresence>
            {workflows.map(wf => (
              <WorkflowCard
                key={wf.id}
                workflow={wf}
                steps={stepsByWorkflow[wf.id] || []}
                agents={agents}
                onDelete={removeWorkflow}
                onRun={runWorkflow}
                onAddStep={addStep}
                onRemoveStep={removeStep}
                onUpdateStep={updateStepField}
                running={running}
                workflowInput={workflowInputs[wf.id] || ""}
                onInputChange={(val) => setWorkflowInputs(p => ({ ...p, [wf.id]: val }))}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Output panel */}
      {activeOutput && (
        <div className="panel workflow-output-panel" style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3>Workflow Output</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="secondary-btn"
                onClick={() => navigator.clipboard.writeText(activeOutput).then(() => toast.success("Copied."))}
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                <Copy size={12} /> Copy
              </button>
              <button className="secondary-btn" onClick={() => setActiveOutput("")} style={{ fontSize: "12px", padding: "6px 10px" }}>
                ✕
              </button>
            </div>
          </div>
          <pre className="workflow-output">{activeOutput}</pre>
        </div>
      )}

      {/* Recent runs */}
      {workflowRuns.length > 0 && (
        <div className="panel" style={{ marginTop: "20px" }}>
          <button
            className="wf-runs-toggle"
            onClick={() => setShowRuns(!showRuns)}
          >
            <strong>Recent Runs ({workflowRuns.length})</strong>
            {showRuns ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          <AnimatePresence>
            {showRuns && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                {workflowRuns.map(run => (
                  <div className="list-card" key={run.id}>
                    <strong>{run.workflow_name}</strong>
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <span className="mp-skill">{run.status}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {new Date(run.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
                      {run.output?.substring(0, 200)}
                      {run.output?.length > 200 ? "…" : ""}
                    </p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button className="secondary-btn" onClick={() => setActiveOutput(run.output || "")}
                        style={{ fontSize: "12px", padding: "6px 12px" }}>
                        View Full
                      </button>
                      <button className="danger-btn" onClick={() => deleteWorkflowRun(run.id).then(loadData)}
                        style={{ fontSize: "12px", padding: "6px 10px" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
