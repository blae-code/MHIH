import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export default function HealthTrendTracker({ metrics, trackedMetricIds }) {
  // Calculate individual metric trends
  const trends = useMemo(() => {
    let metricsToAnalyze = metrics;
    
    if (trackedMetricIds && trackedMetricIds.length > 0) {
      metricsToAnalyze = metrics.filter(m => trackedMetricIds.includes(m.id));
    }

    // Group by metric name and calculate year-over-year change
    const metricsByName = {};
    metricsToAnalyze.forEach(m => {
      if (!m.name || !m.year) return;
      if (!metricsByName[m.name]) {
        metricsByName[m.name] = { 
          name: m.name, 
          category: m.category,
          region: m.region,
          values: [],
          hasComparison: false
        };
      }
      metricsByName[m.name].values.push({ year: m.year, value: m.value, comparison: m.comparison_value });
      if (m.comparison_value != null) metricsByName[m.name].hasComparison = true;
    });

    // Calculate trend direction and disparity
    const allTrends = Object.values(metricsByName)
      .map(m => {
        const sorted = m.values.sort((a, b) => a.year - b.year);
        if (sorted.length < 2) return null;
        
        const recent = sorted[sorted.length - 1];
        const previous = sorted[sorted.length - 2];
        const change = recent.value - previous.value;
        const changePercent = previous.value !== 0 ? ((change / previous.value) * 100) : 0;
        
        // Calculate current disparity if comparison available
        const currentDisparity = recent.comparison != null ? recent.value - recent.comparison : null;
        const disparityTrend = currentDisparity != null && previous.comparison != null 
          ? (currentDisparity - (previous.value - previous.comparison))
          : null;

        return {
          ...m,
          change,
          changePercent,
          recent: recent.value,
          currentDisparity,
          disparityTrend,
          isImproving: change > 0,
          isAtRisk: change < 0 || (currentDisparity != null && currentDisparity > 5)
        };
      })
      .filter(Boolean);

    // Separate positive and risk trends
    const positivetrends = allTrends
      .filter(t => t.isImproving)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 3);

    const riskTrends = allTrends
      .filter(t => t.isAtRisk)
      .sort((a, b) => {
        // Prioritize by largest negative change or largest disparity
        const aScore = Math.min(a.change, a.currentDisparity || 0);
        const bScore = Math.min(b.change, b.currentDisparity || 0);
        return aScore - bScore;
      })
      .slice(0, 3);

    return { positivetrends, riskTrends };
  }, [metrics, trackedMetricIds]);

  return (
    <div className="dashboard-widget-card">
      <div className="mb-4 relative z-10">
        <div className="dashboard-section-label mb-2">Métis Health Trends</div>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          Top positive trends and highest-risk indicators
        </div>
      </div>

      {trends.positivetrends.length === 0 && trends.riskTrends.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px dashed var(--border-subtle)" }}>
          <TrendingUp size={18} style={{ color: "var(--text-muted)" }} />
          <span className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            No trend data available
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Positive Trends */}
          {trends.positivetrends.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#2ea043", letterSpacing: "0.05em" }}>
                ↑ Improving Health Outcomes
              </div>
              <div className="space-y-2">
                {trends.positivetrends.map((t, i) => (
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
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold" style={{ color: "#2ea043" }}>+{t.changePercent.toFixed(1)}%</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: "9px" }}>improvement</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Trends */}
          {trends.riskTrends.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#f85149", letterSpacing: "0.05em" }}>
                ⚠ Highest-Risk Indicators
              </div>
              <div className="space-y-2">
                {trends.riskTrends.map((t, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "rgba(255, 71, 87, 0.08)", border: "1px solid rgba(255, 71, 87, 0.2)" }}>
                    <div className="flex items-start gap-2.5">
                      <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded" style={{ background: "rgba(255, 71, 87, 0.2)" }}>
                        {t.change < 0 ? <TrendingDown size={12} style={{ color: "#f85149" }} /> : <AlertCircle size={12} style={{ color: "#f85149" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }} title={t.name}>{t.name}</div>
                        <div className="text-xs mt-1 flex gap-2 flex-wrap" style={{ color: "var(--text-muted)" }}>
                          <span>{t.category?.replace(/_/g, " ")}</span>
                          <span>•</span>
                          <span>{t.region}</span>
                        </div>
                        {t.currentDisparity != null && (
                          <div className="text-xs mt-1.5" style={{ color: "var(--color-error)", fontSize: "9px" }}>
                            {t.currentDisparity > 0 ? "+" : ""}{t.currentDisparity.toFixed(1)} worse than BC population
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold" style={{ color: "#f85149" }}>{t.changePercent.toFixed(1)}%</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: "9px" }}>decline</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}