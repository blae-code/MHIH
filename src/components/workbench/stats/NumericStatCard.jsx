/**
 * NumericStatCard — per-column widget: key stats, mini distribution
 * histogram, min→max range bar with IQR band and median marker.
 */

import React, { useMemo } from "react";
import { BarChart, Bar, ResponsiveContainer, Tooltip } from "recharts";
import { histogram, fmtNum } from "@/lib/quantStats";

function Stat({ label, value, accent }) {
  return (
    <div>
      <div className="tabular-nums font-bold" style={{ fontSize: 14, color: accent ?? "var(--text-primary)" }}>{value}</div>
      <div style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

export default function NumericStatCard({ name, stats, values }) {
  const bins = useMemo(() => histogram(values, 14), [values]);
  const span = stats.max - stats.min || 1;
  const pct = (v) => ((v - stats.min) / span) * 100;
  const missingPct = stats.missing / (stats.count + stats.missing) * 100;

  return (
    <div className="depth-card p-3.5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }} title={name}>{name}</span>
        <span style={{
          fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase",
          letterSpacing: "0.06em", color: "#40c4ff", background: "rgba(64,196,255,0.10)", border: "1px solid rgba(64,196,255,0.30)",
        }}>num</span>
        <span className="ml-auto tabular-nums" style={{ fontSize: 10, color: stats.missing > 0 ? "#ffab40" : "var(--text-muted)" }}>
          {stats.missing > 0 ? `${stats.missing} missing (${missingPct.toFixed(0)}%)` : `n = ${stats.count.toLocaleString()}`}
        </span>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <Stat label="Mean" value={fmtNum(stats.mean)} accent="#40c4ff" />
        <Stat label="Median" value={fmtNum(stats.median)} />
        <Stat label="Std Dev" value={fmtNum(stats.std)} />
        <Stat label="Range" value={fmtNum(stats.max - stats.min)} />
      </div>

      {/* Mini histogram */}
      <div style={{ height: 56 }} className="mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <Tooltip
              formatter={(v) => [v, "Count"]}
              labelFormatter={(l, p) => p?.[0]?.payload?.bin ?? ""}
              contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 10 }}
            />
            <Bar dataKey="count" fill="rgba(64,196,255,0.55)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Range bar: min → max with IQR band + median tick */}
      <div className="relative h-2 rounded-full mb-1" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
        <div className="absolute top-0 bottom-0 rounded-full"
          style={{ left: `${pct(stats.q1)}%`, width: `${Math.max(pct(stats.q3) - pct(stats.q1), 1)}%`, background: "rgba(64,196,255,0.35)" }}
          title={`IQR: ${fmtNum(stats.q1)} – ${fmtNum(stats.q3)}`} />
        <div className="absolute" style={{
          left: `${pct(stats.median)}%`, top: -3, bottom: -3, width: 2,
          background: "#FEDD00", borderRadius: 1, boxShadow: "0 0 5px #FEDD0088",
        }} title={`Median: ${fmtNum(stats.median)}`} />
      </div>
      <div className="flex justify-between tabular-nums" style={{ fontSize: 9, color: "var(--text-muted)" }}>
        <span>{fmtNum(stats.min)}</span>
        <span style={{ color: "var(--text-secondary)" }}>IQR {fmtNum(stats.q1)}–{fmtNum(stats.q3)}</span>
        <span>{fmtNum(stats.max)}</span>
      </div>
    </div>
  );
}