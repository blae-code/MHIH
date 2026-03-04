import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area, Cell
} from "recharts";
import { BarChart2, TrendingUp, ScatterChart as ScatterIcon, Grid3x3, Filter } from "lucide-react";
import HeatmapChart from "@/components/viz/HeatmapChart";

const COLORS = ["#FEDD00", "#306369", "#CD7236", "#4a78c4", "#2ea043", "#B9262D", "#a78bfa"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs shadow-xl"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
      {label && <div className="font-semibold mb-1" style={{ color: "var(--accent-primary)" }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex gap-2">
          <span style={{ color: p.color }}>●</span>
          <span style={{ color: "var(--text-muted)" }}>{p.name}:</span>
          <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const CHART_TYPES = [
  { key: "bar", label: "Bar", icon: BarChart2 },
  { key: "line", label: "Time Series", icon: TrendingUp },
  { key: "area", label: "Area", icon: TrendingUp },
  { key: "scatter", label: "Scatter", icon: ScatterIcon },
  { key: "heatmap", label: "Heatmap", icon: Grid3x3 },
];

export default function MetricsChartExplorer({ metrics }) {
  const [chartType, setChartType] = useState("line");
  const [groupBy, setGroupBy] = useState("year");
  const [catFilter, setCatFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const categories = useMemo(() => ["all", ...new Set(metrics.map(m => m.category).filter(Boolean))], [metrics]);
  const regions = useMemo(() => ["all", ...new Set(metrics.map(m => m.region).filter(Boolean))], [metrics]);

  const filtered = useMemo(() => metrics.filter(m =>
    (catFilter === "all" || m.category === catFilter) &&
    (regionFilter === "all" || m.region === regionFilter)
  ), [metrics, catFilter, regionFilter]);

  // Build chart data based on groupBy
  const chartData = useMemo(() => {
    if (groupBy === "year") {
      const byYear = {};
      filtered.forEach(m => {
        if (!m.year) return;
        if (!byYear[m.year]) byYear[m.year] = { name: String(m.year) };
        byYear[m.year][m.category || "value"] = (byYear[m.year][m.category || "value"] || 0) + (m.value || 0);
      });
      return Object.values(byYear).sort((a, b) => Number(a.name) - Number(b.name));
    }
    if (groupBy === "region") {
      const byRegion = {};
      filtered.forEach(m => {
        if (!m.region) return;
        if (!byRegion[m.region]) byRegion[m.region] = { name: m.region };
        byRegion[m.region][m.category || "value"] = (byRegion[m.region][m.category || "value"] || 0) + (m.value || 0);
      });
      return Object.values(byRegion);
    }
    if (groupBy === "category") {
      const byCat = {};
      filtered.forEach(m => {
        const key = m.category || "other";
        if (!byCat[key]) byCat[key] = { name: key.replace(/_/g, " "), value: 0, count: 0 };
        byCat[key].value += m.value || 0;
        byCat[key].count += 1;
      });
      return Object.values(byCat).sort((a, b) => b.value - a.value);
    }
    return [];
  }, [filtered, groupBy]);

  const dataKeys = useMemo(() => {
    const keys = new Set();
    chartData.forEach(d => Object.keys(d).forEach(k => { if (k !== "name") keys.add(k); }));
    return [...keys].filter(k => typeof chartData[0]?.[k] === "number").slice(0, 6);
  }, [chartData]);

  // Heatmap: region x category
  const heatmapData = useMemo(() => {
    const map = {};
    filtered.forEach(m => {
      if (!m.region || !m.category) return;
      const key = `${m.region}|${m.category}`;
      if (!map[key]) map[key] = { rowKey: m.region, colKey: m.category.replace(/_/g, " "), value: 0 };
      map[key].value += m.value || 0;
    });
    return Object.values(map);
  }, [filtered]);

  const selStyle = {
    background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
    color: "var(--text-secondary)", padding: "4px 8px", borderRadius: 6, fontSize: 11, outline: "none",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-3 px-4 py-2 border-b flex-wrap shrink-0"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-1">
          {CHART_TYPES.map(ct => (
            <button key={ct.key} onClick={() => setChartType(ct.key)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
              style={{
                background: chartType === ct.key ? "var(--accent-muted)" : "var(--bg-elevated)",
                color: chartType === ct.key ? "var(--accent-primary)" : "var(--text-muted)",
                border: `1px solid ${chartType === ct.key ? "var(--accent-primary)" : "var(--border-subtle)"}`,
              }}>
              <ct.icon size={11} />
              <span>{ct.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter size={11} style={{ color: "var(--text-muted)" }} />
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={selStyle}>
            <option value="year">Group by Year</option>
            <option value="region">Group by Region</option>
            <option value="category">Group by Category</option>
          </select>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={selStyle}>
            {categories.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c.replace(/_/g, " ")}</option>)}
          </select>
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={selStyle}>
            {regions.map(r => <option key={r} value={r}>{r === "all" ? "All Regions" : r}</option>)}
          </select>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 p-4 overflow-auto" style={{ minHeight: 0 }}>
        {chartData.length === 0 && chartType !== "heatmap" ? (
          <div className="flex items-center justify-center h-full text-xs" style={{ color: "var(--text-muted)" }}>
            No data available with current filters.
          </div>
        ) : chartType === "heatmap" ? (
          <HeatmapChart data={heatmapData} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 40, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }} />
                {dataKeys.map((k, i) => (
                  <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} name={k.replace(/_/g, " ")} />
                ))}
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 40, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }} />
                {dataKeys.map((k, i) => (
                  <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} name={k.replace(/_/g, " ")} />
                ))}
              </LineChart>
            ) : chartType === "area" ? (
              <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 40, left: 8 }}>
                <defs>
                  {dataKeys.map((k, i) => (
                    <linearGradient key={k} id={`metrgrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }} />
                {dataKeys.map((k, i) => (
                  <Area key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} fill={`url(#metrgrad${i})`} strokeWidth={2} name={k.replace(/_/g, " ")} />
                ))}
              </AreaChart>
            ) : (
              <ScatterChart margin={{ top: 8, right: 16, bottom: 40, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey={dataKeys[0] || "value"} name={dataKeys[0] || "value"} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <YAxis dataKey={dataKeys[1] || dataKeys[0] || "value"} name={dataKeys[1] || "y"} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={chartData} fill={COLORS[0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Scatter>
              </ScatterChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <div className="px-4 py-1.5 border-t shrink-0 text-xs" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
        {filtered.length} metrics · {chartData.length} data points visualised
      </div>
    </div>
  );
}