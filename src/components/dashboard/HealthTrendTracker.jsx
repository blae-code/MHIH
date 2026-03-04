import React, { useMemo, useState } from "react";
import { AlertCircle, ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import { directionLabel, getMetricDirection, isHarmfulGap, isImprovement } from "@/lib/metricSemantics";

export default function HealthTrendTracker({ metrics, trackedMetricIds }) {
  const [expandedPositive, setExpandedPositive] = useState(false);
  const [expandedRisk, setExpandedRisk] = useState(false);

  const trends = useMemo(() => {
    let metricsToAnalyze = metrics;
    if (trackedMetricIds && trackedMetricIds.length > 0) {
      metricsToAnalyze = metrics.filter((m) => trackedMetricIds.includes(m.id));
    }

    const grouped = {};
    for (const m of metricsToAnalyze) {
      if (!m.name || !m.year || m.value == null) continue;
      const key = `${m.name}||${m.region || "BC"}`;
      if (!grouped[key]) {
        grouped[key] = {
          name: m.name,
          category: m.category,
          region: m.region,
          direction: getMetricDirection(m),
          values: [],
        };
      }
      grouped[key].values.push({
        year: Number(m.year),
        value: Number(m.value),
        comparison: m.comparison_value != null ? Number(m.comparison_value) : null,
      });
    }

    const all = Object.values(grouped)
      .map((group) => {
        const sorted = group.values.sort((a, b) => a.year - b.year);
        if (sorted.length < 2) return null;

        const recent = sorted[sorted.length - 1];
        const previous = sorted[sorted.length - 2];
        const change = recent.value - previous.value;
        const changePercent = previous.value !== 0 ? (change / Math.abs(previous.value)) * 100 : 0;
        const improving = isImprovement(change, group.direction);

        const currentGap = recent.comparison != null ? recent.value - recent.comparison : null;
        const previousGap = previous.comparison != null ? previous.value - previous.comparison : null;
        const currentHarm = currentGap != null && isHarmfulGap(currentGap, group.direction) ? Math.abs(currentGap) : 0;
        const previousHarm = previousGap != null && isHarmfulGap(previousGap, group.direction) ? Math.abs(previousGap) : 0;
        const harmfulGapDelta = currentGap != null && previousGap != null ? currentHarm - previousHarm : null;

        const worseningTrend = !improving && Math.abs(changePercent) > 0.01;
        const isAtRisk = worseningTrend || currentHarm > 0.01 || (harmfulGapDelta != null && harmfulGapDelta > 0.01);
        const riskScore = (worseningTrend ? Math.abs(changePercent) : 0) + currentHarm * 2 + Math.max(0, harmfulGapDelta || 0) * 2;

        return {
          ...group,
          change,
          changePercent,
          recent: recent.value,
          currentGap,
          harmfulGapDelta,
          improving,
          isAtRisk,
          riskScore,
        };
      })
      .filter(Boolean);

    const positiveTrends = all.filter((t) => t.improving).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    const riskTrends = all.filter((t) => t.isAtRisk).sort((a, b) => b.riskScore - a.riskScore);

    return { positiveTrends, riskTrends };
  }, [metrics, trackedMetricIds]);

  return (
    <div className="dashboard-widget-card">
      <div className="mb-4 relative z-10">
        <div className="dashboard-section-label mb-2">Métis Health Trends</div>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          Improvements and risks with metric-direction aware interpretation
        </div>
      </div>

      {trends.positiveTrends.length === 0 && trends.riskTrends.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px dashed var(--border-subtle)" }}>
          <TrendingUp size={18} style={{ color: "var(--text-muted)" }} />
          <span className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            No trend data available
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {trends.positiveTrends.length > 0 && (
            <div>
              <div className="space-y-2">
                {trends.positiveTrends.slice(0, 3).map((t, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "rgba(46, 213, 115, 0.08)", border: "1px solid rgba(46, 213, 115, 0.2)" }}>
                    <div className="flex items-start gap-2.5">
                      <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded" style={{ background: "rgba(46, 213, 115, 0.2)" }}>
                        <TrendingUp size={12} style={{ color: "#2ea043" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }} title={t.name}>{t.name}</div>
                        <div className="text-xs mt-1 flex gap-2 flex-wrap" style={{ color: "var(--text-muted)" }}>
                          <span>{t.category?.replace(/_/g, " ")}</span>
                          <span>•</span>
                          <span>{t.region}</span>
                        </div>
                        <div className="text-xs mt-1.5" style={{ color: "var(--text-muted)", fontSize: "9px" }}>
                          {directionLabel(t.direction)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold" style={{ color: "#2ea043" }}>{t.changePercent > 0 ? "+" : ""}{t.changePercent.toFixed(1)}%</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: "9px" }}>improving trend</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {trends.positiveTrends.length > 3 && (
                <div>
                  <button
                    onClick={() => setExpandedPositive(!expandedPositive)}
                    className="mt-2 w-full text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-between px-3"
                    style={{ background: "rgba(46, 213, 115, 0.05)", color: "#2ea043", border: "1px solid rgba(46, 213, 115, 0.15)" }}
                  >
                    <span>↑ {trends.positiveTrends.length - 3} more positive trends</span>
                    <ChevronDown size={11} style={{ transform: expandedPositive ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  </button>
                  {expandedPositive && (
                    <div className="mt-2 space-y-2">
                      {trends.positiveTrends.slice(3).map((t, i) => (
                        <div key={i} className="p-2.5 rounded-lg text-xs" style={{ background: "rgba(46, 213, 115, 0.04)", border: "1px solid rgba(46, 213, 115, 0.15)" }}>
                          <div className="flex items-center gap-2">
                            <TrendingUp size={10} style={{ color: "#2ea043", flexShrink: 0 }} />
                            <span className="flex-1 truncate font-medium" title={t.name}>{t.name}</span>
                            <span style={{ color: "#2ea043", fontWeight: 600, flexShrink: 0 }}>{t.changePercent > 0 ? "+" : ""}{t.changePercent.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {trends.riskTrends.length > 0 && (
            <div>
              <div className="space-y-2">
                {trends.riskTrends.slice(0, 3).map((t, i) => {
                  const harmfulGap = t.currentGap != null && isHarmfulGap(t.currentGap, t.direction);
                  return (
                    <div key={i} className="p-3 rounded-lg" style={{ background: "rgba(255, 71, 87, 0.08)", border: "1px solid rgba(255, 71, 87, 0.2)" }}>
                      <div className="flex items-start gap-2.5">
                        <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded" style={{ background: "rgba(255, 71, 87, 0.2)" }}>
                          {t.improving ? <AlertCircle size={12} style={{ color: "#f85149" }} /> : <TrendingDown size={12} style={{ color: "#f85149" }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }} title={t.name}>{t.name}</div>
                          <div className="text-xs mt-1 flex gap-2 flex-wrap" style={{ color: "var(--text-muted)" }}>
                            <span>{t.category?.replace(/_/g, " ")}</span>
                            <span>•</span>
                            <span>{t.region}</span>
                          </div>
                          {t.currentGap != null && (
                            <div className="text-xs mt-1.5" style={{ color: harmfulGap ? "var(--color-error)" : "var(--color-success)", fontSize: "9px" }}>
                              {Math.abs(t.currentGap).toFixed(2)} {harmfulGap ? "worse" : "better"} than BC baseline
                            </div>
                          )}
                          <div className="text-xs mt-1.5" style={{ color: "var(--text-muted)", fontSize: "9px" }}>
                            {directionLabel(t.direction)}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold" style={{ color: "#f85149" }}>{t.changePercent > 0 ? "+" : ""}{t.changePercent.toFixed(1)}%</div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: "9px" }}>worsening signal</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {trends.riskTrends.length > 3 && (
                <div>
                  <button
                    onClick={() => setExpandedRisk(!expandedRisk)}
                    className="mt-2 w-full text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-between px-3"
                    style={{ background: "rgba(255, 71, 87, 0.05)", color: "#f85149", border: "1px solid rgba(255, 71, 87, 0.15)" }}
                  >
                    <span>⚠ {trends.riskTrends.length - 3} more risk indicators</span>
                    <ChevronDown size={11} style={{ transform: expandedRisk ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  </button>
                  {expandedRisk && (
                    <div className="mt-2 space-y-2">
                      {trends.riskTrends.slice(3).map((t, i) => (
                        <div key={i} className="p-2.5 rounded-lg text-xs" style={{ background: "rgba(255, 71, 87, 0.04)", border: "1px solid rgba(255, 71, 87, 0.15)" }}>
                          <div className="flex items-center gap-2">
                            <TrendingDown size={10} style={{ color: "#f85149", flexShrink: 0 }} />
                            <span className="flex-1 truncate font-medium" title={t.name}>{t.name}</span>
                            <span style={{ color: "#f85149", fontWeight: 600, flexShrink: 0 }}>{t.changePercent > 0 ? "+" : ""}{t.changePercent.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
