/**
 * PolicyForm — create/edit modal for Policy registry entries,
 * including the metric-evidence picker linking to the Data app.
 */

import React, { useState } from "react";
import { X, Save, Database } from "lucide-react";
import { LIFECYCLE_STAGES, STATUS_CONFIG, CATEGORY_OPTIONS } from "./lifecycleStages";

const inputStyle = {
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-default)",
  borderRadius: 6,
  color: "var(--text-primary)",
  fontSize: 12,
  padding: "7px 10px",
  outline: "none",
  width: "100%",
};

function Field({ label, children }) {
  return (
    <label className="block">
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

export default function PolicyForm({ policy, metricNames, onSave, onClose }) {
  const [form, setForm] = useState({
    title: policy?.title ?? "",
    stage: policy?.stage ?? "recherche",
    status: policy?.status ?? "draft",
    priority: policy?.priority ?? "medium",
    portfolio: policy?.portfolio ?? "",
    owner: policy?.owner ?? "",
    category: policy?.category ?? "other",
    tags: (policy?.tags ?? []).join(", "),
    evidence_metric_names: policy?.evidence_metric_names ?? [],
    notes: policy?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [metricSearch, setMetricSearch] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleMetric = (name) => {
    set("evidence_metric_names",
      form.evidence_metric_names.includes(name)
        ? form.evidence_metric_names.filter((m) => m !== name)
        : [...form.evidence_metric_names, name]
    );
  };

  const filteredMetrics = metricNames
    .filter((m) => !metricSearch || m.toLowerCase().includes(metricSearch.toLowerCase()))
    .slice(0, 30);

  const submit = async () => {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    await onSave({
      ...form,
      title: form.title.trim(),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)" }} onClick={onClose}>
      <div className="rounded-2xl w-full max-w-2xl flex flex-col" onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", maxHeight: "88vh" }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="section-label" style={{ color: "#f472b6" }}>Policy Studio</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            {policy ? "Edit Policy" : "New Policy"}
          </span>
          <button onClick={onClose} className="activity-icon ml-auto" style={{ width: 28, height: 28 }}><X size={13} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Title">
            <input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Policy title…" autoFocus />
          </Field>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Lifecycle stage">
              <select style={inputStyle} value={form.stage} onChange={(e) => set("stage", e.target.value)}>
                {LIFECYCLE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select style={inputStyle} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </Field>
            <Field label="Portfolio">
              <input style={inputStyle} value={form.portfolio} onChange={(e) => set("portfolio", e.target.value)} placeholder="e.g. Health Equity" />
            </Field>
            <Field label="Owner">
              <input style={inputStyle} value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Team or person" />
            </Field>
            <Field label="Health category">
              <select style={inputStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Tags (comma-separated)">
            <input style={inputStyle} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="equity, cultural-safety…" />
          </Field>

          {/* Metric evidence picker — Data & Evidence linkage */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Database size={11} style={{ color: "#40c4ff" }} />
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#40c4ff" }}>
                Evidence Metrics · Data &amp; Evidence app
              </span>
              <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{form.evidence_metric_names.length} linked</span>
            </div>
            {form.evidence_metric_names.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.evidence_metric_names.map((m) => (
                  <button key={m} onClick={() => toggleMetric(m)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ fontSize: 10, color: "#40c4ff", background: "rgba(64,196,255,0.1)", border: "1px solid rgba(64,196,255,0.35)" }}
                    title="Remove">
                    {m} <X size={9} />
                  </button>
                ))}
              </div>
            )}
            <input style={inputStyle} value={metricSearch} onChange={(e) => setMetricSearch(e.target.value)} placeholder="Search health metrics to link…" />
            {metricSearch && (
              <div className="mt-1 rounded-lg overflow-y-auto" style={{ maxHeight: 140, background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                {filteredMetrics.length === 0 ? (
                  <div className="px-3 py-2" style={{ fontSize: 10.5, color: "var(--text-muted)" }}>No matching metrics</div>
                ) : filteredMetrics.map((m) => {
                  const linked = form.evidence_metric_names.includes(m);
                  return (
                    <button key={m} onClick={() => toggleMetric(m)}
                      className="w-full text-left px-3 py-1.5 transition-colors"
                      style={{ fontSize: 11, color: linked ? "#40c4ff" : "var(--text-secondary)", background: linked ? "rgba(64,196,255,0.08)" : "transparent" }}>
                      {linked ? "✓ " : ""}{m}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Field label="Notes">
            <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded-md text-xs font-semibold"
            style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={!form.title.trim() || saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold disabled:opacity-50"
            style={{ background: "#FEDD00", color: "#043673" }}>
            <Save size={12} /> {saving ? "Saving…" : policy ? "Save Changes" : "Create Policy"}
          </button>
        </div>
      </div>
    </div>
  );
}