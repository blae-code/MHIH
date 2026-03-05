import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  Bell, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle,
  PauseCircle, PlayCircle, Edit2, X, Zap
} from "lucide-react";
import { listAllHealthMetrics } from "@/lib/healthMetrics";

const CONDITIONS = [
  { value: "above", label: "Value is above threshold" },
  { value: "below", label: "Value is below threshold" },
  { value: "change_pct", label: "Change exceeds % threshold" },
];
const SEVERITIES = ["critical", "high", "medium", "low"];
const SEV_COLORS = { critical: "#f85149", high: "#d29922", medium: "#e6a817", low: "#58a6ff" };
const CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];

function AlertModal({ alert, onSave, onClose }) {
  const [form, setForm] = useState(alert || {
    name: "", description: "", metric_category: "chronic_disease", region: "",
    condition: "above", threshold: 0, severity: "medium", notify_email: "", status: "active"
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{alert ? "Edit Alert" : "New Alert"}</h3>
          <button onClick={onClose}><X size={14} style={{ color: "var(--text-muted)" }} /></button>
        </div>
        <div className="space-y-3">
          <Field label="Alert Name">
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. High Diabetes Rate Alert"
              className="w-full text-xs px-3 py-2 rounded-md outline-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Metric Category">
              <select value={form.metric_category} onChange={e => set("metric_category", e.target.value)}
                className="w-full text-xs px-2 py-2 rounded outline-none"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
              </select>
            </Field>
            <Field label="Region">
              <input value={form.region} onChange={e => set("region", e.target.value)} placeholder="e.g. BC, Fraser..."
                className="w-full text-xs px-3 py-2 rounded-md outline-none"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Condition">
              <select value={form.condition} onChange={e => set("condition", e.target.value)}
                className="w-full text-xs px-2 py-2 rounded outline-none"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Threshold">
              <input type="number" value={form.threshold} onChange={e => set("threshold", Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-md outline-none"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Severity">
              <select value={form.severity} onChange={e => set("severity", e.target.value)}
                className="w-full text-xs px-2 py-2 rounded outline-none"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: SEV_COLORS[form.severity] }}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Notify Email">
              <input value={form.notify_email} onChange={e => set("notify_email", e.target.value)} placeholder="Optional"
                className="w-full text-xs px-3 py-2 rounded-md outline-none"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
            </Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-3 py-1.5 rounded-md text-xs"
            style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name.trim()}
            className="px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50"
            style={{ background: "var(--accent-primary)", color: "#000" }}>Save Alert</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

export default function Alerts() {
  const { addLog, user } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [checking, setChecking] = useState(false);

  const load = () => {
    base44.entities.Alert.list("-created_date", 100)
      .then(data => { setAlerts(data); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    if (editing) {
      await base44.entities.Alert.update(editing.id, { ...form, created_by_name: user?.full_name });
    } else {
      await base44.entities.Alert.create({ ...form, created_by_name: user?.full_name });
    }
    addLog("success", editing ? "Alert updated" : "Alert created");
    setShowModal(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Alert.delete(id);
    addLog("success", "Alert deleted");
    load();
  };

  const handleToggle = async (alert) => {
    const newStatus = alert.status === "active" ? "paused" : "active";
    await base44.entities.Alert.update(alert.id, { status: newStatus });
    load();
  };

  const handleCheckNow = async () => {
    setChecking(true);
    addLog("info", "Checking all alerts against current data...");
    const metrics = await listAllHealthMetrics({ forceRefresh: true });
    let triggered = 0;
    for (const alert of alerts.filter(a => a.status === "active")) {
      const relevant = metrics.filter(m =>
        (!alert.metric_category || m.category === alert.metric_category) &&
        (!alert.region || m.region === alert.region) &&
        m.value != null
      );
      if (!relevant.length) continue;
      const avg = relevant.reduce((s, m) => s + m.value, 0) / relevant.length;
      let fired = false;
      if (alert.condition === "above" && avg > alert.threshold) fired = true;
      if (alert.condition === "below" && avg < alert.threshold) fired = true;
      if (fired) {
        await base44.entities.Alert.update(alert.id, { status: "triggered", last_triggered: new Date().toISOString(), trigger_count: (alert.trigger_count || 0) + 1 });
        triggered++;
      }
    }
    addLog(triggered > 0 ? "warning" : "success", `Alert check complete — ${triggered} triggered`);
    setChecking(false);
    load();
  };

  const active = alerts.filter(a => a.status === "active").length;
  const triggered = alerts.filter(a => a.status === "triggered").length;

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Real-time Alerts</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {active} active · {triggered} triggered · {alerts.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCheckNow} disabled={checking}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            {checking ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
            Check Now
          </button>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            <Plus size={12} /> New Alert
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Alerts", value: active, color: "var(--color-success)", icon: CheckCircle },
          { label: "Triggered", value: triggered, color: "var(--color-error)", icon: AlertTriangle },
          { label: "Paused", value: alerts.filter(a => a.status === "paused").length, color: "var(--text-muted)", icon: PauseCircle },
        ].map(c => (
          <div key={c.label} className="metric-card flex items-center gap-3">
            <c.icon size={20} style={{ color: c.color }} />
            <div>
              <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="flex items-center justify-center h-24 gap-2" style={{ color: "var(--text-muted)" }}>
          <RefreshCw size={14} className="animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16" style={{ color: "var(--text-muted)" }}>
          <Bell size={32} className="mb-3 opacity-20" />
          <p className="text-sm">No alerts configured. Create one to monitor your health metrics.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                background: "var(--bg-elevated)", border: `1px solid ${alert.status === "triggered" ? SEV_COLORS[alert.severity] : "var(--border-subtle)"}`,
                opacity: alert.status === "paused" ? 0.6 : 1
              }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: SEV_COLORS[alert.severity] || "var(--text-muted)" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{alert.name}</span>
                  <span className="tag" style={{ fontSize: 9, color: SEV_COLORS[alert.severity], borderColor: SEV_COLORS[alert.severity] }}>{alert.severity}</span>
                  {alert.status === "triggered" && (
                    <span className="tag" style={{ fontSize: 9, color: "#f85149", borderColor: "#f85149", background: "rgba(248,81,73,0.1)" }}>TRIGGERED</span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {alert.metric_category?.replace(/_/g," ")} {alert.region ? `· ${alert.region}` : ""} · value {alert.condition?.replace(/_/g," ")} {alert.threshold}
                  {alert.last_triggered && ` · last triggered ${new Date(alert.last_triggered).toLocaleDateString("en-CA")}`}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleToggle(alert)} className="activity-icon" style={{ width: 26, height: 26 }}>
                  {alert.status === "active" || alert.status === "triggered"
                    ? <PauseCircle size={13} style={{ color: "var(--text-muted)" }} />
                    : <PlayCircle size={13} style={{ color: "var(--color-success)" }} />}
                </button>
                <button onClick={() => { setEditing(alert); setShowModal(true); }} className="activity-icon" style={{ width: 26, height: 26 }}>
                  <Edit2 size={11} />
                </button>
                <button onClick={() => handleDelete(alert.id)} className="activity-icon" style={{ width: 26, height: 26, color: "var(--color-error)" }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AlertModal alert={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />
      )}
    </div>
  );
}
