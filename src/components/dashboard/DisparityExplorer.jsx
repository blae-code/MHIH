import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, ScatterChart, Scatter, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, Legend
} from "recharts";
import { BarChart2, ScatterChart as ScatterIcon, TrendingUp, Grid3X3, X, ChevronDown } from "lucide-react";

const COLORS = ["#e6a817", "#58a6ff", "#2ea043", "#f85149", "#a78bfa", "#d29922", "#38bdf8"];
const CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];
const REGIONS = ["BC","Northern BC","Interior BC","Fraser","Vancouver Island","Vancouver Coastal","Provincial"];

const CHART_TYPES = [
  { id: "bar", label: "Bar", icon: BarChart2 },
  { id: "line", label: "Trend", icon: TrendingUp },
  { id: "scatter", label: "Scatter", icon: ScatterIcon },
  { id: "heatmap", label: "Heatmap", icon: Grid3X3 },
];

const TOOLTIP_STYLE = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-default)",
  color: "var(--text-primary)",
  fontSize: 12,
};

// ── Heatmap (region × category, avg value) ──────────────────────────────────
function Heatmap({ metrics, filterCat, filterRegion }) {
  const cats = filterCat !== "all" ? [filterCat] : CATEGORIES.filter(c => metrics.some(m => m.category === c));
  const regs = filterRegion !== "all" ? [filterRegion] : REGIONS.filter(r => metrics.some(m => m.region === r));

  // avg value per cell
  const grid = useMemo(() => {
    const map = {};
    metrics.forEach(m => {
      const key = `${m.region}||${m.category}`;
      if (!map[key]) map[key] = { sum: 0, count: 0 };
      map[key].sum += m.value;
      map[key].count++;
    });
    return map;
  }, [metrics]);

  const vals = Object.values(grid).map(v => v.sum / v.count).filter(Boolean);
  const min = Math.min(...vals);
  const max = Math.max(...vals);

  const color = (val) => {
    if (!val) return "var(--bg-overlay)";
    const t = (val - min) / (max - min || 1);
    // green → amber → red
    if (t < 0.5) {
      const g = Math.round(160 + t * 2 * (162 - 160));
      return `rgba(46, ${g}, 67, ${0.3 + t * 0.7})`;
    } else {
      const r = Math.round(230 + (t - 0.5) * 2 * (248 - 230));
      return `rgba(${r}, ${Math.round(168 - (t - 0.5) * 2 * 168)}, 23, ${0.4 + (t - 0.5) * 0.6})`;
    }
  };

  if (!cats.length || !regs.length) return <EmptyState />;

  return (
    <div className="overflow-auto" style={{ maxHeight: 280 }}>
      <table className="w-full text-xs border-collapse" style={{ minWidth: 400 }}>
        <thead>
          <tr>
            <th className="px-2 py-1 text-left sticky left-0" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontWeight: 600, fontSize: 10 }}>Region \ Category</th>
            {cats.map(c => (
              <th key={c} className="px-2 py-1 text-center" style={{ color: "var(--text-muted)", fontSize: 9, whiteSpace: "nowrap" }}>
                {c.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {regs.map(reg => (
            <tr key={reg}>
              <td className="px-2 py-1 sticky left-0 font-medium" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{reg}</td>
              {cats.map(cat => {
                const cell = grid[`${reg}||${cat}`];
                const avg = cell ? (cell.sum / cell.count) : null;
                return (
                  <td key={cat} className="px-1 py-1 text-center" title={avg ? `${reg} / ${cat}: ${avg.toFixed(1)}` : "No data"}>
                    <div className="rounded mx-auto flex items-center justify-center"
                      style={{ background: color(avg), width: 52, height: 28, color: "var(--text-primary)", fontSize: 10 }}>
                      {avg ? avg.toFixed(1) : "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Disparity Bar (Métis value vs BC comparison) ─────────────────────────────
function DisparityBar({ data, drill }) {
  const chartData = data
    .filter(m => m.comparison_value != null)
    .slice(0, 20)
    .map(m => ({
      name: m.name.length > 22 ? m.name.slice(0, 22) + "…" : m.name,
      fullName: m.name,
      metis: parseFloat(m.value?.toFixed(2)),
      bc: parseFloat(m.comparison_value?.toFixed(2)),
      gap: parseFloat((m.value - m.comparison_value).toFixed(2)),
      region: m.region,
      category: m.category,
      year: m.year,
    }))
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

  if (!chartData.length) return <EmptyState msg="No metrics with BC comparison values. Add comparison_value to metrics." />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(val, name) => [val, name === "metis" ? "Métis" : "BC Population"]}
          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
        />
        <Legend formatter={n => n === "metis" ? "Métis" : "BC Population"} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="metis" fill="#e6a817" radius={[0, 3, 3, 0]} onClick={drill} style={{ cursor: "pointer" }} />
        <Bar dataKey="bc" fill="#58a6ff" radius={[0, 3, 3, 0]} opacity={0.7} onClick={drill} style={{ cursor: "pointer" }} />
        <ReferenceLine x={0} stroke="var(--border-default)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Trend Line (value over years per category or region) ─────────────────────
function TrendLine({ data }) {
  const yearMap = {};
  data.forEach(m => {
    if (!m.year) return;
    if (!yearMap[m.year]) yearMap[m.year] = { year: m.year, sum: 0, count: 0, metisSum: 0, bcSum: 0, bcCount: 0 };
    yearMap[m.year].sum += m.value;
    yearMap[m.year].count++;
    if (m.comparison_value != null) { yearMap[m.year].bcSum += m.comparison_value; yearMap[m.year].bcCount++; }
  });
  const chartData = Object.values(yearMap)
    .sort((a, b) => a.year - b.year)
    .map(d => ({
      year: d.year,
      metis: parseFloat((d.sum / d.count).toFixed(2)),
      bc: d.bcCount ? parseFloat((d.bcSum / d.bcCount).toFixed(2)) : null,
    }));

  if (!chartData.length) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="year" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
        <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [v, n === "metis" ? "Métis Avg" : "BC Avg"]} />
        <Legend formatter={n => n === "metis" ? "Métis Avg" : "BC Population Avg"} wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="metis" stroke="#e6a817" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="bc" stroke="#58a6ff" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Scatter (value vs comparison_value, colored by category) ─────────────────
function ScatterPlot({ data, drill }) {
  const catColors = {};
  [...new Set(data.map(m => m.category))].forEach((c, i) => { catColors[c] = COLORS[i % COLORS.length]; });

  const points = data
    .filter(m => m.value != null && m.comparison_value != null)
    .map(m => ({ x: parseFloat(m.comparison_value?.toFixed(2)), y: parseFloat(m.value?.toFixed(2)), name: m.name, category: m.category, region: m.region, year: m.year }));

  if (!points.length) return <EmptyState msg="No metrics with BC comparison values for scatter plot." />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="x" name="BC Population" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} label={{ value: "BC Pop.", position: "insideBottom", offset: -4, fill: "var(--text-muted)", fontSize: 10 }} />
        <YAxis dataKey="y" name="Métis" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} label={{ value: "Métis", angle: -90, position: "insideLeft", fill: "var(--text-muted)", fontSize: 10 }} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          content={({ payload }) => {
            const d = payload?.[0]?.payload;
            if (!d) return null;
            return (
              <div className="rounded p-2 text-xs" style={TOOLTIP_STYLE}>
                <div className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>{d.name}</div>
                <div style={{ color: "var(--text-muted)" }}>{d.category?.replace(/_/g, " ")} · {d.region} · {d.year}</div>
                <div style={{ color: "#e6a817" }}>Métis: {d.y}</div>
                <div style={{ color: "#58a6ff" }}>BC: {d.x}</div>
                <div style={{ color: d.y > d.x ? "#f85149" : "#2ea043" }}>Gap: {(d.y - d.x).toFixed(2)}</div>
              </div>
            );
          }}
        />
        <ReferenceLine y={0} stroke="var(--border-default)" />
        <Scatter
          data={points}
          onClick={drill}
          style={{ cursor: "pointer" }}>
          {points.map((p, i) => <Cell key={i} fill={catColors[p.category] || "#e6a817"} fillOpacity={0.8} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function EmptyState({ msg }) {
  return (
    <div className="flex items-center justify-center h-48 text-xs text-center px-6" style={{ color: "var(--text-muted)" }}>
      {msg || "No data matches the current filters."}
    </div>
  );
}

// ── Drill-down panel ──────────────────────────────────────────────────────────
function DrillPanel({ metric, onClose }) {
  if (!metric) return null;
  const gap = metric.comparison_value != null ? (metric.value - metric.comparison_value) : null;
  return (
    <div className="rounded-md p-3 mt-3" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>Drill-down</span>
        <button onClick={onClose} className="activity-icon" style={{ width: 20, height: 20 }}><X size={12} /></button>
      </div>
      <div className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>{metric.fullName || metric.name}</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        {[
          ["Category", metric.category?.replace(/_/g, " ")],
          ["Region", metric.region],
          ["Year", metric.year],
          ["Métis Value", metric.metis ?? metric.value],
          ["BC Population", metric.bc ?? metric.comparison_value ?? "N/A"],
          ["Gap", gap != null ? (gap > 0 ? `+${gap.toFixed(2)} ▲ higher` : `${gap.toFixed(2)} ▼ lower`) : "N/A"],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between gap-2">
            <span style={{ color: "var(--text-muted)" }}>{label}</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({ filterCat, setFilterCat, filterRegion, setFilterRegion, filterYear, setFilterYear, years }) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {[
        { label: "Category", value: filterCat, set: setFilterCat, opts: [["all", "All Categories"], ...CATEGORIES.map(c => [c, c.replace(/_/g, " ")])] },
        { label: "Region", value: filterRegion, set: setFilterRegion, opts: [["all", "All Regions"], ...REGIONS.map(r => [r, r])] },
        { label: "Year", value: filterYear, set: setFilterYear, opts: [["all", "All Years"], ...years.map(y => [String(y), String(y)])] },
      ].map(({ label, value, set, opts }) => (
        <div key={label} className="relative flex items-center">
          <select
            value={value}
            onChange={e => set(e.target.value)}
            className="text-xs pl-2 pr-6 py-1 rounded appearance-none outline-none"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", cursor: "pointer" }}>
            {opts.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-1.5 pointer-events-none" style={{ color: "var(--text-muted)" }} />
        </div>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function DisparityExplorer({ metrics }) {
  const [chartType, setChartType] = useState("bar");
  const [filterCat, setFilterCat] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [drillItem, setDrillItem] = useState(null);

  const years = useMemo(() => [...new Set(metrics.map(m => m.year).filter(Boolean))].sort(), [metrics]);

  const filtered = useMemo(() => metrics.filter(m =>
    (filterCat === "all" || m.category === filterCat) &&
    (filterRegion === "all" || m.region === filterRegion) &&
    (filterYear === "all" || String(m.year) === filterYear)
  ), [metrics, filterCat, filterRegion, filterYear]);

  const drill = (data) => setDrillItem(data);

  return (
    <div className="metric-card">
      {/* Header + chart type switcher */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Health Disparity Explorer
        </span>
        <div className="flex gap-1">
          {CHART_TYPES.map(ct => (
            <button key={ct.id} onClick={() => { setChartType(ct.id); setDrillItem(null); }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background: chartType === ct.id ? "var(--accent-primary)" : "var(--bg-overlay)",
                color: chartType === ct.id ? "#000" : "var(--text-muted)",
                border: `1px solid ${chartType === ct.id ? "var(--accent-primary)" : "var(--border-subtle)"}`,
              }}>
              <ct.icon size={11} />
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      <FilterBar
        filterCat={filterCat} setFilterCat={setFilterCat}
        filterRegion={filterRegion} setFilterRegion={setFilterRegion}
        filterYear={filterYear} setFilterYear={setFilterYear}
        years={years}
      />

      {/* Chart */}
      {chartType === "bar" && <DisparityBar data={filtered} drill={drill} />}
      {chartType === "line" && <TrendLine data={filtered} />}
      {chartType === "scatter" && <ScatterPlot data={filtered} drill={drill} />}
      {chartType === "heatmap" && <Heatmap metrics={filtered} filterCat={filterCat} filterRegion={filterRegion} />}

      {/* Summary strip */}
      <div className="flex gap-4 mt-3 pt-3 border-t text-xs" style={{ borderColor: "var(--border-subtle)" }}>
        <span style={{ color: "var(--text-muted)" }}>Showing <span style={{ color: "var(--text-primary)" }}>{filtered.length}</span> metrics</span>
        {filtered.some(m => m.comparison_value != null) && (
          <span style={{ color: "var(--text-muted)" }}>
            Avg gap: <span style={{ color: "var(--accent-primary)" }}>
              {(filtered.filter(m => m.comparison_value != null).reduce((s, m) => s + (m.value - m.comparison_value), 0) /
                filtered.filter(m => m.comparison_value != null).length).toFixed(2)}
            </span>
          </span>
        )}
      </div>

      <DrillPanel metric={drillItem} onClose={() => setDrillItem(null)} />
    </div>
  );
}