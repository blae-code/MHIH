import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../Layout";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  BarChart3, LineChartIcon, PieChartIcon, TrendingUp, Grid3X3, GitFork,
  Network, Download, RefreshCw, X, Filter, Link2, SlidersHorizontal
} from "lucide-react";
import HeatmapChart from "@/components/viz/HeatmapChart";
import SankeyChart from "@/components/viz/SankeyChart";
import NetworkGraph from "@/components/viz/NetworkGraph";
import DrillDownPanel from "@/components/viz/DrillDownPanel";
import { listAllHealthMetrics } from "@/lib/healthMetrics";

const COLORS = ["#FEDD00", "#40c4ff", "#00e676", "#a78bfa", "#ff6b6b", "#ffab40", "#34d399", "#fb923c"];

const CHART_TYPES = [
  { value: "bar", label: "Bar", icon: BarChart3 },
  { value: "line", label: "Line", icon: LineChartIcon },
  { value: "area", label: "Area", icon: TrendingUp },
  { value: "pie", label: "Pie", icon: PieChartIcon },
  { value: "heatmap", label: "Heatmap", icon: Grid3X3 },
  { value: "sankey", label: "Sankey", icon: GitFork },
  { value: "network", label: "Network", icon: Network },
];

const tooltipStyle = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-default)",
  color: "var(--text-primary)",
  fontSize: 12,
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
};

export default function Visualizations() {
  const { addLog } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar");
  const [groupBy, setGroupBy] = useState("category");
  const [filterCat, setFilterCat] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [drillDown, setDrillDown] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [linkedMode, setLinkedMode] = useState(true);

  useEffect(() => {
    listAllHealthMetrics()
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

  const handleChartClick = (data) => {
    if (!data) return;
    const name = data.name || data.activeLabel;
    if (!name) return;
    if (linkedMode) {
      if (groupBy === "category") setFilterCat(cats.find(c => c.replace(/_/g, " ") === name) || "all");
      else if (groupBy === "region") setFilterRegion(regions.find(r => r === name) || "all");
      else if (groupBy === "year") setFilterYear(name);
    }
    setDrillDown({ type: groupBy === "category" ? "category" : groupBy === "region" ? "region" : groupBy === "year" ? "year" : "name", value: groupBy === "category" ? (cats.find(c => c.replace(/_/g, " ") === name) || name) : name });
  };

  const clearFilters = () => { setFilterCat("all"); setFilterRegion("all"); setFilterYear("all"); setDrillDown(null); setActiveNode(null); };

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

  const networkData = useMemo(() => {
    const top = filtered.slice(0, 25);
    const nodes = top.map(m => ({ id: m.id, label: m.name, group: m.category, size: m.value, value: m.value }));
    const edges = [];
    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        if (top[i].category === top[j].category) edges.push({ source: top[i].id, target: top[j].id, weight: 1 });
      }
    }
    return { nodes, edges };
  }, [filtered]);

  const handleNetworkClick = (nodeId) => {
    setActiveNode(nodeId);
    const m = metrics.find(m => m.id === nodeId);
    if (m) setDrillDown({ type: "name", value: m.name });
  };

  const chartTitle = chartType === "heatmap" ? "Metric Values by Region × Category"
    : chartType === "sankey" ? "Flow: Category → Region"
    : chartType === "network" ? "Metric Relationships Network"
    : groupBy === "category" ? "Grouped by Category"
    : groupBy === "region" ? "Grouped by Region"
    : groupBy === "year" ? "Grouped by Year"
    : "Grouped by Metric Name";

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
      <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: "var(--text-muted)" }}>
        <BarChart3 size={32} className="opacity-30" />
        <p className="text-sm">No data matches the current filters.</p>
        <button onClick={clearFilters} className="text-xs px-3 py-1.5 rounded-lg"
          style={{ color: "var(--accent-primary)", background: "rgba(254,221,0,0.08)", border: "1px solid rgba(254,221,0,0.2)" }}>
          Clear filters
        </button>
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
          <Line type="monotone" dataKey="value" stroke="#FEDD00" strokeWidth={2}
            dot={{ fill: "#FEDD00", r: 5, cursor: "pointer" }}
            activeDot={{ r: 7, cursor: "pointer", fill: "#ffed4e" }} />
        </LineChart>
      </ResponsiveContainer>
    );

    if (chartType === "area") return (
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FEDD00" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#FEDD00" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="value" stroke="#FEDD00" fill="url(#colorVal)" strokeWidth={2} />
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
          <Bar dataKey="value" radius={[4, 4, 0, 0]} onClick={(d) => handleChartClick({ name: d.name })}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} cursor="pointer"
                opacity={drillDown && entry._key !== (drillDown.value?.replace(/_/g, " ")) ? 0.35 : 1} />
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
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="px-6 py-4 shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--bg-surface) 0%, #091828 50%, var(--bg-elevated) 100%)",
          borderBottom: "1px solid var(--border-default)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(64,196,255,0.1)"
        }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #40c4ff 0%, #FEDD00 50%, transparent 100%)" }} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(64,196,255,0.15) 0%, rgba(64,196,255,0.05) 100%)", border: "1px solid rgba(64,196,255,0.25)", boxShadow: "0 0 16px rgba(64,196,255,0.1)" }}>
              <BarChart3 size={16} style={{ color: "#40c4ff" }} />
            </div>
            <div>
              <div className="dashboard-section-label" style={{ marginBottom: 0, color: "#40c4ff" }}>Visualizations</div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Interactive charts with drill-down and cross-filtering</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLinkedMode(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              title="When enabled, clicking a chart element cross-filters all views"
              style={{
                background: linkedMode ? "rgba(64,196,255,0.1)" : "var(--bg-overlay)",
                border: `1px solid ${linkedMode ? "rgba(64,196,255,0.4)" : "var(--border-default)"}`,
                color: linkedMode ? "#40c4ff" : "var(--text-secondary)",
              }}>
              <Link2 size={12} /> Linked {linkedMode ? "On" : "Off"}
            </button>
            <button onClick={handleExportSVG}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "var(--border-emphasis)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
              <Download size={12} /> Export SVG
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter / Controls Bar ── */}
      <div className="px-5 py-2.5 shrink-0 flex items-center gap-3 flex-wrap"
        style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-1.5 text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
          <SlidersHorizontal size={12} />
          <span>Filters</span>
        </div>

        {/* Category filter */}
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setDrillDown(null); }}
          className="text-xs px-3 py-2 rounded-lg outline-none transition-all"
          style={{ background: "var(--bg-overlay)", border: `1px solid ${filterCat !== "all" ? "rgba(254,221,0,0.4)" : "var(--border-subtle)"}`, color: filterCat !== "all" ? "var(--accent-primary)" : "var(--text-secondary)", minWidth: 140 }}>
          <option value="all">All Categories</option>
          {cats.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
        </select>

        {/* Region filter */}
        <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setDrillDown(null); }}
          className="text-xs px-3 py-2 rounded-lg outline-none transition-all"
          style={{ background: "var(--bg-overlay)", border: `1px solid ${filterRegion !== "all" ? "rgba(254,221,0,0.4)" : "var(--border-subtle)"}`, color: filterRegion !== "all" ? "var(--accent-primary)" : "var(--text-secondary)", minWidth: 120 }}>
          <option value="all">All Regions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Year filter */}
        <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setDrillDown(null); }}
          className="text-xs px-3 py-2 rounded-lg outline-none transition-all"
          style={{ background: "var(--bg-overlay)", border: `1px solid ${filterYear !== "all" ? "rgba(254,221,0,0.4)" : "var(--border-subtle)"}`, color: filterYear !== "all" ? "var(--accent-primary)" : "var(--text-secondary)", minWidth: 100 }}>
          <option value="all">All Years</option>
          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>

        {activeFilters.length > 0 && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
            style={{ background: "rgba(255,23,68,0.08)", color: "var(--color-error)", border: "1px solid rgba(255,23,68,0.2)" }}>
            <X size={10} /> Clear
          </button>
        )}

        <div className="flex-1" />

        {/* Active filter pills */}
        {activeFilters.map((f, i) => (
          <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
            style={{ background: "rgba(254,221,0,0.08)", color: "var(--accent-primary)", border: "1px solid rgba(254,221,0,0.25)" }}>
            {f.label}
            <button onClick={f.onRemove}><X size={9} /></button>
          </span>
        ))}

        <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
          style={{ background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
          {filtered.length} data points
        </span>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-auto p-5 space-y-4">

        {/* Chart type selector + group-by */}
        <div className="flex flex-wrap gap-3 items-center px-4 py-3 rounded-xl"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-1 flex-wrap">
            {CHART_TYPES.map(ct => (
              <button key={ct.value} onClick={() => setChartType(ct.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: chartType === ct.value ? "rgba(254,221,0,0.12)" : "var(--bg-overlay)",
                  color: chartType === ct.value ? "var(--accent-primary)" : "var(--text-secondary)",
                  border: `1px solid ${chartType === ct.value ? "rgba(254,221,0,0.35)" : "transparent"}`,
                  fontWeight: chartType === ct.value ? 600 : 400,
                }}>
                <ct.icon size={12} />{ct.label}
              </button>
            ))}
          </div>

          {!["heatmap", "sankey", "network"].includes(chartType) && (
            <>
              <div className="w-px h-5 shrink-0" style={{ background: "var(--border-subtle)" }} />
              <div className="flex items-center gap-2">
                <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>Group by</span>
                <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg outline-none"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
                  <option value="category">Category</option>
                  <option value="region">Region</option>
                  <option value="year">Year</option>
                  <option value="name">Metric Name</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Chart card */}
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{chartTitle}</span>
            </div>
            {!["heatmap", "sankey", "network"].includes(chartType) && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Click bars/segments to drill down</span>
            )}
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: "var(--text-muted)" }}>
                <RefreshCw size={20} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
                <span className="text-sm">Loading chart data...</span>
              </div>
            ) : renderChart()}
          </div>
        </div>

        {/* Drill-down panel */}
        {drillDown && (
          <DrillDownPanel selection={drillDown} metrics={metrics} onClose={() => setDrillDown(null)} />
        )}

        {/* Summary table */}
        {!["heatmap", "sankey", "network"].includes(chartType) && chartData.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="dashboard-section-label" style={{ marginBottom: 0 }}>Summary Table</span>
            </div>
            <div className="overflow-x-auto">
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
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{row.name}</td>
                      <td className="text-right font-mono" style={{ color: "var(--accent-primary)", fontWeight: 600 }}>{row.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="text-right" style={{ color: "var(--text-secondary)" }}>{row.count}</td>
                      <td className="text-right font-mono" style={{ color: "var(--text-secondary)" }}>{row.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
