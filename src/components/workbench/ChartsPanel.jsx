/**
 * ChartsPanel — interactive chart builder for an uploaded dataset.
 * Supports bar, line, scatter, and histogram chart types with X/Y
 * column selectors. Dark-themed tooltips, gradients, and controls.
 */

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon, ScatterChart as ScatterIcon, BarChartHorizontal } from "lucide-react";
import { toNumber, histogram } from "@/lib/quantStats";
import { TOOLTIP_PROPS, AXIS_TICK, GRID_STROKE, CURSOR_FILL } from "@/components/workbench/chartTheme";
import WorkbenchSelect from "@/components/workbench/WorkbenchSelect";
import CommentAnchor from "@/components/comments/CommentAnchor";

const CHART_TYPES = [
  { id: "bar", label: "Bar", icon: BarChart3 },
  { id: "line", label: "Line", icon: LineChartIcon },
  { id: "scatter", label: "Scatter", icon: ScatterIcon },
  { id: "histogram", label: "Histogram", icon: BarChartHorizontal },
];

const ACCENT = "#40c4ff";

export default function ChartsPanel({ columns, rows, columnTypes }) {
  const numericCols = columnTypes.filter((c) => c.type === "numeric").map((c) => c.name);
  const allCols = columns;

  const [chartType, setChartType] = useState(numericCols.length >= 2 ? "scatter" : "bar");
  const [xCol, setXCol] = useState(allCols[0] ?? "");
  const [yCol, setYCol] = useState(numericCols[0] ?? "");

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

  const chartTitle =
    chartType === "histogram" ? `Distribution of ${yCol}` :
    chartType === "scatter" ? `${yCol} vs ${xCol}` :
    `${yCol} by ${xCol}${chartType === "bar" ? " (mean)" : ""}`;

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex flex-col gap-1" style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Chart type
          <div className="flex rounded-md overflow-hidden" style={{ border: "1px solid var(--border-default)", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
            {CHART_TYPES.map((t) => {
              const active = chartType === t.id;
              const TIcon = t.icon;
              return (
                <button key={t.id} onClick={() => setChartType(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    background: active ? "rgba(64,196,255,0.15)" : "var(--bg-overlay)",
                    color: active ? ACCENT : "var(--text-secondary)",
                    borderRight: "1px solid var(--border-subtle)",
                    boxShadow: active ? "inset 0 0 12px rgba(64,196,255,0.10)" : "none",
                    letterSpacing: "normal",
                    textTransform: "none",
                  }}>
                  <TIcon size={11} style={{ opacity: active ? 1 : 0.6 }} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        {chartType !== "histogram" && (
          <WorkbenchSelect label="X axis" value={xCol} onChange={setXCol}
            options={chartType === "scatter" ? numericCols : allCols} />
        )}
        <WorkbenchSelect label={chartType === "histogram" ? "Column" : "Y axis (numeric)"} value={yCol} onChange={setYCol} options={numericCols} />
      </div>

      {/* Chart card */}
      <div className="depth-card-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{chartTitle}</span>
          <span className="ml-auto tabular-nums" style={{ fontSize: 10, color: "var(--text-muted)" }}>
            {chartData.length.toLocaleString()} points
          </span>
          <CommentAnchor
            targetKey={`chart:${chartType}:${xCol}:${yCol}`}
            targetLabel={`Chart — ${chartTitle}`}
          />

        </div>
        <div className="p-3" style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" || chartType === "histogram" ? (
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="wbBarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0.45} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey={chartType === "histogram" ? "bin" : "x"} tick={AXIS_TICK} interval="preserveStartEnd" angle={-20} height={50} textAnchor="end" axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_PROPS} cursor={CURSOR_FILL} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey={chartType === "histogram" ? "count" : "y"} name={chartType === "histogram" ? `Frequency of ${yCol}` : yCol} fill="url(#wbBarFill)" stroke={ACCENT} strokeOpacity={0.4} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="x" tick={AXIS_TICK} interval="preserveStartEnd" axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_PROPS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="y" name={yCol} stroke={ACCENT} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: ACCENT, stroke: "#131f33", strokeWidth: 2 }} />
              </LineChart>
            ) : (
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="x" name={xCol} type="number" tick={AXIS_TICK} domain={["auto", "auto"]} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                <YAxis dataKey="y" name={yCol} type="number" tick={AXIS_TICK} domain={["auto", "auto"]} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_PROPS} cursor={{ strokeDasharray: "3 3", stroke: "#2a456a" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Scatter name={`${yCol} vs ${xCol}`} data={chartData} fill={ACCENT} fillOpacity={0.65} stroke={ACCENT} strokeOpacity={0.9} />
              </ScatterChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}