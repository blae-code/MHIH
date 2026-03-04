import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { BrainCircuit, RefreshCw, Play, AlertTriangle } from "lucide-react";

export default function Backtesting() {
  const { addLog } = useApp();
  const [runs, setRuns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [working, setWorking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(20);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ScenarioRun.filter({ run_type: "forecast_backtest" }, "-created_date", 100).catch(() => []);
      setRuns(data || []);
      if (data?.length) setSelected(data[0]);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const runBacktest = async () => {
    setWorking(true);
    try {
      const res = await base44.functions.invoke("runForecastBacktest", { mape_alert_threshold: threshold });
      addLog("success", `Backtest complete: MAPE ${res.data?.overall_mape}% over ${res.data?.rows_analyzed} series`);
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  const rows = selected?.output?.rows || [];
  const categoryScores = selected?.output?.category_scores || [];
  const regionScores = selected?.output?.region_scores || [];

  const riskRegions = useMemo(() => regionScores.filter(r => Number(r.mape) >= threshold), [regionScores, threshold]);

  return (
    <div className="p-5 h-full overflow-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <BrainCircuit size={14} style={{ color: "var(--accent-primary)" }} />
            Forecast Backtesting
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Evaluate forecast error (MAPE, MAE, sMAPE) by region/category and flag model drift.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value || 0))} className="text-xs px-2 py-1 rounded w-20" style={inputStyle} />
          <button onClick={runBacktest} disabled={working} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium" style={{ background: "var(--accent-primary)", color: "#000" }}>
            {working ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />} Run Backtest
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="metric-card xl:col-span-1">
          <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Backtest Runs</div>
          <div className="space-y-1 max-h-[520px] overflow-auto">
            {runs.map(r => (
              <button key={r.id} onClick={() => setSelected(r)} className="w-full text-left p-2 rounded" style={{ border: "1px solid var(--border-subtle)", background: selected?.id === r.id ? "var(--bg-hover)" : "var(--bg-overlay)" }}>
                <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{r.scenario_name || "Backtest"}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Date(r.created_date).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" })}
                </div>
                <div className="text-xs" style={{ color: "var(--accent-primary)" }}>MAPE: {r.output?.overall_mape ?? "n/a"}%</div>
              </button>
            ))}
            {!runs.length && !loading && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No backtest runs yet.</div>}
          </div>
        </div>

        <div className="metric-card xl:col-span-2 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="Overall MAPE" value={`${selected?.output?.overall_mape ?? "—"}%`} color="var(--accent-primary)" />
            <Stat label="Overall sMAPE" value={`${selected?.output?.overall_smape ?? "—"}%`} color="var(--color-info)" />
            <Stat label="Overall MAE" value={`${selected?.output?.overall_mae ?? "—"}`} color="var(--color-warning)" />
            <Stat label="Series" value={String((rows || []).length)} color="var(--color-info)" />
            <Stat label="Risk Regions" value={String(riskRegions.length)} color="var(--color-error)" />
          </div>

          {!!riskRegions.length && (
            <div className="rounded p-3" style={{ background: "rgba(185,28,28,0.08)", border: "1px solid var(--color-error)" }}>
              <div className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: "var(--color-error)" }}>
                <AlertTriangle size={11} /> Potential Model Drift
              </div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {riskRegions.map(r => `${r.region} (${r.mape}%)`).join(", ")}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-lg overflow-auto" style={{ border: "1px solid var(--border-subtle)", maxHeight: 260 }}>
              <table className="w-full data-table text-xs">
                <thead>
                  <tr>
                    <th className="text-left">Category</th>
                    <th className="text-right">MAPE</th>
                    <th className="text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryScores.map(c => (
                    <tr key={c.category}>
                      <td>{c.category?.replace(/_/g, " ")}</td>
                      <td className="text-right">{c.mape}%</td>
                      <td className="text-right">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-lg overflow-auto" style={{ border: "1px solid var(--border-subtle)", maxHeight: 260 }}>
              <table className="w-full data-table text-xs">
                <thead>
                  <tr>
                    <th className="text-left">Region</th>
                    <th className="text-right">MAPE</th>
                    <th className="text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {regionScores.map(r => (
                    <tr key={r.region}>
                      <td>{r.region}</td>
                      <td className="text-right" style={{ color: Number(r.mape) >= threshold ? "var(--color-error)" : "var(--text-secondary)" }}>{r.mape}%</td>
                      <td className="text-right">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg overflow-auto" style={{ border: "1px solid var(--border-subtle)", maxHeight: 320 }}>
            <table className="w-full data-table text-xs">
              <thead>
                <tr>
                  <th className="text-left">Metric</th>
                  <th className="text-left">Region</th>
                  <th className="text-right">Year</th>
                  <th className="text-right">Actual</th>
                  <th className="text-right">Predicted</th>
                  <th className="text-right">APE%</th>
                  <th className="text-right">sMAPE%</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((r, idx) => (
                  <tr key={`${r.metric_name}-${idx}`}>
                    <td>{r.metric_name}</td>
                    <td>{r.region}</td>
                    <td className="text-right">{r.holdout_year}</td>
                    <td className="text-right">{r.actual}</td>
                    <td className="text-right">{r.predicted}</td>
                    <td className="text-right" style={{ color: Number(r.ape) >= threshold ? "var(--color-error)" : "var(--text-secondary)" }}>{r.ape}</td>
                    <td className="text-right" style={{ color: Number(r.smape) >= threshold ? "var(--color-error)" : "var(--text-secondary)" }}>{r.smape ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {loading && <div className="text-xs" style={{ color: "var(--text-muted)" }}><RefreshCw size={11} className="inline animate-spin mr-1" /> Loading backtests...</div>}
    </div>
  );
}

function Stat({ label, value, color }) {
  return <div className="rounded p-3" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}><div className="text-lg font-bold" style={{ color }}>{value}</div><div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div></div>;
}

const inputStyle = {
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
  outline: "none",
};
