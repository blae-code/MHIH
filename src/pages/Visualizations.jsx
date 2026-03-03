import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Plus, Download, Trash2, RefreshCw, BarChart3, LineChartIcon, PieChartIcon, TrendingUp } from "lucide-react";

const COLORS = ["#e6a817", "#58a6ff", "#2ea043", "#d29922", "#f85149", "#a78bfa", "#34d399"];
const CHART_TYPES = [
  { value: "bar", label: "Bar", icon: BarChart3 },
  { value: "line", label: "Line", icon: LineChartIcon },
  { value: "area", label: "Area", icon: TrendingUp },
  { value: "pie", label: "Pie", icon: PieChartIcon },
];

export default function Visualizations() {
  const { addLog } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar");
  const [groupBy, setGroupBy] = useState("category");
  const [filterCat, setFilterCat] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  useEffect(() => {
    base44.entities.HealthMetric.list("-year", 500)
      .then(data => { setMetrics(data); addLog("success", `${data.length} metrics loaded for visualization`); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  }, []);

  // Build chart data
  const filtered = metrics.filter(m => {
    const okCat = filterCat === "all" || m.category === filterCat;
    const okReg = filterRegion === "all" || m.region === filterRegion;
    const okYr = filterYear === "all" || String(m.year) === filterYear;
    return okCat && okReg && okYr && m.value != null;
  });

  const chartData = filtered.reduce((acc, m) => {
    const key = groupBy === "category" ? m.category?.replace(/_/g," ")
      : groupBy === "region" ? m.region
      : groupBy === "year" ? String(m.year)
      : m.name;
    const found = acc.find(a => a.name === key);
    if (found) { found.value += m.value; found.count++; found.avg = found.value / found.count; }
    else acc.push({ name: key, value: m.value, count: 1, avg: m.value });
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 20);

  const years = [...new Set(metrics.map(m => m.year))].filter(Boolean).sort((a,b)=>b-a);
  const cats = [...new Set(metrics.map(m => m.category))].filter(Boolean);
  const regions = [...new Set(metrics.map(m => m.region))].filter(Boolean);

  const tooltipStyle = { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: 12 };

  const renderChart = () => {
    if (chartData.length === 0) return (
      <div className="flex flex-col items-center justify-center h-64" style={{ color: "var(--text-muted)" }}>
        <BarChart3 size={32} className="mb-3 opacity-30" />
        <p className="text-sm">No data matches the current filters.</p>
      </div>
    );

    if (chartType === "pie") return (
      <ResponsiveContainer width="100%" height={360}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={130} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
            labelLine={{ stroke: "var(--text-muted)" }}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }} />
        </PieChart>
      </ResponsiveContainer>
    );

    if (chartType === "line") return (
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="value" stroke="#e6a817" strokeWidth={2} dot={{ fill: "#e6a817", r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    );

    if (chartType === "area") return (
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e6a817" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#e6a817" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="value" stroke="#e6a817" fill="url(#colorVal)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    );

    return (
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" radius={[3,3,0,0]}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const handleExportSVG = () => {
    const svg = document.querySelector(".recharts-wrapper svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "metis_health_chart.svg"; a.click();
    addLog("success", "Chart exported as SVG");
  };

  return (
    <div className="flex flex-col h-full overflow-auto p-5 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Visualizations</h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Build and explore charts from Métis health metrics</p>
        </div>
        <button onClick={handleExportSVG}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          <Download size={12} /> Export SVG
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center p-3 rounded-lg"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        {/* Chart type */}
        <div className="flex items-center gap-1">
          {CHART_TYPES.map(ct => (
            <button key={ct.value} onClick={() => setChartType(ct.value)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs"
              style={{
                background: chartType === ct.value ? "var(--accent-primary)" : "var(--bg-overlay)",
                color: chartType === ct.value ? "#000" : "var(--text-secondary)",
                fontWeight: chartType === ct.value ? 600 : 400,
              }}>
              <ct.icon size={12} />
              {ct.label}
            </button>
          ))}
        </div>
        <div className="w-px h-5" style={{ background: "var(--border-subtle)" }} />
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Group by</span>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
            className="text-xs px-2 py-1 rounded outline-none"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
            <option value="category">Category</option>
            <option value="region">Region</option>
            <option value="year">Year</option>
            <option value="name">Metric Name</option>
          </select>
        </div>
        <div className="w-px h-5" style={{ background: "var(--border-subtle)" }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="text-xs px-2 py-1 rounded outline-none"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          <option value="all">All Categories</option>
          {cats.map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
        </select>
        <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
          className="text-xs px-2 py-1 rounded outline-none"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          <option value="all">All Regions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
          className="text-xs px-2 py-1 rounded outline-none"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          <option value="all">All Years</option>
          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>

      {/* Chart */}
      <div className="metric-card flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            {groupBy === "category" ? "Health Metrics by Category"
              : groupBy === "region" ? "Health Metrics by Region"
              : groupBy === "year" ? "Health Metrics by Year"
              : "Health Metrics by Name"}
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{filtered.length} data points</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64 gap-2" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={16} className="animate-spin" />
          </div>
        ) : renderChart()}
      </div>

      {/* Summary table */}
      {chartData.length > 0 && (
        <div className="metric-card overflow-x-auto">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Data Table</div>
          <table className="w-full data-table text-xs">
            <thead>
              <tr>
                <th className="text-left">{groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</th>
                <th className="text-right">Total Value</th>
                <th className="text-right">Count</th>
                <th className="text-right">Average</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map(row => (
                <tr key={row.name}>
                  <td style={{ color: "var(--text-primary)" }}>{row.name}</td>
                  <td className="text-right font-mono" style={{ color: "var(--accent-primary)" }}>{row.value.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                  <td className="text-right" style={{ color: "var(--text-secondary)" }}>{row.count}</td>
                  <td className="text-right font-mono" style={{ color: "var(--text-secondary)" }}>{row.avg.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}