import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { FlaskConical, Play, RefreshCw, Brain, Plus, Save, Sparkles, AlertTriangle } from "lucide-react";

const CATEGORIES = ["all", "chronic_disease", "mental_health", "substance_use", "maternal_child", "social_determinants", "demographics", "mortality", "access_to_care", "other"];
const REGIONS = ["all", "BC", "Northern BC", "Interior BC", "Fraser", "Vancouver Island", "Vancouver Coastal", "Provincial"];

export default function PolicyLab() {
  const { addLog } = useApp();
  const [scenarios, setScenarios] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [causalResult, setCausalResult] = useState(null);
  const [working, setWorking] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "mental_health",
    region: "BC",
    intervention_type: "preventive",
    magnitude_pct: 10,
    coverage_pct: 30,
    target_metric_name: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        base44.entities.PolicyScenario.list("-updated_date", 200).catch(() => []),
        base44.entities.ScenarioRun.list("-created_date", 200).catch(() => []),
      ]);
      setScenarios(s || []);
      setRuns(r || []);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const scenarioRuns = useMemo(() => {
    if (!selectedScenario?.id) return runs.slice(0, 15);
    return runs.filter(r => r.scenario_id === selectedScenario.id).slice(0, 20);
  }, [runs, selectedScenario]);

  const saveScenario = async () => {
    if (!form.name.trim()) return;
    setWorking(true);
    try {
      if (selectedScenario?.id) {
        await base44.entities.PolicyScenario.update(selectedScenario.id, form);
        addLog("success", "Scenario updated");
      } else {
        await base44.entities.PolicyScenario.create({ ...form, status: "draft" });
        addLog("success", "Scenario created");
      }
      setSelectedScenario(null);
      setForm({
        name: "",
        category: "mental_health",
        region: "BC",
        intervention_type: "preventive",
        magnitude_pct: 10,
        coverage_pct: 30,
        target_metric_name: "",
        notes: "",
      });
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  const runSimulation = async () => {
    if (!selectedScenario?.id && !form.name.trim()) return;
    setWorking(true);
    setCausalResult(null);
    try {
      const payload = selectedScenario?.id ? { scenario_id: selectedScenario.id } : form;
      const res = await base44.functions.invoke("runScenarioSimulation", payload);
      setSimResult(res.data);
      addLog("success", `Simulation complete (${res.data?.projections_count || 0} projections)`);
      await load();
    } catch (e) {
      addLog("error", `Simulation failed: ${e.message}`);
    }
    setWorking(false);
  };

  const runCausal = async () => {
    const target = selectedScenario?.target_metric_name || form.target_metric_name;
    if (!target?.trim()) {
      addLog("warning", "Target metric name is required for causal analysis");
      return;
    }
    setWorking(true);
    try {
      const res = await base44.functions.invoke("runCausalAnalysis", {
        target_metric_name: target,
        category: selectedScenario?.category || form.category,
        region: selectedScenario?.region || form.region,
        use_cache: true,
        cache_ttl_hours: 24,
      });
      setCausalResult(res.data);
      addLog("success", `Causal analysis complete (${res.data?.drivers_count || 0} drivers)`);
      await load();
    } catch (e) {
      addLog("error", `Causal analysis failed: ${e.message}`);
    }
    setWorking(false);
  };

  const openScenario = (s) => {
    setSelectedScenario(s);
    setForm({
      name: s.name || "",
      category: s.category || "other",
      region: s.region || "BC",
      intervention_type: s.intervention_type || "preventive",
      magnitude_pct: s.magnitude_pct ?? 10,
      coverage_pct: s.coverage_pct ?? 30,
      target_metric_name: s.target_metric_name || "",
      notes: s.notes || "",
    });
  };

  return (
    <div className="p-5 h-full overflow-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <FlaskConical size={14} style={{ color: "var(--accent-primary)" }} />
            Policy Lab
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Simulate interventions and run causal driver analysis before policy decisions.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="metric-card xl:col-span-1 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Scenario Builder</div>
          <Field label="Scenario Name">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="e.g. Youth MH outreach expansion" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Category">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                {CATEGORIES.filter(c => c !== "all").map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </Field>
            <Field label="Region">
              <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} style={inputStyle}>
                {REGIONS.filter(r => r !== "all").map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Magnitude %">
              <input type="number" value={form.magnitude_pct} onChange={e => setForm(f => ({ ...f, magnitude_pct: Number(e.target.value || 0) }))} style={inputStyle} />
            </Field>
            <Field label="Coverage %">
              <input type="number" value={form.coverage_pct} onChange={e => setForm(f => ({ ...f, coverage_pct: Number(e.target.value || 0) }))} style={inputStyle} />
            </Field>
          </div>
          <Field label="Intervention Type">
            <select value={form.intervention_type} onChange={e => setForm(f => ({ ...f, intervention_type: e.target.value }))} style={inputStyle}>
              <option value="preventive">preventive</option>
              <option value="service_access">service_access</option>
              <option value="screening">screening</option>
              <option value="risk_increase">risk_increase</option>
            </select>
          </Field>
          <Field label="Target Metric Name (for causal run)">
            <input value={form.target_metric_name} onChange={e => setForm(f => ({ ...f, target_metric_name: e.target.value }))} style={inputStyle} placeholder="e.g. Depression screening rate" />
          </Field>
          <Field label="Notes">
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inputStyle} />
          </Field>
          <div className="flex items-center gap-2">
            <button onClick={saveScenario} disabled={working} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: "var(--accent-primary)", color: "#000" }}>
              {selectedScenario ? <Save size={12} /> : <Plus size={12} />}
              {selectedScenario ? "Update Scenario" : "Create Scenario"}
            </button>
            {selectedScenario && (
              <button onClick={() => { setSelectedScenario(null); }} className="px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="metric-card xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Scenario Execution</div>
            <div className="flex items-center gap-2">
              <button onClick={runSimulation} disabled={working} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs" style={{ background: "var(--accent-primary)", color: "#000" }}>
                {working ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />} Run Simulation
              </button>
              <button onClick={runCausal} disabled={working} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                <Brain size={11} /> Run Causal
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Scenarios</div>
              <div className="space-y-1 max-h-48 overflow-auto">
                {scenarios.map(s => (
                  <button key={s.id} onClick={() => openScenario(s)} className="w-full text-left px-2 py-1.5 rounded text-xs" style={{ background: selectedScenario?.id === s.id ? "var(--bg-hover)" : "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{s.name}</div>
                    <div>{s.category?.replace(/_/g, " ")} · {s.region}</div>
                  </button>
                ))}
                {!scenarios.length && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No scenarios yet.</div>}
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Recent Runs</div>
              <div className="space-y-1 max-h-48 overflow-auto">
                {scenarioRuns.map(r => (
                  <div key={r.id} className="px-2 py-1.5 rounded text-xs" style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{r.scenario_name || r.run_type}</div>
                    <div>{r.run_type} · {r.model_version || "model"} · {new Date(r.created_date).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" })}</div>
                  </div>
                ))}
                {!scenarioRuns.length && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No runs yet.</div>}
              </div>
            </div>
          </div>

          {simResult?.projections?.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Simulation Projections</div>
              <div className="overflow-auto rounded" style={{ border: "1px solid var(--border-subtle)" }}>
                <table className="data-table w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left">Metric</th>
                      <th className="text-left">Region</th>
                      <th className="text-right">1Y Impact %</th>
                      <th className="text-right">3Y Impact %</th>
                      <th className="text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simResult.projections.slice(0, 20).map((p, idx) => (
                      <tr key={`${p.metric_name}-${idx}`}>
                        <td>{p.metric_name}</td>
                        <td>{p.region}</td>
                        <td className="text-right" style={{ color: p.pct_impact_1y > 0 ? "var(--color-error)" : "var(--color-success)" }}>{p.pct_impact_1y}</td>
                        <td className="text-right" style={{ color: p.pct_impact_3y > 0 ? "var(--color-error)" : "var(--color-success)" }}>{p.pct_impact_3y}</td>
                        <td className="text-right">{(p.confidence * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {causalResult?.drivers?.length > 0 && (
            <div className="rounded-lg p-3" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)" }}>
              <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--accent-primary)" }}>
                <Sparkles size={11} /> Causal Driver Highlights
              </div>
              <div className="space-y-1">
                {causalResult.drivers.slice(0, 6).map((d, i) => (
                  <div key={i} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {d.metric_name} ({d.region}) · {d.direction} · effect {d.effect_size} · uncertainty {d.uncertainty}
                  </div>
                ))}
              </div>
              <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                {causalResult.narrative?.summary || ""}
              </div>
            </div>
          )}

          {!simResult && !causalResult && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <AlertTriangle size={12} /> Run a simulation or causal analysis to generate scenario evidence and recommendations.
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <RefreshCw size={12} className="animate-spin" /> Loading policy lab...
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>
      {children}
    </div>
  );
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
