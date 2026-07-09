/**
 * CategoricalStatCard — per-column widget with proportional bars for
 * the most frequent category values.
 */

import React from "react";

const BAR_COLORS = ["#FEDD00", "#40c4ff", "#00e676", "#ff9e40", "#e040fb", "#7c9eff"];

export default function CategoricalStatCard({ name, stats }) {
  const total = stats.count || 1;
  const shown = stats.topValues.slice(0, 6);
  const shownSum = shown.reduce((a, [, c]) => a + c, 0);
  const otherCount = total - shownSum;

  return (
    <div className="depth-card p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }} title={name}>{name}</span>
        <span style={{
          fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase",
          letterSpacing: "0.06em", color: "#FEDD00", background: "rgba(254,221,0,0.08)", border: "1px solid rgba(254,221,0,0.25)",
        }}>cat</span>
        <span className="ml-auto tabular-nums" style={{ fontSize: 10, color: stats.missing > 0 ? "#ffab40" : "var(--text-muted)" }}>
          {stats.unique} unique{stats.missing > 0 ? ` · ${stats.missing} missing` : ""}
        </span>
      </div>

      <div className="space-y-1.5">
        {shown.map(([val, count], i) => {
          const p = (count / total) * 100;
          const color = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5" style={{ fontSize: 10.5 }}>
                <span className="truncate pr-2" style={{ color: "var(--text-secondary)", maxWidth: "70%" }} title={val}>{val}</span>
                <span className="tabular-nums shrink-0" style={{ color: "var(--text-muted)" }}>
                  {count.toLocaleString()} · {p.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "var(--bg-overlay)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.max(p, 1.5)}%`, background: color, opacity: 0.8 }} />
              </div>
            </div>
          );
        })}
        {otherCount > 0 && (
          <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
            + {otherCount.toLocaleString()} in {stats.unique - shown.length} other value{stats.unique - shown.length === 1 ? "" : "s"}
          </div>
        )}
      </div>
    </div>
  );
}