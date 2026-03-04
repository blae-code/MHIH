import React, { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Filter } from "lucide-react";

export default function HealthTrendTracker({ metrics, trackedMetricIds }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Build trend data for tracked metrics or top categories
  const trendData = useMemo(() => {
    let metricsToUse = metrics;
    
    // If tracking specific metrics, use those; otherwise use all
    if (trackedMetricIds && trackedMetricIds.length > 0) {
      metricsToUse = metrics.filter(m => trackedMetricIds.includes(m.id));
    }

    // Filter by category if selected
    if (selectedCategory) {
      metricsToUse = metricsToUse.filter(m => m.category === selectedCategory);
    }

    // Group by year and calculate averages
    const yearMap = {};
    metricsToUse.forEach(m => {
      if (m.year && m.value != null) {
        if (!yearMap[m.year]) {
          yearMap[m.year] = { year: m.year, metisAvg: 0, bcAvg: 0, count: 0, metisCount: 0, bcCount: 0 };
        }
        if (m.metis_specific) {
          yearMap[m.year].metisAvg += m.value;
          yearMap[m.year].metisCount++;
        }
        if (m.comparison_value != null) {
          yearMap[m.year].bcAvg += m.comparison_value;
          yearMap[m.year].bcCount++;
        }
        yearMap[m.year].count++;
      }
    });

    return Object.values(yearMap)
      .map(d => {
        const metisAvg = d.metisCount > 0 ? d.metisAvg / d.metisCount : null;
        const bcAvg = d.bcCount > 0 ? d.bcAvg / d.bcCount : null;
        const disparity = metisAvg != null && bcAvg != null ? Math.round((metisAvg - bcAvg) * 10) / 10 : null;
        return {
          year: d.year,
          "Health Disparity": disparity,
        };
      })
      .sort((a, b) => a.year - b.year)
      .slice(-8);
  }, [metrics, trackedMetricIds, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set(metrics.map(m => m.category).filter(Boolean));
    return Array.from(set).sort();
  }, [metrics]);

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
          ? "Trends for your tracked metrics" 
          : "Average health outcomes over time"}
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
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Métis" 
              stroke="#FEDD00" 
              strokeWidth={2.5}
              dot={{ fill: "#FEDD00", r: 4 }}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="BC Population" 
              stroke="#40c4ff" 
              strokeWidth={2.5}
              dot={{ fill: "#40c4ff", r: 4 }}
              connectNulls
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