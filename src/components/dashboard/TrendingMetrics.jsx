import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function TrendingMetrics({ metrics }) {
  const trendingMetrics = useMemo(() => {
    // Group by metric name and calculate change over years
    const metricsByName = {};
    metrics.forEach(m => {
      if (!m.name || !m.year) return;
      if (!metricsByName[m.name]) {
        metricsByName[m.name] = { name: m.name, category: m.category, values: [] };
      }
      metricsByName[m.name].values.push({ year: m.year, value: m.value });
    });

    // Calculate trend direction and magnitude
    const trends = Object.values(metricsByName)
      .map(m => {
        const sorted = m.values.sort((a, b) => a.year - b.year);
        if (sorted.length < 2) return null;
        
        const recent = sorted[sorted.length - 1].value;
        const previous = sorted[sorted.length - 2].value;
        const change = recent - previous;
        const changePercent = previous !== 0 ? ((change / previous) * 100) : 0;
        
        return {
          ...m,
          change,
          changePercent,
          recent,
          previous,
          direction: change > 0 ? "up" : change < 0 ? "down" : "flat"
        };
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 6);

    return trends;
  }, [metrics]);

  return (
    <div className="dashboard-widget-card">
      <div className="dashboard-section-label mb-3">Trending Metrics</div>
      <div className="text-xs mb-4 relative z-10" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
        Largest year-over-year changes across health indicators
      </div>

      {trendingMetrics.length > 0 ? (
        <div className="space-y-2.5">
          {trendingMetrics.map((m, i) => {
            const isPositive = m.direction === "up";
            const isNegative = m.direction === "down";
            const iconColor = isPositive ? "#f85149" : isNegative ? "#2ea043" : "var(--text-muted)";
            const trendColor = isPositive ? "#f85149" : isNegative ? "#2ea043" : "var(--text-muted)";

            return (
              <div
                key={i}
                className="p-3 rounded-lg flex items-center gap-3"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
              >
                {/* Trend icon */}
                <div
                  className="flex items-center justify-center shrink-0 w-8 h-8 rounded"
                  style={{
                    background: `${iconColor}18`,
                    border: `1px solid ${iconColor}33`
                  }}
                >
                  {isPositive && <TrendingUp size={14} style={{ color: iconColor }} />}
                  {isNegative && <TrendingDown size={14} style={{ color: iconColor }} />}
                  {m.direction === "flat" && <Minus size={14} style={{ color: iconColor }} />}
                </div>

                {/* Metric details */}
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
                      {m.previous.toFixed(1)} → {m.recent.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Trend percentage */}
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold" style={{ color: trendColor }}>
                    {m.changePercent > 0 ? "+" : ""}{m.changePercent.toFixed(1)}%
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 8 }}>
                    {isPositive ? "Higher" : isNegative ? "Lower" : "Flat"}
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