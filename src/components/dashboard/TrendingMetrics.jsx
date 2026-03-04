import React, { useMemo } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { directionLabel, getMetricDirection, isImprovement } from "@/lib/metricSemantics";

export default function TrendingMetrics({ metrics }) {
  const trendingMetrics = useMemo(() => {
    const grouped = {};
    for (const m of metrics) {
      if (!m.name || !m.year || m.value == null) continue;
      const key = `${m.name}||${m.region || "BC"}`;
      if (!grouped[key]) {
        grouped[key] = {
          name: m.name,
          category: m.category,
          region: m.region || "BC",
          direction: getMetricDirection(m),
          values: [],
        };
      }
      grouped[key].values.push({ year: Number(m.year), value: Number(m.value) });
    }

    return Object.values(grouped)
      .map((series) => {
        const sorted = series.values.sort((a, b) => a.year - b.year);
        if (sorted.length < 2) return null;
        const recent = sorted[sorted.length - 1].value;
        const previous = sorted[sorted.length - 2].value;
        const change = recent - previous;
        const changePercent = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0;
        const improving = isImprovement(change, series.direction);
        return {
          ...series,
          change,
          changePercent,
          recent,
          previous,
          improving,
          directionKey: Math.abs(change) < 1e-12 ? "flat" : improving ? "improving" : "worsening",
        };
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 6);
  }, [metrics]);

  return (
    <div className="dashboard-widget-card">
      <div className="dashboard-section-label mb-3">Trending Metrics</div>
      <div className="text-xs mb-4 relative z-10" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
        Largest year-over-year changes with metric-direction aware interpretation
      </div>

      {trendingMetrics.length > 0 ? (
        <div className="space-y-2.5">
          {trendingMetrics.map((m, i) => {
            const isImprovingDirection = m.directionKey === "improving";
            const isWorseningDirection = m.directionKey === "worsening";
            const iconColor = isImprovingDirection ? "#2ea043" : isWorseningDirection ? "#f85149" : "var(--text-muted)";
            const trendColor = iconColor;

            return (
              <div
                key={i}
                className="p-3 rounded-lg flex items-center gap-3"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="flex items-center justify-center shrink-0 w-8 h-8 rounded"
                  style={{
                    background: `${iconColor}18`,
                    border: `1px solid ${iconColor}33`,
                  }}
                >
                  {isImprovingDirection && <TrendingUp size={14} style={{ color: iconColor }} />}
                  {isWorseningDirection && <TrendingDown size={14} style={{ color: iconColor }} />}
                  {m.directionKey === "flat" && <Minus size={14} style={{ color: iconColor }} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }} title={m.name}>
                      {m.name}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: 8 }}>
                      {m.category?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {m.previous.toFixed(1)} → {m.recent.toFixed(1)} ({m.region})
                    </div>
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)", fontSize: 9 }}>
                    {directionLabel(m.direction)}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold" style={{ color: trendColor }}>
                    {m.changePercent > 0 ? "+" : ""}{m.changePercent.toFixed(1)}%
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 8 }}>
                    {isImprovingDirection ? "Improving" : isWorseningDirection ? "Worsening" : "Flat"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs py-8 text-center" style={{ color: "var(--text-muted)" }}>
          No trend data yet.<br />
          <span style={{ opacity: 0.6 }}>Add data with multiple years to see trends.</span>
        </div>
      )}
    </div>
  );
}
