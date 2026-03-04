import React, { useState, useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Award, Filter, X, TrendingUp } from "lucide-react";

const CATEGORY_COLORS = {
  chronic_disease: "#e6a817",
  mental_health: "#58a6ff",
  substance_use: "#f85149",
  maternal_child: "#d29922",
  social_determinants: "#2ea043",
  demographics: "#a78bfa",
  mortality: "#ff6b6b",
  access_to_care: "#40c4ff",
  other: "#888"
};

export default function CategoryLeaders({ metrics }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState("value");

  const categoryStats = useMemo(() => {
    const cats = {};
    metrics.forEach(m => {
      if (!m.category) return;
      if (!cats[m.category]) {
        cats[m.category] = { name: m.category, metrics: [], sum: 0, count: 0, min: Infinity, max: -Infinity };
      }
      cats[m.category].metrics.push(m);
      cats[m.category].sum += m.value || 0;
      cats[m.category].count++;
      cats[m.category].min = Math.min(cats[m.category].min, m.value || 0);
      cats[m.category].max = Math.max(cats[m.category].max, m.value || 0);
    });

    return Object.values(cats).map(c => ({
      ...c,
      avg: parseFloat((c.sum / c.count).toFixed(1)),
      range: c.max - c.min,
      color: CATEGORY_COLORS[c.name] || "#888"
    })).sort((a, b) => b.avg - a.avg);
  }, [metrics]);

  const scatterData = useMemo(() => {
    return categoryStats.map((c, i) => ({
      x: c.count,
      y: c.avg,
      name: c.name,
      color: c.color,
      range: c.range,
      max: c.max
    }));
  }, [categoryStats]);

  const topLeaders = useMemo(() => {
    if (!selectedCategory) {
      return categoryStats.slice(0, 5);
    }
    const cat = categoryStats.find(c => c.name === selectedCategory);
    if (!cat) return [];
    
    let sorted = [...cat.metrics];
    if (sortBy === "value") {
      sorted.sort((a, b) => (b.value || 0) - (a.value || 0));
    } else if (sortBy === "disparity") {
      sorted.sort((a, b) => Math.abs((b.value || 0) - (b.comparison_value || 0)) - Math.abs((a.value || 0) - (a.comparison_value || 0)));
    }
    return sorted.slice(0, 6);
  }, [selectedCategory, categoryStats, sortBy, metrics]);

  return (
    <div className="dashboard-widget-card">
      <div className="dashboard-section-label mb-3">Category Leaders</div>
      <div className="text-xs mb-4 relative z-10" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
        Health categories ranked by average metrics and coverage
      </div>

      {scatterData.length > 0 ? (
        <div>
          {/* Scatter chart: count vs average value */}
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ left: 30, right: 30, top: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis 
                dataKey="x" 
                name="Count" 
                tick={{ fill: "var(--text-primary)", fontSize: 10, fontWeight: 600 }}
                label={{ value: "Metric Count", position: "insideBottomRight", offset: -10, fill: "var(--text-secondary)", fontSize: 10 }}
              />
              <YAxis 
                dataKey="y" 
                name="Avg Value" 
                tick={{ fill: "var(--text-primary)", fontSize: 10, fontWeight: 600 }}
                label={{ value: "Avg Value", angle: -90, position: "insideLeft", fill: "var(--text-secondary)", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "12px", fontSize: 11, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
                cursor={{ fill: "rgba(254,221,0,0.04)" }}
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                      <div style={{ color: data.color, fontWeight: 600, marginBottom: 4, fontSize: 11 }}>{data.name.replace(/_/g, " ")}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>Count: {data.x}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>Avg: {data.y.toFixed(1)}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>Range: {data.range.toFixed(1)}</div>
                    </div>
                  );
                }}
              />
              <Scatter name="Categories" data={scatterData} onClick={(data) => setSelectedCategory(data.name)} style={{ cursor: "pointer" }}>
                {scatterData.map((d, i) => (
                  <Cell 
                    key={i} 
                    fill={d.color}
                    opacity={selectedCategory === d.name ? 1 : 0.6}
                    fillOpacity={selectedCategory === d.name ? 0.9 : 0.5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Category ranking cards */}
          <div className="mt-4 space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Top Categories</div>
            {categoryStats.slice(0, 4).map((cat, i) => (
              <div
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className="p-2.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: selectedCategory === cat.name ? `${cat.color}22` : "var(--bg-overlay)",
                  border: selectedCategory === cat.name ? `1px solid ${cat.color}` : "1px solid var(--border-subtle)",
                  color: "var(--text-primary)"
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = cat.color}
                onMouseOut={e => e.currentTarget.style.borderColor = selectedCategory === cat.name ? cat.color : "var(--border-subtle)"}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Award size={12} style={{ color: cat.color, flexShrink: 0 }} />
                    <span className="text-xs font-medium truncate">{cat.name.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-xs font-bold ml-2 shrink-0" style={{ color: cat.color }}>{cat.avg.toFixed(1)}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)", fontSize: 9 }}>
                  {cat.count} metrics • Range: {cat.range.toFixed(1)}
                </div>
              </div>
            ))}
          </div>

          {/* Drill-down details */}
          {selectedCategory && topLeaders.length > 0 && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(254,221,0,0.03)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent-primary)" }}>
                  {selectedCategory.replace(/_/g, " ")} Leaders
                </span>
                <div className="flex items-center gap-1">
                  <select
                   value={sortBy}
                   onChange={e => setSortBy(e.target.value)}
                   className="text-xs px-1.5 py-0.5 rounded appearance-none outline-none"
                   style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
                   <option value="value" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>By Value</option>
                   <option value="disparity" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>By Disparity</option>
                  </select>
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="p-1 rounded"
                    style={{ background: "var(--bg-overlay)", color: "var(--text-muted)" }}
                    title="Clear selection">
                    <X size={12} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {topLeaders.map((m, i) => (
                  <div key={i} className="p-2 rounded text-xs" style={{ background: "var(--bg-overlay)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate" style={{ color: "var(--text-primary)" }} title={m.name}>{m.name}</span>
                      <span style={{ color: "var(--accent-primary)", fontWeight: 700 }}>{(m.value || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: "var(--text-muted)" }}>{m.region}</span>
                      {m.comparison_value != null && (
                        <span style={{ color: (m.value || 0) > m.comparison_value ? "var(--color-error)" : "var(--color-success)" }}>
                          {((m.value || 0) - m.comparison_value) > 0 ? "+" : ""}{((m.value || 0) - m.comparison_value).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-xs" style={{ color: "var(--text-muted)" }}>
          No category data available
        </div>
      )}
    </div>
  );
}