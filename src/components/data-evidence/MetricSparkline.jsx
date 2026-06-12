/**
 * MetricSparkline
 *
 * Inline trend preview for a single metric name within the Data Repository.
 * Given the full metrics array and a target metric, finds the matching
 * historical series (same name + region) and renders a compact area chart.
 *
 * Designed to expand inline under a table row without leaving the page.
 */

import React, { useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceDot,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { getMetricDirection, isImprovement } from "@/lib/metricSemantics";

export default function MetricSparkline({ metric, allMetrics, height = 120 }) {
  const series = useMemo(() => {
    if (!metric?.name) return [];
    return allMetrics
      .filter((m) => m.name === metric.name && m.region === metric.region && m.year != null && m.value != null)
      .map((m) => ({ year: Number(m.year), value: Number(m.value), id: m.id }))
      .sort((a, b) => a.year - b.year);
  }, [metric, allMetrics]);

  if (series.length < 2) {
    return (
      <div
        className="flex items-center justify-center gap-2 py-4 rounded-md"
        style={{
          background: "var(--bg-overlay)",
          border: "1px dashed var(--border-subtle)",
          color: "var(--text-muted)",
          minHeight: height,
        }}
      >
        <AlertCircle size={13} />
        <span className="text-xs">
          {series.length === 0
            ? "No historical data points for this metric."
            : "Need at least 2 data points to show a trend."}
        </span>
      </div>
    );
  }

  const latest = series[series.length - 1];
  const prev = series[series.length - 2];
  const delta = latest.value - prev.value;
  const pctChange = prev.value !== 0 ? (delta / prev.value) * 100 : 0;
  const direction = getMetricDirection(metric);
  const improving = direction !== "neutral" ? isImprovement(delta, direction) : null;

  const trendColor =
    improving === true ? "var(--color-success)" :
    improving === false ? "var(--color-error)" :
    "var(--color-info)";

  const TrendIcon =
    Math.abs(pctChange) < 0.5 ? Minus :
    delta > 0 ? TrendingUp : TrendingDown;

  const min = Math.min(...series.map((s) => s.value));
  const max = Math.max(...series.map((s) => s.value));
  const gradId = `spark-${metric.id || metric.name?.replace(/\s+/g, "-")}`;

  return (
    <div
      className="rounded-md p-3"
      style={{
        background: "linear-gradient(135deg, rgba(64,196,255,0.04) 0%, var(--bg-overlay) 100%)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Stats strip */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)", fontSize: 9, letterSpacing: "0.08em" }}>
              Range
            </div>
            <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
              {series[0].year}–{latest.year}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)", fontSize: 9, letterSpacing: "0.08em" }}>
              Points
            </div>
            <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
              {series.length}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)", fontSize: 9, letterSpacing: "0.08em" }}>
              Min · Max
            </div>
            <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
              {min.toLocaleString()} · {max.toLocaleString()}
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{
            background: `color-mix(in srgb, ${trendColor} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${trendColor} 30%, transparent)`,
            color: trendColor,
          }}
          title={
            improving === true ? "Latest move is an improvement based on metric direction"
            : improving === false ? "Latest move is a worsening based on metric direction"
            : "Neutral / direction not classified"
          }
        >
          <TrendIcon size={12} />
          <span className="text-xs font-semibold tabular-nums">
            {delta >= 0 ? "+" : ""}{delta.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            {metric.unit ? ` ${metric.unit}` : ""}
          </span>
          <span className="text-xs tabular-nums" style={{ opacity: 0.75 }}>
            ({pctChange >= 0 ? "+" : ""}{pctChange.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={trendColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: "var(--border-subtle)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={36}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: 6,
                fontSize: 11,
              }}
              labelStyle={{ color: "var(--text-primary)" }}
              formatter={(v) => [`${Number(v).toLocaleString()}${metric.unit ? " " + metric.unit : ""}`, metric.name]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={trendColor}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={{ r: 2.5, fill: trendColor, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
            <ReferenceDot
              x={latest.year}
              y={latest.value}
              r={4}
              fill={trendColor}
              stroke="#0a1220"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}