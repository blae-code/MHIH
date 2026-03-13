/**
 * ScorecardCard — shows a KPI with current value, trend, status, and sparkline
 * Props: kpi (KPI), entry (ScorecardEntry|null), compact (bool)
 */

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import KPIStatusBadge from "./KPIStatusBadge";

function Sparkline({ history, color }) {
  if (!history || history.length < 2) return null;
  const values = history.map((h) => parseFloat(h.value)).filter((v) => !isNaN(v));
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 60;
  const H = 24;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  });

  return (
    <svg width={W} height={H} style={{ overflow: "visible", flexShrink: 0 }}>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
      {/* last point dot */}
      <circle
        cx={parseFloat(points[points.length - 1].split(",")[0])}
        cy={parseFloat(points[points.length - 1].split(",")[1])}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const TREND_COLOR = {
  improving: "#00e676",
  stable: "#ffab40",
  declining: "#ff4d4f",
};

export default function ScorecardCard({ kpi, entry, compact = false }) {
  if (!kpi) return null;
  const TrendIcon = TREND_ICON[kpi.trend] ?? Minus;
  const trendColor = TREND_COLOR[kpi.trend] ?? "#888";

  if (compact) {
    return (
      <div
        className="rounded-xl p-3"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderLeft: `3px solid ${trendColor}`,
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{kpi.title}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{kpi.category}</div>
          </div>
          <KPIStatusBadge status={kpi.status} size="sm" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
              {kpi.current}{kpi.unit !== "count" && kpi.unit !== "%" ? "" : kpi.unit === "%" ? "%" : ""}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>
              target: {kpi.target}{kpi.unit === "%" ? "%" : ""}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TrendIcon size={12} style={{ color: trendColor }} />
            <Sparkline history={kpi.history} color={trendColor} />
          </div>
        </div>
      </div>
    );
  }

  // Full mode
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderTop: `3px solid ${trendColor}`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 2 }}>
            {kpi.title}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
            {kpi.category} · {kpi.reportingCadence} · {kpi.dataSource}
          </div>
        </div>
        <KPIStatusBadge status={kpi.status} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { label: "Baseline", value: `${kpi.baseline}${kpi.unit === "%" ? "%" : ""}`, sub: kpi.baselineYear },
          { label: "Current", value: `${kpi.current}${kpi.unit === "%" ? "%" : ""}`, sub: kpi.currentYear },
          { label: "Target", value: `${kpi.target}${kpi.unit === "%" ? "%" : ""}`, sub: kpi.targetYear },
        ].map((col) => (
          <div key={col.label}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{col.label}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{col.value}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>{col.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Progress to target</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: trendColor }}>{kpi.progressPct}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "var(--bg-overlay)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, kpi.progressPct)}%`, background: trendColor, borderRadius: 2, transition: "width 0.5s" }} />
        </div>
      </div>

      {/* Trend + sparkline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1" style={{ fontSize: 11, color: trendColor }}>
          <TrendIcon size={13} />
          <span style={{ textTransform: "capitalize" }}>{kpi.trend}</span>
        </div>
        <Sparkline history={kpi.history} color={trendColor} />
      </div>

      {/* Narrative (if scorecard entry provided) */}
      {entry && (
        <div
          className="mt-3 p-2 rounded-lg"
          style={{ background: "var(--bg-overlay)", borderLeft: "2px solid #f59e0b" }}
        >
          <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 600, marginBottom: 3 }}>
            {entry.period} NARRATIVE · {entry.status.toUpperCase()}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
            {entry.narrativeExplanation}
          </p>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}>
            {entry.preparedBy}{entry.approvedBy ? ` · Approved by ${entry.approvedBy}` : " · Pending approval"}
          </div>
        </div>
      )}

      {kpi.notes && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8, fontStyle: "italic" }}>
          {kpi.notes}
        </div>
      )}
    </div>
  );
}
