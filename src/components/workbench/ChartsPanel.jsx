/**
 * ChartsPanel — interactive chart builder for an uploaded dataset.
 * Supports bar, line, scatter, and histogram chart types with X/Y
 * column selectors.
 */

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { toNumber, histogram } from "@/lib/quantStats";

const CHART_TYPES = [
  { id: "bar", label: "Bar" },
  { id: "line", label: "Line" },
  { id: "scatter", label: "Scatter" },
  { id: "histogram", label: "Histogram" },
];

const ACCENT = "#40c4ff";

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md px-2 py-1.5 text-xs"
        style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

export default function ChartsPanel({ columns, rows, columnTypes }) {
  const numericCols = columnTypes.filter((c) => c.type === "numeric").map((c) => c.name);
  const allCols = columns;

  const [chartType, setChartType] = useState(numericCols.length >= 2 ? "scatter" : "bar");
  const [xCol, setXCol] = useState(allCols[0] ?? "");
  const [yCol, setYCol] = useState(numericCols[0] ?? "");

  const tooltipStyle = {
    contentStyle: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 6, fontSize: 11 },
  };

  const chartData = useMemo(() => {
    if (chartType === "histogram") {
      return histogram(rows.map((r) => r[yCol]));
    }
    const data = rows
      .map((r) => ({
        x: chartType === "scatter" ? toNumber(r[xCol]) : String(r[xCol] ?? ""),
        y: toNumber(r[yCol]),
      }))
      .filter((d) => d.y !== null && (chartType !== "scatter" || d.x !== null));

    if (chartType === "bar") {
      // Aggregate duplicate x values by mean
      const groups = {};
      data.forEach((d) => {
        if (!groups[d.x]) groups[d.x] = { sum: 0, n: 0 };
        groups[d.x].sum += d.y;
        groups[d.x].n++;
      });
      return Object.entries(groups)
        .map(([x, g]) => ({ x, y: g.sum / g.n }))
        .slice(0, 40);
    }
    return data.slice(0, 2000);
  }, [rows, chartType, xCol, yCol]);

  if (numericCols.length === 0) {
    return <div className="text-xs" style={{ color: "var(--text-muted)" }}>No numeric columns available to chart.</div>;
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Chart type
          <div className="flex rounded-md overflow-hidden" style={{ border: "1px solid var(--border-default)" }}>
            {CHART_TYPES.map((t) => (
              <button key={t.id} onClick={() => setChartType(t.id)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: chartType === t.id ? "rgba(64,196,255,0.15)" : "var(--bg-overlay)",
                  color: chartType === t.id ? ACCENT : "var(--text-secondary)",
                  borderRight: "1px solid var(--border-subtle)",
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {chartType !== "histogram" && (
          <Select label="X axis" value={xCol} onChange={setXCol}
            options={chartType === "scatter" ? numericCols : allCols} />
        )}
        <Select label={chartType === "histogram" ? "Column" : "Y axis (numeric)"} value={yCol} onChange={setYCol} options={numericCols} />
      </div>

      {/* Chart */}
      <div className="rounded-lg p-3" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
        <div style={{ width: "100%", height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" || chartType === "histogram" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={chartType === "histogram" ? "bin" : "x"} tick={{ fontSize: 10 }} interval="preserveStartEnd" angle={-20} height={50} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey={chartType === "histogram" ? "count" : "y"} name={chartType === "histogram" ? `Frequency of ${yCol}` : yCol} fill={ACCENT} radius={[3, 3, 0, 0]} />
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="y" name={yCol} stroke={ACCENT} strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            ) : (
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name={xCol} type="number" tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                <YAxis dataKey="y" name={yCol} type="number" tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Scatter name={`${yCol} vs ${xCol}`} data={chartData} fill={ACCENT} fillOpacity={0.7} />
              </ScatterChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}