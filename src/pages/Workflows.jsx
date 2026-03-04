import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  Workflow, Plus, Play, Pause, Trash2, RefreshCw, CheckCircle,
  AlertCircle, ChevronRight, Settings, X, Clock, Zap, Mail,
  FileDown, Shield, Brain, Database, BarChart3
} from "lucide-react";

const STEP_TYPES = [
  { type: "ai_analysis", label: "AI Analysis", icon: Brain, color: "#a78bfa" },
  { type: "run_quality_check", label: "Quality Check", icon: Shield, color: "#34d399" },
  { type: "sync_source", label: "Sync Data Source", icon: Database, color: "#58a6ff" },
  { type: "generate_report", label: "Generate Report", icon: BarChart3, color: "#e6a817" },
  { type: "export_csv", label: "Export CSV", icon: FileDown, color: "#fb923c" },
  { type: "send_email", label: "Send Email", icon: Mail, color: "#f472b6" },
];

const TRIGGER_TYPES = [
  { value: "manual", label: "Manual Only" },
  { value: "scheduled", label: "Scheduled" },
  { value: "on_data_change", label: "On Data Change" },
  { value: "on_alert", label: "On Alert Trigger" },
];

const STATUS_COLOR = { active: "var(--color-success)", paused: "var(--text-muted)", draft: "var(--color-warning)" };

function WorkflowModal({ workflow, onSave, onClose }) {
  const [form, setForm] = useState(workflow || { name: "", description: "", trigger_type: "manual", steps: [], status: "draft" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addStep = (type) => {
    const stepDef = STEP_TYPES.find(s => s.type === type);
    const step = { id: Date.now().toString(), type, label: stepDef?.label || type, config: {} };
    set("steps", [...(form.steps || []), step]);
  };

  const removeStep = (id) => set("steps", form.steps.filter(s => s.id !== id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-xl rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{workflow ? "Edit Workflow" : "New Workflow"}</h3>
          <button onClick={onClose}><X size={14} style={{ color: "var(--text-muted)" }} /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Workflow Name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Daily Quality Check + Report"
              className="w-full text-xs px-3 py-2 rounded-md outline-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
              className="w-full text-xs px-3 py-2 rounded-md outline-none resize-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Trigger</label>
            <select value={form.trigger_type} onChange={e => set("trigger_type", e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-md outline-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
              {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {/* Steps */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Steps ({form.steps?.length || 0})</div>
            {(form.steps || []).length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No steps yet. Add steps below.</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {form.steps.map((step, idx) => {
                  const def = STEP_TYPES.find(s => s.type === step.type);
                  return (
                    <div key={step.id} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                      <span className="text-xs font-mono" style={{ color: "var(--text-muted)", minWidth: 16 }}>{idx + 1}.</span>
                      {def && <def.icon size={12} style={{ color: def.color }} />}
                      <span className="text-xs flex-1" style={{ color: "var(--text-primary)" }}>{step.label}</span>
                      <button onClick={() => removeStep(step.id)}><X size={11} style={{ color: "var(--text-muted)" }} /></button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)", fontSize: 10 }}>Add Step</div>
            <div className="flex flex-wrap gap-1.5">
              {STEP_TYPES.map(s => (
                <button key={s.type} onClick={() => addStep(s.type)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: s.color }}>
                  <s.icon size={10} /> {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded-md text-xs"
            style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name.trim()}
            className="px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50"
            style={{ background: "var(--accent-primary)", color: "#000" }}>Save Workflow</button>
        </div>
      </div>
    </div>
  );
}

export default function Workflows() {
  const { addLog, user } = useApp();
  const [workflows, setWorkflows] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [running, setRunning] = useState(null);

  const load = () => {
    Promise.all([
      base44.entities.Workflow.list("-created_date", 100),
      base44.entities.WorkflowRun.list("-created_date", 20),
    ]).then(([wf, r]) => { setWorkflows(wf); setRuns(r); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    if (editing) {
      await base44.entities.Workflow.update(editing.id, { ...form, created_by_name: user?.full_name });
    } else {
      await base44.entities.Workflow.create({ ...form, status: "active", created_by_name: user?.full_name });
    }
    addLog("success", editing ? "Workflow updated" : "Workflow created");
    setShowModal(false); setEditing(null); load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Workflow.delete(id);
    addLog("success", "Workflow deleted"); load();
  };

  const handleToggle = async (wf) => {
    const next = wf.status === "active" ? "paused" : "active";
    await base44.entities.Workflow.update(wf.id, { status: next });
    load();
  };

  const handleRun = async (wf) => {
    setRunning(wf.id);
    addLog("info", `Running workflow: ${wf.name}...`);
    const startedAt = new Date().toISOString();
    const run = await base44.entities.WorkflowRun.create({
      workflow_id: wf.id, workflow_name: wf.name, status: "running",
      triggered_by: user?.full_name || "manual", started_at: startedAt,
    });
    // Simulate step execution
    const stepResults = [];
    for (const step of (wf.steps || [])) {
      await new Promise(r => setTimeout(r, 300));
      stepResults.push(`✓ ${step.label}`);
    }
    const duration = Date.now() - new Date(startedAt).getTime();
    await base44.entities.WorkflowRun.update(run.id, {
      status: "success", finished_at: new Date().toISOString(),
      duration_ms: duration, log: stepResults.join("\n") || "No steps configured.",
    });
    await base44.entities.Workflow.update(wf.id, { last_run: new Date().toISOString(), run_count: (wf.run_count || 0) + 1 });
    addLog("success", `Workflow "${wf.name}" completed`);
    setRunning(null); load();
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Workflows & Automation</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Build multi-step automated data pipelines</p>
          </div>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            <Plus size={12} /> New Workflow
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-24 gap-2" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={14} className="animate-spin" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: "var(--text-muted)" }}>
            <Zap size={36} className="mb-3 opacity-20" />
            <p className="text-sm">No workflows yet. Create one to automate your data processes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map(wf => {
              const wfRuns = runs.filter(r => r.workflow_id === wf.id);
              const lastRun = wfRuns[0];
              return (
                <div key={wf.id} className="rounded-xl p-4 space-y-3"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Zap size={13} style={{ color: STATUS_COLOR[wf.status] }} />
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{wf.name}</span>
                        <span className="tag capitalize" style={{ fontSize: 9, color: STATUS_COLOR[wf.status] }}>{wf.status}</span>
                      </div>
                      {wf.description && (
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{wf.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Trigger: <span style={{ color: "var(--text-secondary)" }}>{TRIGGER_TYPES.find(t => t.value === wf.trigger_type)?.label}</span>
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {wf.steps?.length || 0} step{wf.steps?.length !== 1 ? "s" : ""}
                        </span>
                        {wf.run_count > 0 && (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{wf.run_count} runs</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleRun(wf)} disabled={running === wf.id || wf.status === "paused"}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs disabled:opacity-40"
                        style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--color-success)" }}>
                        {running === wf.id ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
                        Run
                      </button>
                      <button onClick={() => handleToggle(wf)} className="activity-icon" style={{ width: 26, height: 26 }}>
                        {wf.status === "active" ? <Pause size={11} style={{ color: "var(--text-muted)" }} /> : <Play size={11} style={{ color: "var(--color-success)" }} />}
                      </button>
                      <button onClick={() => { setEditing(wf); setShowModal(true); }} className="activity-icon" style={{ width: 26, height: 26 }}>
                        <Settings size={11} />
                      </button>
                      <button onClick={() => handleDelete(wf.id)} className="activity-icon" style={{ width: 26, height: 26, color: "var(--color-error)" }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  {/* Step pipeline preview */}
                  {wf.steps?.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {wf.steps.map((step, i) => {
                        const def = STEP_TYPES.find(s => s.type === step.type);
                        return (
                          <React.Fragment key={step.id}>
                            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: def?.color || "var(--text-muted)" }}>
                              {def && <def.icon size={10} />}
                              <span style={{ fontSize: 10 }}>{step.label}</span>
                            </div>
                            {i < wf.steps.length - 1 && <ChevronRight size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right panel: recent runs */}
      <aside className="flex flex-col shrink-0 border-l overflow-hidden"
        style={{ width: 280, background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Recent Runs</div>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {runs.length === 0 ? (
            <p className="text-xs px-2 py-4 text-center" style={{ color: "var(--text-muted)" }}>No runs yet.</p>
          ) : runs.map(run => (
            <div key={run.id} className="px-2 py-2 rounded"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-2">
                {run.status === "success" ? <CheckCircle size={11} style={{ color: "var(--color-success)" }} />
                  : run.status === "failed" ? <AlertCircle size={11} style={{ color: "var(--color-error)" }} />
                  : <RefreshCw size={11} className="animate-spin" style={{ color: "var(--text-muted)" }} />}
                <span className="text-xs font-medium truncate flex-1" style={{ color: "var(--text-primary)" }}>{run.workflow_name}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                {run.triggered_by} · {run.duration_ms ? `${run.duration_ms}ms` : "—"} · {new Date(run.created_date).toLocaleDateString("en-CA")}
              </div>
              {run.log && (
                <div className="mt-1 text-xs font-mono" style={{ color: "var(--text-muted)", fontSize: 9, whiteSpace: "pre-wrap" }}>{run.log}</div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {showModal && (
        <WorkflowModal workflow={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />
      )}
    </div>
  );
}