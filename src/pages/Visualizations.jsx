import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from "recharts";
import {
  BarChart3, LineChartIcon, PieChartIcon, TrendingUp, Grid3X3, GitFork,
  Network, Download, RefreshCw, X, Filter, Link2
} from "lucide-react";
import HeatmapChart from "@/components/viz/HeatmapChart";
import SankeyChart from "@/components/viz/SankeyChart";
import NetworkGraph from "@/components/viz/NetworkGraph";
import DrillDownPanel from "@/components/viz/DrillDownPanel";

const COLORS = ["#e6a817", "#58a6ff", "#2ea043", "#d29922", "#f85149", "#a78bfa", "#34d399", "#fb923c"];

const CHART_TYPES = [
  { value: "bar", label: "Bar", icon: BarChart3 },
  { value: "line", label: "Line", icon: LineChartIcon },
  { value: "area", label: "Area", icon: TrendingUp },
  { value: "pie", label: "Pie", icon: PieChartIcon },
  { value: "heatmap", label: "Heatmap", icon: Grid3X3 },
  { value: "sankey", label: "Sankey", icon: GitFork },
  { value: "network", label: "Network", icon: Network },
];

const tooltipStyle = { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: 12 };

export default function Visualizations() {
  const { addLog } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar");
  const [groupBy, setGroupBy] = useState("category");
  const [filterCat, setFilterCat] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [drillDown, setDrillDown] = useState(null); // { type, value }
  const [activeNode, setActiveNode] = useState(null); // for network/sankey highlight
  const [linkedMode, setLinkedMode] = useState(true); // cross-filter mode

  useEffect(() => {
    base44.entities.HealthMetric.list("-year", 500)
      .then(data => { setMetrics(data); addLog("success", `${data.length} metrics loaded`); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const years = useMemo(() => [...new Set(metrics.map(m => m.year))].filter(Boolean).sort((a, b) => b - a), [metrics]);
  const cats = useMemo(() => [...new Set(metrics.map(m => m.category))].filter(Boolean), [metrics]);
  const regions = useMemo(() => [...new Set(metrics.map(m => m.region))].filter(Boolean), [metrics]);

  const filtered = useMemo(() => metrics.filter(m => {
    const okCat = filterCat === "all" || m.category === filterCat;
    const okReg = filterRegion === "all" || m.region === filterRegion;
    const okYr = filterYear === "all" || String(m.year) === filterYear;
    return okCat && okReg && okYr && m.value != null;
  }), [metrics, filterCat, filterRegion, filterYear]);

  const chartData = useMemo(() => filtered.reduce((acc, m) => {
    const key = groupBy === "category" ? m.category?.replace(/_/g, " ")
      : groupBy === "region" ? m.region
      : groupBy === "year" ? String(m.year)
      : m.name;
    const found = acc.find(a => a.name === key);
    if (found) { found.value += m.value; found.count++; found.avg = found.value / found.count; found._key = key; }
    else acc.push({ name: key, value: m.value, count: 1, avg: m.value, _key: key });
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 20), [filtered, groupBy]);

  // Handle bar/line/pie click → drill down + cross-filter
  const handleChartClick = (data) => {
    if (!data) return;
    const name = data.name || data.activeLabel;
    if (!name) return;
    if (linkedMode) {
      // Apply as cross-filter
      if (groupBy === "category") setFilterCat(cats.find(c => c.replace(/_/g, " ") === name) || "all");
      else if (groupBy === "region") setFilterRegion(regions.find(r => r === name) || "all");
      else if (groupBy === "year") setFilterYear(name);
    }
    setDrillDown({ type: groupBy === "category" ? "category" : groupBy === "region" ? "region" : groupBy === "year" ? "year" : "name", value: groupBy === "category" ? (cats.find(c => c.replace(/_/g, " ") === name) || name) : name });
  };

  const clearFilters = () => { setFilterCat("all"); setFilterRegion("all"); setFilterYear("all"); setDrillDown(null); setActiveNode(null); };

  // Heatmap: rows = regions, cols = categories
  const heatmapData = useMemo(() => {
    const out = [];
    filtered.forEach(m => {
      if (!m.region || !m.category) return;
      const existing = out.find(d => d.rowKey === m.region && d.colKey === m.category);
      if (existing) { existing.value = (existing.value + m.value) / 2; }
      else out.push({ rowKey: m.region, colKey: m.category, value: m.value });
    });
    return out;
  }, [filtered]);

  const handleHeatmapClick = ({ row, col }) => {
    setFilterRegion(row);
    setFilterCat(col);
    setDrillDown({ type: "region", value: row });
  };

  // Sankey: category → region flows
  const sankeyData = useMemo(() => {
    const linkMap = {};
    filtered.forEach(m => {
      if (!m.category || !m.region) return;
      const key = `${m.category}|${m.region}`;
      linkMap[key] = (linkMap[key] || 0) + 1;
    });
    const links = Object.entries(linkMap).map(([k, v]) => {
      const [source, target] = k.split("|");
      return { source, target, value: v };
    });
    const nodeSet = new Set([...links.map(l => l.source), ...links.map(l => l.target)]);
    return { nodes: [...nodeSet].map(id => ({ id, label: id })), links };
  }, [filtered]);

  const handleSankeyClick = (nodeId) => {
    setActiveNode(nodeId);
    if (cats.includes(nodeId)) { setFilterCat(nodeId); setDrillDown({ type: "category", value: nodeId }); }
    else if (regions.includes(nodeId)) { setFilterRegion(nodeId); setDrillDown({ type: "region", value: nodeId }); }
  };

  // Network: metrics as nodes, edges = shared category
  const networkData = useMemo(() => {
    const top = filtered.slice(0, 25);
    const nodes = top.map(m => ({ id: m.id, label: m.name, group: m.category, size: m.value, value: m.value }));
    const edges = [];
    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        if (top[i].category === top[j].category) {
          edges.push({ source: top[i].id, target: top[j].id, weight: 1 });
        }
      }
    }
    return { nodes, edges };
  }, [filtered]);

  const handleNetworkClick = (nodeId) => {
    setActiveNode(nodeId);
    const m = metrics.find(m => m.id === nodeId);
    if (m) setDrillDown({ type: "name", value: m.name });
  };

  const renderChart = () => {
    if (chartType === "heatmap") return (
      <HeatmapChart data={heatmapData} onCellClick={handleHeatmapClick}
        activeFilter={{ row: filterRegion !== "all" ? filterRegion : null, col: filterCat !== "all" ? filterCat : null }} />
    );
    if (chartType === "sankey") return (
      <SankeyChart data={sankeyData} onNodeClick={handleSankeyClick} activeNode={activeNode} />
    );
    if (chartType === "network") return (
      <NetworkGraph nodes={networkData.nodes} edges={networkData.edges} onNodeClick={handleNetworkClick} activeNode={activeNode} />
    );

    if (chartData.length === 0) return (
      <div className="flex flex-col items-center justify-center h-64" style={{ color: "var(--text-muted)" }}>
        <BarChart3 size={32} className="mb-3 opacity-30" />
        <p className="text-sm">No data matches the current filters.</p>
        <button onClick={clearFilters} className="mt-2 text-xs" style={{ color: "var(--accent-primary)" }}>Clear filters</button>
      </div>
    );

    const commonProps = {
      data: chartData,
      onClick: (d) => { if (d?.activeLabel) handleChartClick({ name: d.activeLabel }); }
    };

    if (chartType === "pie") return (
      <ResponsiveContainer width="100%" height={360}>
        <PieChart onClick={(d) => d?.activePayload && handleChartClick({ name: d.activePayload[0]?.payload?.name })}>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={130}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: "var(--text-muted)" }}
            onClick={(d) => handleChartClick({ name: d.name })}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cursor="pointer" />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }} />
        </PieChart>
      </ResponsiveContainer>
    );

    if (chartType === "line") return (
      <ResponsiveContainer width="100%" height={360}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="value" stroke="#e6a817" strokeWidth={2} dot={{ fill: "#e6a817", r: 5, cursor: "pointer" }}
            activeDot={{ r: 7, cursor: "pointer" }} />
        </LineChart>
      </ResponsiveContainer>
    );

    if (chartType === "area") return (
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart {...commonProps}>
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

    // default: bar
    return (
      <ResponsiveContainer width="100%" height={360}>
        <BarChart {...commonProps} style={{ cursor: "pointer" }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}
            onClick={(d) => handleChartClick({ name: d.name })}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} cursor="pointer"
                opacity={drillDown && entry._key !== (drillDown.value?.replace(/_/g, " ")) ? 0.45 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const activeFilters = [
    filterCat !== "all" && { label: filterCat.replace(/_/g, " "), onRemove: () => setFilterCat("all") },
    filterRegion !== "all" && { label: filterRegion, onRemove: () => setFilterRegion("all") },
    filterYear !== "all" && { label: filterYear, onRemove: () => setFilterYear("all") },
  ].filter(Boolean);

  const handleExportSVG = () => {
    const svg = document.querySelector(".recharts-wrapper svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "metis_health_chart.svg"; a.click();
    addLog("success", "Chart exported as SVG");
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--bg-surface) 0%, #0d1f2a 50%, var(--bg-elevated) 100%)",
          borderColor: "var(--border-default)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(64,196,255,0.08)"
        }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #40c4ff 0%, #FEDD00 50%, transparent 100%)" }} />
        <div className="dashboard-section-label">Visualizations</div>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Interactive charts with drill-down and cross-filtering</p>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end flex-wrap gap-3">
        <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLinkedMode(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            title="When enabled, clicking a chart element cross-filters all views"
            style={{
              background: linkedMode ? "rgba(254,221,0,0.1)" : "var(--bg-elevated)",
              border: `1px solid ${linkedMode ? "rgba(254,221,0,0.4)" : "var(--border-default)"}`,
              color: linkedMode ? "var(--accent-primary)" : "var(--text-secondary)",
              boxShadow: linkedMode ? "0 0 12px rgba(254,221,0,0.1)" : "none"
            }}>
            <Link2 size={12} /> Linked {linkedMode ? "On" : "Off"}
          </button>
          <button onClick={handleExportSVG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
            <Download size={12} /> Export SVG
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center p-3 rounded-lg"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-1 flex-wrap">
          {CHART_TYPES.map(ct => (
            <button key={ct.value} onClick={() => setChartType(ct.value)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs"
              style={{
                background: chartType === ct.value ? "var(--accent-primary)" : "var(--bg-overlay)",
                color: chartType === ct.value ? "#000" : "var(--text-secondary)",
                fontWeight: chartType === ct.value ? 600 : 400,
              }}>
              <ct.icon size={12} />{ct.label}
            </button>
          ))}
        </div>
        {!["heatmap", "sankey", "network"].includes(chartType) && (
          <>
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
          </>
        )}
        <div className="w-px h-5" style={{ background: "var(--border-subtle)" }} />
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setDrillDown(null); }}
          className="text-xs px-2 py-1 rounded outline-none"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: filterCat !== "all" ? "var(--accent-primary)" : "var(--text-secondary)" }}>
          <option value="all">All Categories</option>
          {cats.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
        </select>
        <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setDrillDown(null); }}
          className="text-xs px-2 py-1 rounded outline-none"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: filterRegion !== "all" ? "var(--accent-primary)" : "var(--text-secondary)" }}>
          <option value="all">All Regions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setDrillDown(null); }}
          className="text-xs px-2 py-1 rounded outline-none"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: filterYear !== "all" ? "var(--accent-primary)" : "var(--text-secondary)" }}>
          <option value="all">All Years</option>
          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>
        {activeFilters.length > 0 && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{ background: "var(--color-error)", color: "#fff", opacity: 0.85 }}>
            <X size={10} /> Clear filters
          </button>
        )}
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={11} style={{ color: "var(--text-muted)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Active filters:</span>
          {activeFilters.map((f, i) => (
            <span key={i} className="flex items-center gap-1 tag" style={{ background: "var(--accent-muted)", color: "var(--accent-primary)", borderColor: "var(--accent-primary)" }}>
              {f.label}
              <button onClick={f.onRemove}><X size={9} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            {chartType === "heatmap" ? "Metric Values by Region × Category"
              : chartType === "sankey" ? "Flow: Category → Region"
              : chartType === "network" ? "Metric Relationships Network"
              : groupBy === "category" ? "By Category" : groupBy === "region" ? "By Region"
              : groupBy === "year" ? "By Year" : "By Metric Name"}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{filtered.length} data points</span>
            {!["heatmap", "sankey", "network"].includes(chartType) && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Click bars/segments to drill down</span>
            )}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64 gap-2" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={16} className="animate-spin" />
          </div>
        ) : renderChart()}
      </div>

      {/* Drill-down panel */}
      {drillDown && (
        <DrillDownPanel selection={drillDown} metrics={metrics} onClose={() => setDrillDown(null)} />
      )}

      {/* Summary table */}
      {!["heatmap", "sankey", "network"].includes(chartType) && chartData.length > 0 && (
        <div className="metric-card overflow-x-auto">
          <div className="dashboard-section-label">Data Table</div>
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
                <tr key={row.name} onClick={() => handleChartClick({ name: row.name })}
                  style={{ cursor: "pointer" }}>
                  <td style={{ color: "var(--text-primary)" }}>{row.name}</td>
                  <td className="text-right font-mono" style={{ color: "var(--accent-primary)" }}>{row.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="text-right" style={{ color: "var(--text-secondary)" }}>{row.count}</td>
                  <td className="text-right font-mono" style={{ color: "var(--text-secondary)" }}>{row.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}