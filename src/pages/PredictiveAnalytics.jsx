import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  TrendingUp, Brain, RefreshCw, Play, ChevronRight, BarChart3,
  AlertTriangle, Sparkles, Calendar, Target
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart
} from "recharts";

const FORECAST_HORIZONS = [
  { value: 1, label: "1 Year" },
  { value: 3, label: "3 Years" },
  { value: 5, label: "5 Years" },
];

const MODELS = [
  { value: "trend", label: "Linear Trend", desc: "Extrapolates the current trend" },
  { value: "ai_forecast", label: "AI Forecast", desc: "AI-powered pattern analysis" },
];

const tooltipStyle = { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: 12 };

export default function PredictiveAnalytics() {
  const { addLog } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [horizon, setHorizon] = useState(3);
  const [model, setModel] = useState("ai_forecast");
  const [running, setRunning] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    base44.entities.HealthMetric.list("-year", 500)
      .then(data => { setMetrics(data); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(metrics.map(m => m.category))].filter(Boolean);
  const displayMetrics = metrics.filter(m =>
    (category === "all" || m.category === category) && m.value != null
  );

  // Group by metric name and pick ones with multi-year data
  const metricGroups = displayMetrics.reduce((acc, m) => {
    if (!acc[m.name]) acc[m.name] = [];
    acc[m.name].push(m);
    return acc;
  }, {});
  const multiYearMetrics = Object.entries(metricGroups)
    .filter(([, rows]) => rows.length >= 2)
    .map(([name, rows]) => ({ name, rows: rows.sort((a, b) => a.year - b.year) }));

  const handleForecast = async () => {
    if (!selectedMetric) return;
    setRunning(true);
    setForecast(null);
    addLog("info", `Forecasting: ${selectedMetric.name}...`);

    const rows = selectedMetric.rows;
    const lastYear = rows[rows.length - 1].year;
    const lastVal = rows[rows.length - 1].value;

    let projections = [];
    let narrative = "";
    let riskFlags = [];

    if (model === "trend") {
      // Simple linear trend
      const n = rows.length;
      const sumX = rows.reduce((s, r) => s + r.year, 0);
      const sumY = rows.reduce((s, r) => s + r.value, 0);
      const sumXY = rows.reduce((s, r) => s + r.year * r.value, 0);
      const sumX2 = rows.reduce((s, r) => s + r.year * r.year, 0);
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      for (let i = 1; i <= horizon; i++) {
        const yr = lastYear + i;
        projections.push({ year: yr, predicted: Math.max(0, slope * yr + intercept), lower: null, upper: null });
      }
      narrative = `Linear trend forecast: ${slope >= 0 ? "increasing" : "decreasing"} at ${Math.abs(slope).toFixed(2)} units/year.`;
    } else {
      // AI-powered forecast
      const historicalStr = rows.map(r => `${r.year}: ${r.value}`).join(", ");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a health data forecasting expert for BC Métis health metrics.
Metric: ${selectedMetric.name} (${rows[0]?.category?.replace(/_/g," ")}, ${rows[0]?.region})
Historical data: ${historicalStr}
Forecast horizon: ${horizon} years from ${lastYear}

Provide:
1. Predicted value for each year (${lastYear + 1} to ${lastYear + horizon})
2. A confidence range (lower and upper bounds, roughly ±15-25% unless data suggests otherwise)
3. A 2-3 sentence narrative explaining the forecast rationale
4. Up to 3 risk flags or important considerations`,
        response_json_schema: {
          type: "object",
          properties: {
            projections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  year: { type: "number" },
                  predicted: { type: "number" },
                  lower: { type: "number" },
                  upper: { type: "number" }
                }
              }
            },
            narrative: { type: "string" },
            risk_flags: { type: "array", items: { type: "string" } }
          }
        }
      });
      projections = result.projections || [];
      narrative = result.narrative || "";
      riskFlags = result.risk_flags || [];
    }

    const chartData = [
      ...rows.map(r => ({ year: r.year, actual: r.value })),
      ...projections.map(p => ({ year: p.year, predicted: p.predicted, lower: p.lower, upper: p.upper }))
    ];

    setForecast({ chartData, narrative, riskFlags, projections, metric: selectedMetric });
    setRunning(false);
    addLog("success", "Forecast complete");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full gap-2" style={{ color: "var(--text-muted)" }}>
      <RefreshCw size={16} className="animate-spin" />
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: metric selector */}
      <aside className="flex flex-col shrink-0 border-r"
        style={{ width: 260, background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} style={{ color: "var(--accent-primary)" }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Predictive Analytics</span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>AI-powered health trend forecasting</p>
        </div>
        {/* Category filter */}
        <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
          </select>
        </div>
        {/* Metric list */}
        <div className="flex-1 overflow-y-auto py-2">
          {multiYearMetrics.length === 0 ? (
            <p className="px-3 py-4 text-xs" style={{ color: "var(--text-muted)" }}>
              No multi-year metrics found. Import health metrics with at least 2 years of data.
            </p>
          ) : multiYearMetrics.map(({ name, rows }) => (
            <button key={name} onClick={() => { setSelectedMetric({ name, rows }); setForecast(null); }}
              className="w-full text-left px-3 py-2 transition-colors"
              style={{ background: selectedMetric?.name === name ? "var(--bg-hover)" : "transparent" }}
              onMouseOver={e => { if (selectedMetric?.name !== name) e.currentTarget.style.background = "var(--bg-elevated)"; }}
              onMouseOut={e => { if (selectedMetric?.name !== name) e.currentTarget.style.background = "transparent"; }}>
              <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{name}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                {rows[0].category?.replace(/_/g," ")} · {rows.length} years ({rows[0].year}–{rows[rows.length-1].year})
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b flex items-center gap-3 shrink-0"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          {/* Model + horizon */}
          <div className="flex items-center gap-2">
            {MODELS.map(m => (
              <button key={m.value} onClick={() => setModel(m.value)}
                className="px-2.5 py-1 rounded text-xs"
                style={{
                  background: model === m.value ? "var(--accent-muted)" : "var(--bg-elevated)",
                  color: model === m.value ? "var(--accent-primary)" : "var(--text-muted)",
                  border: `1px solid ${model === m.value ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                }}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="w-px h-4" style={{ background: "var(--border-subtle)" }} />
          <div className="flex items-center gap-1">
            <Calendar size={11} style={{ color: "var(--text-muted)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Horizon:</span>
            {FORECAST_HORIZONS.map(h => (
              <button key={h.value} onClick={() => setHorizon(h.value)}
                className="px-2 py-0.5 rounded text-xs"
                style={{
                  background: horizon === h.value ? "var(--bg-overlay)" : "transparent",
                  color: horizon === h.value ? "var(--text-primary)" : "var(--text-muted)",
                  border: `1px solid ${horizon === h.value ? "var(--border-default)" : "transparent"}`,
                }}>
                {h.label}
              </button>
            ))}
          </div>
          <button onClick={handleForecast} disabled={!selectedMetric || running}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-40"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            {running ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
            {running ? "Forecasting..." : "Run Forecast"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!selectedMetric && (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
              <TrendingUp size={40} className="mb-3 opacity-20" />
              <p className="text-sm">Select a metric with multi-year data to generate a forecast.</p>
            </div>
          )}

          {selectedMetric && !forecast && !running && (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
              <Brain size={32} className="mb-3 opacity-20" />
              <p className="text-sm">Click "Run Forecast" to generate a {horizon}-year prediction for <strong style={{ color: "var(--text-primary)" }}>{selectedMetric.name}</strong>.</p>
            </div>
          )}

          {forecast && (
            <>
              <div className="flex items-center gap-3">
                <Sparkles size={14} style={{ color: "var(--accent-primary)" }} />
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{forecast.metric.name}</h3>
                <span className="tag">{horizon}-year forecast</span>
              </div>

              {/* Chart */}
              <div className="metric-card">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={forecast.chartData}>
                    <defs>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e6a817" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#e6a817" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="year" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <ReferenceLine x={forecast.metric.rows[forecast.metric.rows.length - 1].year}
                      stroke="var(--border-emphasis)" strokeDasharray="4 4"
                      label={{ value: "Now", fill: "var(--text-muted)", fontSize: 10 }} />
                    <Area type="monotone" dataKey="actual" stroke="#58a6ff" fill="url(#actualGrad)" strokeWidth={2} name="Actual" dot={{ fill: "#58a6ff", r: 4 }} />
                    <Area type="monotone" dataKey="predicted" stroke="#e6a817" fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="5 5" name="Predicted" dot={{ fill: "#e6a817", r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Projections table */}
              <div className="metric-card overflow-x-auto">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Projected Values</div>
                <table className="w-full data-table text-xs">
                  <thead>
                    <tr>
                      <th className="text-left">Year</th>
                      <th className="text-right">Predicted Value</th>
                      <th className="text-right">Lower Bound</th>
                      <th className="text-right">Upper Bound</th>
                      <th className="text-right">Change from Last</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.projections.map(p => {
                      const lastActual = forecast.metric.rows[forecast.metric.rows.length - 1].value;
                      const change = ((p.predicted - lastActual) / lastActual * 100).toFixed(1);
                      return (
                        <tr key={p.year}>
                          <td style={{ color: "var(--text-primary)" }}>{p.year}</td>
                          <td className="text-right font-mono" style={{ color: "var(--accent-primary)" }}>{p.predicted?.toFixed(2)}</td>
                          <td className="text-right font-mono" style={{ color: "var(--text-muted)" }}>{p.lower?.toFixed(2) || "—"}</td>
                          <td className="text-right font-mono" style={{ color: "var(--text-muted)" }}>{p.upper?.toFixed(2) || "—"}</td>
                          <td className="text-right font-mono" style={{ color: change >= 0 ? "var(--color-error)" : "var(--color-success)" }}>{change > 0 ? "+" : ""}{change}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* AI narrative */}
              <div className="rounded-lg p-4 space-y-3"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-2">
                  <Brain size={13} style={{ color: "var(--accent-primary)" }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>Forecast Narrative</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{forecast.narrative}</p>
                {forecast.riskFlags?.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    <div className="text-xs font-semibold" style={{ color: "var(--color-warning)" }}>Risk Considerations</div>
                    {forecast.riskFlags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <AlertTriangle size={11} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 1 }} />
                        <span style={{ color: "var(--text-secondary)" }}>{flag}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}