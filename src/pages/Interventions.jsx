import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Activity, Plus, RefreshCw, Save, Trash2, TrendingUp } from "lucide-react";
import { listAllHealthMetrics } from "@/lib/healthMetrics";

const CATEGORIES = ["chronic_disease", "mental_health", "substance_use", "maternal_child", "social_determinants", "demographics", "mortality", "access_to_care", "other"];
const STATUSES = ["planned", "active", "paused", "completed", "cancelled"];

export default function Interventions() {
  const { addLog } = useApp();
  const [items, setItems] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "mental_health",
    region: "BC",
    owner: "",
    status: "planned",
    expected_kpi: "",
    expected_impact_pct: 10,
    start_date: "",
    end_date: "",
    notes: "",
  });

  const load = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const [ints, outs, mets] = await Promise.all([
        base44.entities.Intervention.list("-updated_date", 200).catch(() => []),
        base44.entities.InterventionOutcome.list("-created_date", 500).catch(() => []),
        listAllHealthMetrics({ forceRefresh }).catch(() => []),
      ]);
      setItems(ints || []);
      setOutcomes(outs || []);
      setMetrics(mets || []);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedOutcomes = useMemo(() => outcomes.filter(o => o.intervention_id === selected?.id), [outcomes, selected]);

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      if (selected?.id) {
        await base44.entities.Intervention.update(selected.id, form);
        addLog("success", "Intervention updated");
      } else {
        await base44.entities.Intervention.create({ ...form, created_by: "workspace" });
        addLog("success", "Intervention created");
      }
      resetForm();
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
  };

  const remove = async (item) => {
    try {
      await base44.entities.Intervention.delete(item.id);
      addLog("success", `Deleted ${item.name}`);
      if (selected?.id === item.id) resetForm();
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
  };

  const resetForm = () => {
    setSelected(null);
    setForm({
      name: "",
      category: "mental_health",
      region: "BC",
      owner: "",
      status: "planned",
      expected_kpi: "",
      expected_impact_pct: 10,
      start_date: "",
      end_date: "",
      notes: "",
    });
  };

  const edit = (item) => {
    setSelected(item);
    setForm({
      name: item.name || "",
      category: item.category || "other",
      region: item.region || "BC",
      owner: item.owner || "",
      status: item.status || "planned",
      expected_kpi: item.expected_kpi || "",
      expected_impact_pct: item.expected_impact_pct ?? 0,
      start_date: item.start_date ? String(item.start_date).slice(0, 10) : "",
      end_date: item.end_date ? String(item.end_date).slice(0, 10) : "",
      notes: item.notes || "",
    });
  };

  const trackOutcome = async () => {
    if (!selected?.id) {
      addLog("warning", "Select an intervention first");
      return;
    }

    const nowYear = new Date().getFullYear();
    const metricPool = metrics.filter(m =>
      m.category === selected.category &&
      m.region === selected.region &&
      m.value != null &&
      m.year != null
    );

    if (!metricPool.length) {
      addLog("warning", "No comparable metrics found for this intervention");
      return;
    }

    const sorted = metricPool.sort((a, b) => b.year - a.year);
    const latest = sorted.find(m => m.year <= nowYear);
    const baseline = sorted.find(m => m.year <= (new Date(selected.start_date || Date.now()).getFullYear() - 1)) || sorted[sorted.length - 1];

    if (!latest || !baseline) {
      addLog("warning", "Not enough baseline/latest data to track outcome");
      return;
    }

    const delta = Number(latest.value) - Number(baseline.value);
    const deltaPct = baseline.value ? (delta / Math.abs(Number(baseline.value))) * 100 : 0;

    await base44.entities.InterventionOutcome.create({
      intervention_id: selected.id,
      intervention_name: selected.name,
      metric_id: latest.id,
      metric_name: latest.name,
      baseline_year: baseline.year,
      baseline_value: baseline.value,
      current_year: latest.year,
      current_value: latest.value,
      delta_value: Number(delta.toFixed(3)),
      delta_pct: Number(deltaPct.toFixed(2)),
      status: Math.abs(deltaPct) < 2 ? "neutral" : deltaPct > 0 ? "up" : "down",
      confidence_score: latest.freshness_score || 0.7,
      notes: `Auto-tracked from HealthMetric for ${selected.category}/${selected.region}`,
    });

    addLog("success", "Intervention outcome snapshot recorded");
    await load();
  };

  return (
    <div className="p-5 h-full overflow-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Activity size={14} style={{ color: "var(--accent-primary)" }} />
            Intervention Registry
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Manage intervention lifecycle and track expected vs observed KPI shifts.
          </p>
        </div>
        <button onClick={() => load(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="metric-card space-y-3 xl:col-span-1">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Intervention Form</div>
          <Field label="Name"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Category">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Region"><input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} style={inputStyle} /></Field>
            <Field label="Owner"><input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} style={inputStyle} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Expected KPI"><input value={form.expected_kpi} onChange={e => setForm(f => ({ ...f, expected_kpi: e.target.value }))} style={inputStyle} /></Field>
            <Field label="Expected Impact %"><input type="number" value={form.expected_impact_pct} onChange={e => setForm(f => ({ ...f, expected_impact_pct: Number(e.target.value || 0) }))} style={inputStyle} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Start Date"><input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={inputStyle} /></Field>
            <Field label="End Date"><input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={inputStyle} /></Field>
          </div>
          <Field label="Notes"><textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inputStyle} /></Field>
          <div className="flex items-center gap-2">
            <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium" style={{ background: "var(--accent-primary)", color: "#000" }}>
              {selected ? <Save size={12} /> : <Plus size={12} />} {selected ? "Update" : "Create"}
            </button>
            {selected && <button onClick={resetForm} className="px-3 py-1.5 rounded text-xs" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>Clear</button>}
          </div>
        </div>

        <div className="metric-card xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Interventions</div>
            <button onClick={trackOutcome} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
              <TrendingUp size={11} /> Track Outcome Snapshot
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-1 max-h-72 overflow-auto">
              {items.map(i => (
                <div key={i.id} className="p-2 rounded" style={{ border: "1px solid var(--border-subtle)", background: selected?.id === i.id ? "var(--bg-hover)" : "var(--bg-overlay)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => edit(i)} className="text-left flex-1">
                      <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{i.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{i.category?.replace(/_/g, " ")} · {i.region} · {i.status}</div>
                    </button>
                    <button onClick={() => remove(i)} className="activity-icon" style={{ width: 22, height: 22, color: "var(--color-error)" }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
              {!items.length && !loading && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No interventions created yet.</div>}
            </div>

            <div className="rounded-lg p-3" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Outcome History</div>
              <div className="space-y-1 max-h-64 overflow-auto">
                {selectedOutcomes.map(o => (
                  <div key={o.id} className="px-2 py-1.5 rounded text-xs" style={{ border: "1px solid var(--border-subtle)" }}>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{o.metric_name}</div>
                    <div style={{ color: "var(--text-muted)" }}>{o.baseline_year}: {o.baseline_value} {" -> "} {o.current_year}: {o.current_value}</div>
                    <div style={{ color: Number(o.delta_pct) > 0 ? "var(--color-error)" : "var(--color-success)" }}>Delta: {o.delta_pct}%</div>
                  </div>
                ))}
                {!selectedOutcomes.length && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No outcomes yet for selected intervention.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}><RefreshCw size={11} className="animate-spin" /> Loading interventions...</div>}
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>{children}</div>;
}

const inputStyle = {
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
  width: "100%",
  padding: "6px 8px",
  borderRadius: 6,
  fontSize: 12,
  outline: "none",
};
