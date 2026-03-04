import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChevronRight, MapPin, TrendingUp } from "lucide-react";

const REGION_COLORS = {
  "Northern BC": "#e6a817",
  "Interior BC": "#58a6ff",
  "Fraser": "#2ea043",
  "Vancouver Island": "#d29922",
  "Vancouver Coastal": "#a78bfa",
  "BC": "#f85149",
  "Provincial": "#40c4ff"
};

export default function RegionalPerformance({ metrics, onDrill }) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  
  const regionData = useMemo(() => {
    const regions = {};
    metrics.forEach(m => {
      if (!m.region) return;
      if (!regions[m.region]) {
        regions[m.region] = { name: m.region, count: 0, avgValue: 0, sum: 0, categories: new Set() };
      }
      regions[m.region].count++;
      regions[m.region].sum += m.value || 0;
      regions[m.region].categories.add(m.category);
    });
    
    return Object.values(regions)
      .map(r => ({
        ...r,
        avgValue: parseFloat((r.sum / r.count).toFixed(1)),
        categories: r.categories.size,
        color: REGION_COLORS[r.name] || "#888"
      }))
      .sort((a, b) => b.avgValue - a.avgValue);
  }, [metrics]);

  const topRegion = regionData[0];
  const drillMetrics = selectedRegion 
    ? metrics.filter(m => m.region === selectedRegion).slice(0, 8)
    : [];

  return (
    <div className="dashboard-widget-card">
      <div className="dashboard-section-label mb-3">Regional Health Leaders</div>
      <div className="text-xs mb-4 relative z-10" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
        Top-performing regions by average health indicator values
      </div>

      {/* Main chart */}
      {regionData.length > 0 ? (
        <div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={regionData} margin={{ left: 5, right: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: "var(--text-secondary)", fontSize: 10 }} 
              />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 500 }} />
              <Tooltip
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "12px", fontSize: 11, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
                labelStyle={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: "var(--text-secondary)" }}
                cursor={{ fill: "rgba(254,221,0,0.04)" }}
                formatter={(value, name) => {
                  if (name === "avgValue") return [value.toFixed(1), "Avg Value"];
                  return [value, name];
                }}
              />
              <Bar 
                dataKey="avgValue" 
                radius={[8, 8, 0, 0]}
                onClick={(data) => setSelectedRegion(data.name)}
                style={{ cursor: "pointer" }}>
                {regionData.map((d, i) => (
                  <Cell 
                    key={i} 
                    fill={d.color}
                    opacity={selectedRegion === d.name ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Top region highlight */}
          {topRegion && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={12} style={{ color: topRegion.color }} />
                <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Top Region: {topRegion.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: 9 }}>Avg Value</div>
                  <div style={{ color: topRegion.color, fontWeight: 700 }}>{topRegion.avgValue}</div>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: 9 }}>Metrics</div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{topRegion.count}</div>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: 9 }}>Categories</div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{topRegion.categories}</div>
                </div>
              </div>
            </div>
          )}

          {/* Drill-down panel */}
          {selectedRegion && drillMetrics.length > 0 && (
            <div className="mt-3 p-3 rounded-lg" style={{ background: "rgba(254,221,0,0.03)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent-primary)" }}>Top Metrics: {selectedRegion}</span>
                <button 
                  onClick={() => setSelectedRegion(null)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ background: "var(--bg-overlay)", color: "var(--text-muted)" }}>
                  Clear
                </button>
              </div>
              <div className="space-y-1.5">
                {drillMetrics.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded" style={{ background: "var(--bg-overlay)" }}>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }} title={m.name}>{m.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{m.category?.replace(/_/g, " ")}</div>
                    </div>
                    <div className="text-xs font-bold ml-2 shrink-0" style={{ color: "var(--accent-primary)" }}>{m.value.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-xs" style={{ color: "var(--text-muted)" }}>
          No regional data available
        </div>
      )}
    </div>
  );
}