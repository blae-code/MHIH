import React, { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Area, AreaChart, Cell
} from "recharts";
import { BarChart2, TrendingUp, ScatterChart as ScatterIcon, Grid3x3, X, Maximize2 } from "lucide-react";
import HeatmapChart from "@/components/viz/HeatmapChart";

const CHART_TYPES = [
  { key: "bar", label: "Bar", icon: BarChart2 },
  { key: "line", label: "Time Series", icon: TrendingUp },
  { key: "area", label: "Area", icon: TrendingUp },
  { key: "scatter", label: "Scatter", icon: ScatterIcon },
  { key: "heatmap", label: "Heatmap", icon: Grid3x3 },
];

const COLORS = ["#FEDD00", "#306369", "#CD7236", "#4a78c4", "#2ea043", "#B9262D", "#a78bfa", "#34d399"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs shadow-xl"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
      {label && <div className="font-semibold mb-1" style={{ color: "var(--accent-primary)" }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color: p.color || "var(--accent-primary)" }}>●</span>
          <span style={{ color: "var(--text-muted)" }}>{p.name}:</span>
          <span className="font-mono font-semibold">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalystChartPanel({ chartData, title, onClose }) {
  const [chartType, setChartType] = useState("bar");

  if (!chartData || chartData.length === 0) return null;

  const keys = Object.keys(chartData[0] || {}).filter(k => k !== "name" && k !== "label" && k !== "x" && k !== "y");
  const numericKeys = keys.filter(k => typeof chartData[0][k] === "number");

  // Normalise data: ensure "name" field exists
  const data = chartData.map(d => ({
    ...d,
    name: d.name || d.label || d.x || String(Object.values(d)[0]),
  }));

  // Build heatmap data from supporting_data if applicable
  const heatmapData = data.map((d, i) => ({
    rowKey: d.name,
    colKey: numericKeys[0] || "value",
    value: numericKeys[0] ? d[numericKeys[0]] : i,
  }));

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <BarChart2 size={13} style={{ color: "var(--accent-primary)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{title || "Chart"}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Chart type switcher */}
          {CHART_TYPES.map(ct => (
            <button key={ct.key} onClick={() => setChartType(ct.key)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
              style={{
                background: chartType === ct.key ? "var(--accent-muted)" : "transparent",
                color: chartType === ct.key ? "var(--accent-primary)" : "var(--text-muted)",
                border: `1px solid ${chartType === ct.key ? "var(--accent-primary)" : "transparent"}`,
              }}>
              <ct.icon size={11} />
              <span className="hidden sm:inline">{ct.label}</span>
            </button>
          ))}
          {onClose && (
            <button onClick={onClose} className="ml-1 activity-icon" style={{ width: 24, height: 24 }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4" style={{ height: 280 }}>
        {chartType === "heatmap" ? (
          <div className="overflow-auto h-full">
            <HeatmapChart data={heatmapData} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={data} margin={{ top: 4, right: 8, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                {numericKeys.slice(0, 4).map((k, i) => (
                  <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={data} margin={{ top: 4, right: 8, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {numericKeys.slice(0, 4).map((k, i) => (
                  <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            ) : chartType === "area" ? (
              <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 24, left: 8 }}>
                <defs>
                  {numericKeys.slice(0, 4).map((k, i) => (
                    <linearGradient key={k} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                {numericKeys.slice(0, 4).map((k, i) => (
                  <Area key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} fill={`url(#grad${i})`} strokeWidth={2} />
                ))}
              </AreaChart>
            ) : (
              // Scatter
              <ScatterChart margin={{ top: 4, right: 8, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey={numericKeys[0] || "x"} name={numericKeys[0] || "x"} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <YAxis dataKey={numericKeys[1] || numericKeys[0] || "y"} name={numericKeys[1] || "y"} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={data} fill={COLORS[0]}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Scatter>
              </ScatterChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}