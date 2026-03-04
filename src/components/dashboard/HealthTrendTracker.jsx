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
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="dashboard-section-label">Health Outcomes Trend</div>
        <div className="flex items-center gap-2">
          <Filter size={13} style={{ color: "var(--text-muted)" }} />
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="text-xs px-2 py-1 rounded-md outline-none"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}>
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-xs mb-3 relative z-10" style={{ color: "var(--text-muted)" }}>
        {trackedMetricIds && trackedMetricIds.length > 0 
          ? "Health disparity gaps for your tracked metrics" 
          : "Average health disparity between Métis and BC population"}
        <span className="block text-xs mt-1" style={{ color: "var(--text-muted)", fontSize: "10px", opacity: 0.7 }}>
          Positive values = worse Métis outcomes | Negative values = better Métis outcomes
        </span>
      </div>

      {trendData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="year" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "12px", color: "var(--text-primary)", fontSize: 11, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
              labelStyle={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600, marginBottom: 4 }}
              itemStyle={{ fontSize: 11 }}
              cursor={{ fill: "rgba(254,221,0,0.04)" }}
            />
            <Legend wrapperStyle={{ paddingTop: "12px", fontSize: 11, color: "var(--text-secondary)" }} />
            <Line 
              type="monotone" 
              dataKey="Health Disparity" 
              stroke="#FF4757" 
              strokeWidth={2.5}
              dot={{ fill: "#FF4757", r: 4 }}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="zero" 
              stroke="var(--border-subtle)" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 gap-2 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px dashed var(--border-subtle)" }}>
          <TrendingUp size={18} style={{ color: "var(--text-muted)" }} />
          <span className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            {selectedCategory ? "No trend data for this category" : "No trend data available"}
          </span>
        </div>
      )}
    </div>
  );
}