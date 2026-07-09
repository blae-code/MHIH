/**
 * StatsOverviewStrip — headline dataset metrics for the Statistics tab.
 */

import React from "react";
import { Rows3, Columns3, Sigma, Type, CheckCircle2 } from "lucide-react";

function Tile({ icon: IconComp, label, value, color, sub }) {
  return (
    <div className="depth-card px-3.5 py-2.5 flex items-center gap-3 flex-1 min-w-[140px]">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
        <IconComp size={14} style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold leading-tight tabular-nums" style={{ color: "var(--text-primary)" }}>
          {value}
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          {label}{sub && <span style={{ textTransform: "none", letterSpacing: 0 }}> · {sub}</span>}
        </div>
      </div>
    </div>
  );
}

export default function StatsOverviewStrip({ rows, columns, numericCount, catCount, completeness }) {
  const compColor = completeness >= 95 ? "#00e676" : completeness >= 80 ? "#ffab40" : "#ff5252";
  return (
    <div className="flex gap-3 flex-wrap">
      <Tile icon={Rows3} label="Rows" value={rows.toLocaleString()} color="#40c4ff" />
      <Tile icon={Columns3} label="Columns" value={columns} color="#7c9eff" />
      <Tile icon={Sigma} label="Numeric" value={numericCount} color="#00e676" />
      <Tile icon={Type} label="Categorical" value={catCount} color="#FEDD00" />
      <Tile icon={CheckCircle2} label="Complete" value={`${completeness.toFixed(1)}%`} color={compColor} />
    </div>
  );
}