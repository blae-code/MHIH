import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  BarChart, Bar, ScatterChart, Scatter, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, Legend
} from "recharts";
import { BarChart2, TrendingUp, Grid3X3, X, ChevronDown, Check, Filter, Download, Target, ArrowUp, ArrowDown, Minus } from "lucide-react";

const COLORS = ["#e6a817", "#58a6ff", "#2ea043", "#f85149", "#a78bfa", "#d29922", "#38bdf8"];
const CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];
const REGIONS = ["BC","Northern BC","Interior BC","Fraser","Vancouver Island","Vancouver Coastal","Provincial"];

const CHART_TYPES = [
  { id: "bar", label: "Bar", icon: BarChart2 },
  { id: "line", label: "Trend", icon: TrendingUp },
  { id: "scatter", label: "Scatter", icon: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="7" cy="17" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="12" cy="12" r="2"/></svg>
  )},
  { id: "heatmap", label: "Heatmap", icon: Grid3X3 },
];

const TOOLTIP_STYLE = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-default)",
  color: "var(--text-primary)",
  fontSize: 12,
};

const TOOLTIP_LABEL_STYLE = { color: "var(--text-primary)" };
const TOOLTIP_ITEM_STYLE = { color: "var(--text-secondary)" };

const BENCHMARK_COLOR = "#a78bfa";

// ── Multi-select dropdown ─────────────────────────────────────────────────────
function MultiSelect({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
  };
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs pl-2.5 pr-2 py-1 rounded whitespace-nowrap"
        style={{ background: "var(--bg-overlay)", border: `1px solid ${selected.length ? "var(--accent-primary)" : "var(--border-subtle)"}`, color: selected.length ? "var(--accent-primary)" : "var(--text-secondary)", minWidth: 110 }}>
        <span className="flex-1 text-left truncate">
          {!selected.length ? `All ${label}s` : selected.length === 1 ? selected[0].replace(/_/g, " ") : `${selected.length} ${label}s`}
        </span>
        {selected.length > 0 && (
          <span onClick={e => { e.stopPropagation(); onChange([]); }}
            className="rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-muted)", width: 14, height: 14 }}>
            <X size={8} style={{ color: "var(--accent-primary)" }} />
          </span>
        )}
        <ChevronDown size={10} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-md shadow-xl overflow-hidden"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", minWidth: 180, top: "100%", left: 0 }}>
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map(opt => {
              const isSel = selected.includes(opt.value);
              return (
                <div key={opt.value} onClick={() => toggle(opt.value)}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs"
                  style={{ color: isSel ? "var(--text-primary)" : "var(--text-secondary)" }}
                  onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <div className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                    style={{ background: isSel ? "var(--accent-primary)" : "var(--bg-overlay)", border: `1px solid ${isSel ? "var(--accent-primary)" : "var(--border-default)"}` }}>
                    {isSel && <Check size={9} style={{ color: "#000" }} />}
                  </div>
                  <span className="truncate">{opt.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Value filter ──────────────────────────────────────────────────────────────
function ValueFilter({ op, setOp, threshold, setThreshold }) {
  return (
    <div className="flex items-center gap-1">
      <select value={op} onChange={e => setOp(e.target.value)}
        className="text-xs px-1.5 py-1 rounded appearance-none outline-none"
        style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
        <option value="any" style={{ background: "#0c1625", color: "#f0f6ff" }}>Any value</option>
        <option value="gt" style={{ background: "#0c1625", color: "#f0f6ff" }}>&gt;</option>
        <option value="gte" style={{ background: "#0c1625", color: "#f0f6ff" }}>≥</option>
        <option value="lt" style={{ background: "#0c1625", color: "#f0f6ff" }}>&lt;</option>
        <option value="lte" style={{ background: "#0c1625", color: "#f0f6ff" }}>≤</option>
        <option value="eq" style={{ background: "#0c1625", color: "#f0f6ff" }}>=</option>
      </select>
      {op !== "any" && (
        <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="0"
          className="text-xs px-2 py-1 rounded outline-none w-20"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
      )}
    </div>
  );
}

// ── Year range filter ─────────────────────────────────────────────────────────
function YearRangeFilter({ years, yearFrom, setYearFrom, yearTo, setYearTo }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <select value={yearFrom} onChange={e => setYearFrom(e.target.value)}
        className="px-1.5 py-1 rounded appearance-none outline-none"
        style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
        <option value="all" style={{ background: "#0c1625", color: "#f0f6ff" }}>From</option>
        {years.map(y => <option key={y} value={y} style={{ background: "#0c1625", color: "#f0f6ff" }}>{y}</option>)}
      </select>
      <span style={{ color: "var(--text-secondary)" }}>–</span>
      <select value={yearTo} onChange={e => setYearTo(e.target.value)}
        className="px-1.5 py-1 rounded appearance-none outline-none"
        style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
        <option value="all" style={{ background: "#0c1625", color: "#f0f6ff" }}>To</option>
        {years.map(y => <option key={y} value={y} style={{ background: "#0c1625", color: "#f0f6ff" }}>{y}</option>)}
      </select>
    </div>
  );
}

// ── Benchmark panel ───────────────────────────────────────────────────────────
function BenchmarkPanel({ metrics, allMetrics, benchmark, setBenchmark, open, setOpen }) {
  const years = useMemo(() => [...new Set(allMetrics.map(m => m.year).filter(Boolean))].sort(), [allMetrics]);

  const provincialAvg = useMemo(() => {
    const vals = metrics.filter(m => m.comparison_value != null).map(m => m.comparison_value);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [metrics]);

  const yearAvgs = useMemo(() => {
    const map = {};
    allMetrics.forEach(m => {
      if (!m.year) return;
      if (!map[m.year]) map[m.year] = { sum: 0, count: 0 };
      map[m.year].sum += m.value; map[m.year].count++;
    });
    return Object.fromEntries(Object.entries(map).map(([y, d]) => [y, d.sum / d.count]));
  }, [allMetrics]);

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
        style={{
          background: benchmark.active ? "#a78bfa22" : "var(--bg-overlay)",
          border: `1px solid ${benchmark.active ? BENCHMARK_COLOR : "var(--border-subtle)"}`,
          color: benchmark.active ? BENCHMARK_COLOR : "var(--text-muted)"
        }}>
        <Target size={10} />
        Benchmark {benchmark.active && `(${benchmark.value?.toFixed(1)})`}
        <ChevronDown size={10} style={{ transform: open ? "rotate(180deg)" : "none", transition: "0.15s" }} />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 rounded-md p-3 shadow-xl space-y-2"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", minWidth: 260, right: 0 }}>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Benchmark Mode</div>

          {/* Provincial average */}
          <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text-secondary)" }}>
            <input type="radio" checked={benchmark.mode === "provincial"} onChange={() =>
              setBenchmark({ mode: "provincial", active: true, value: provincialAvg })} />
            <span>Provincial Average {provincialAvg != null ? <span style={{ color: BENCHMARK_COLOR }}>({provincialAvg.toFixed(1)})</span> : "(no data)"}</span>
          </label>

          {/* Past year */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text-secondary)" }}>
              <input type="radio" checked={benchmark.mode === "year"} onChange={() => {
                const y = benchmark.selectedYear || years[0];
                setBenchmark({ mode: "year", active: true, selectedYear: y, value: yearAvgs[y] ?? null });
              }} />
              <span>Past Year Avg</span>
            </label>
            <select
              value={benchmark.selectedYear || ""}
              onChange={e => {
                const y = e.target.value;
                setBenchmark({ mode: "year", active: true, selectedYear: y, value: yearAvgs[y] ?? null });
              }}
              className="text-xs px-1.5 py-0.5 rounded appearance-none outline-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
              {years.map(y => <option key={y} value={y} style={{ background: "#0c1625", color: "#f0f6ff" }}>{y} ({yearAvgs[y]?.toFixed(1) ?? "—"})</option>)}
            </select>
          </div>

          {/* Custom target */}
          <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text-secondary)" }}>
            <input type="radio" checked={benchmark.mode === "custom"} onChange={() =>
              setBenchmark({ ...benchmark, mode: "custom", active: true })} />
            <span>Custom Target</span>
          </label>
          {benchmark.mode === "custom" && (
            <input type="number" placeholder="Enter target value"
              value={benchmark.customValue ?? ""}
              onChange={e => setBenchmark({ ...benchmark, mode: "custom", active: true, value: parseFloat(e.target.value) || null, customValue: e.target.value })}
              className="text-xs px-2 py-1 rounded outline-none w-full"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
          )}

          {/* Clear */}
          <button onClick={() => { setBenchmark({ active: false, mode: null, value: null }); setOpen(false); }}
            className="text-xs flex items-center gap-1 mt-1"
            style={{ color: "var(--color-error)" }}>
            <X size={9} /> Remove benchmark
          </button>
        </div>
      )}
    </div>
  );
}

// ── Benchmark performance table ───────────────────────────────────────────────
function BenchmarkTable({ data, benchmark }) {
  if (!benchmark.active || benchmark.value == null) return null;
  const rows = data
    .filter(m => m.value != null)
    .map(m => ({ ...m, diff: m.value - benchmark.value, pct: ((m.value - benchmark.value) / Math.abs(benchmark.value || 1)) * 100 }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 10);

  return (
    <div className="mt-3 rounded-md overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
      <div className="px-3 py-2 text-xs font-semibold flex items-center gap-2"
      style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)" }}>
        <Target size={10} style={{ color: BENCHMARK_COLOR }} />
        Performance vs Benchmark ({benchmark.value.toFixed(1)}) — Top 10 deviations
      </div>
      <div className="overflow-auto" style={{ maxHeight: 200 }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--bg-elevated)" }}>
              {["Metric", "Category", "Value", "vs Benchmark", "%"].map(h => (
                <th key={h} className="px-3 py-1.5 text-left font-semibold" style={{ color: "var(--text-muted)", fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => {
              const isAbove = m.diff > 0;
              const isNeutral = Math.abs(m.diff) < 0.01;
              const color = isNeutral ? "var(--text-muted)" : isAbove ? "#f85149" : "#2ea043";
              return (
                <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}
                  onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <td className="px-3 py-1.5 font-medium" style={{ color: "var(--text-primary)", maxWidth: 160 }}>
                    <span className="truncate block">{m.name}</span>
                  </td>
                  <td className="px-3 py-1.5" style={{ color: "var(--text-secondary)" }}>{m.category?.replace(/_/g, " ")}</td>
                  <td className="px-3 py-1.5" style={{ color: "var(--text-primary)" }}>{m.value.toFixed(2)}</td>
                  <td className="px-3 py-1.5">
                    <span className="flex items-center gap-1 font-medium" style={{ color }}>
                      {isNeutral ? <Minus size={10} /> : isAbove ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                      {isAbove ? "+" : ""}{m.diff.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5" style={{ color }}>
                    {isAbove ? "+" : ""}{m.pct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────────
function DisparityBar({ data, drill, benchmark }) {
  const chartData = data
    .filter(m => m.comparison_value != null)
    .slice(0, 20)
    .map(m => ({
      name: m.name.length > 22 ? m.name.slice(0, 22) + "…" : m.name,
      fullName: m.name, metis: parseFloat(m.value?.toFixed(2)),
      bc: parseFloat(m.comparison_value?.toFixed(2)),
      gap: parseFloat((m.value - m.comparison_value).toFixed(2)),
      region: m.region, category: m.category, year: m.year,
    })).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

  if (!chartData.length) return <EmptyState msg="No metrics with BC comparison values." />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fill: "#8bafd4", fontSize: 10 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
          formatter={(val, name) => [val, name === "metis" ? "Métis" : "BC Population"]}
          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label} />
        <Legend formatter={n => n === "metis" ? "Métis" : "BC Population"} wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }} />
        <Bar dataKey="metis" fill="#e6a817" radius={[0, 3, 3, 0]} onClick={drill} style={{ cursor: "pointer" }} />
        <Bar dataKey="bc" fill="#58a6ff" radius={[0, 3, 3, 0]} opacity={0.7} onClick={drill} style={{ cursor: "pointer" }} />
        <ReferenceLine x={0} stroke="var(--border-default)" />
        {benchmark.active && benchmark.value != null && (
          <ReferenceLine x={benchmark.value} stroke={BENCHMARK_COLOR} strokeDasharray="5 3" strokeWidth={2}
            label={{ value: `Benchmark: ${benchmark.value.toFixed(1)}`, position: "top", fill: BENCHMARK_COLOR, fontSize: 10 }} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

function TrendLine({ data, benchmark }) {
  const yearMap = {};
  data.forEach(m => {
    if (!m.year) return;
    if (!yearMap[m.year]) yearMap[m.year] = { year: m.year, sum: 0, count: 0, bcSum: 0, bcCount: 0 };
    yearMap[m.year].sum += m.value; yearMap[m.year].count++;
    if (m.comparison_value != null) { yearMap[m.year].bcSum += m.comparison_value; yearMap[m.year].bcCount++; }
  });
  const chartData = Object.values(yearMap).sort((a, b) => a.year - b.year)
    .map(d => ({ year: d.year, metis: parseFloat((d.sum / d.count).toFixed(2)), bc: d.bcCount ? parseFloat((d.bcSum / d.bcCount).toFixed(2)) : null }));
  if (!chartData.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="year" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
        <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} formatter={(v, n) => [v, n === "metis" ? "Métis Avg" : "BC Avg"]} />
        <Legend formatter={n => n === "metis" ? "Métis Avg" : "BC Population Avg"} wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }} />
        <Line type="monotone" dataKey="metis" stroke="#e6a817" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="bc" stroke="#58a6ff" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} connectNulls />
        {benchmark.active && benchmark.value != null && (
          <ReferenceLine y={benchmark.value} stroke={BENCHMARK_COLOR} strokeDasharray="5 3" strokeWidth={2}
            label={{ value: `Benchmark: ${benchmark.value.toFixed(1)}`, position: "right", fill: BENCHMARK_COLOR, fontSize: 10 }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

function ScatterPlot({ data, drill, benchmark }) {
  const catColors = {};
  [...new Set(data.map(m => m.category))].forEach((c, i) => { catColors[c] = COLORS[i % COLORS.length]; });
  const points = data.filter(m => m.value != null && m.comparison_value != null)
    .map(m => ({ x: parseFloat(m.comparison_value?.toFixed(2)), y: parseFloat(m.value?.toFixed(2)), name: m.name, category: m.category, region: m.region, year: m.year }));
  if (!points.length) return <EmptyState msg="No metrics with BC comparison values for scatter plot." />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="x" name="BC" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} label={{ value: "BC Pop.", position: "insideBottom", offset: -4, fill: "var(--text-muted)", fontSize: 10 }} />
        <YAxis dataKey="y" name="Métis" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} label={{ value: "Métis", angle: -90, position: "insideLeft", fill: "var(--text-muted)", fontSize: 10 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} content={({ payload }) => {
          const d = payload?.[0]?.payload;
          if (!d) return null;
          return (
            <div className="rounded p-2 text-xs" style={TOOLTIP_STYLE}>
              <div className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>{d.name}</div>
              <div style={{ color: "var(--text-secondary)" }}>{d.category?.replace(/_/g, " ")} · {d.region} · {d.year}</div>
              <div style={{ color: "#e6a817" }}>Métis: {d.y}</div>
              <div style={{ color: "#58a6ff" }}>BC: {d.x}</div>
              <div style={{ color: d.y > d.x ? "#f85149" : "#2ea043" }}>Gap: {(d.y - d.x).toFixed(2)}</div>
              {benchmark.active && benchmark.value != null && (
                <div style={{ color: BENCHMARK_COLOR }}>vs Benchmark: {(d.y - benchmark.value).toFixed(2)}</div>
              )}
            </div>
          );
        }} />
        <Scatter data={points} onClick={drill} style={{ cursor: "pointer" }}>
          {points.map((p, i) => <Cell key={i} fill={catColors[p.category] || "#e6a817"} fillOpacity={0.8} />)}
        </Scatter>
        {benchmark.active && benchmark.value != null && (
          <ReferenceLine y={benchmark.value} stroke={BENCHMARK_COLOR} strokeDasharray="5 3" strokeWidth={2}
            label={{ value: `Benchmark: ${benchmark.value.toFixed(1)}`, position: "right", fill: BENCHMARK_COLOR, fontSize: 10 }} />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function Heatmap({ metrics, benchmark }) {
  const cats = CATEGORIES.filter(c => metrics.some(m => m.category === c));
  const regs = REGIONS.filter(r => metrics.some(m => m.region === r));
  const grid = useMemo(() => {
    const map = {};
    metrics.forEach(m => {
      const key = `${m.region}||${m.category}`;
      if (!map[key]) map[key] = { sum: 0, count: 0 };
      map[key].sum += m.value; map[key].count++;
    });
    return map;
  }, [metrics]);
  const vals = Object.values(grid).map(v => v.sum / v.count).filter(Boolean);
  const min = Math.min(...vals), max = Math.max(...vals);
  const color = (val) => {
    if (!val) return "var(--bg-overlay)";
    const t = (val - min) / (max - min || 1);
    if (t < 0.5) return `rgba(46, 160, 67, ${0.3 + t * 0.7})`;
    return `rgba(${Math.round(230 + (t - 0.5) * 2 * 18)}, ${Math.round(168 - (t - 0.5) * 2 * 168)}, 23, ${0.4 + (t - 0.5) * 0.6})`;
  };
  if (!cats.length || !regs.length) return <EmptyState />;
  return (
    <div className="overflow-auto" style={{ maxHeight: 280 }}>
      <table className="text-xs border-collapse" style={{ minWidth: 400 }}>
        <thead>
          <tr>
            <th className="px-2 py-1 text-left sticky left-0" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: 10 }}>Region \ Category</th>
            {cats.map(c => <th key={c} className="px-2 py-1 text-center" style={{ color: "var(--text-muted)", fontSize: 9, whiteSpace: "nowrap" }}>{c.replace(/_/g, " ")}</th>)}
          </tr>
        </thead>
        <tbody>
          {regs.map(reg => (
            <tr key={reg}>
              <td className="px-2 py-1 sticky left-0 font-medium" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{reg}</td>
              {cats.map(cat => {
                const cell = grid[`${reg}||${cat}`];
                const avg = cell ? (cell.sum / cell.count) : null;
                const isBelowBench = benchmark.active && benchmark.value != null && avg != null && avg < benchmark.value;
                return (
                  <td key={cat} className="px-1 py-1 text-center" title={avg ? `${reg} / ${cat}: ${avg.toFixed(1)}${benchmark.active && benchmark.value != null ? ` (benchmark: ${benchmark.value.toFixed(1)})` : ""}` : "No data"}>
                    <div className="rounded mx-auto flex items-center justify-center relative"
                      style={{ background: color(avg), width: 52, height: 28, color: "var(--text-primary)", fontSize: 10, outline: isBelowBench ? `2px solid ${BENCHMARK_COLOR}` : "none" }}>
                      {avg ? avg.toFixed(1) : "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {benchmark.active && benchmark.value != null && (
        <div className="mt-2 text-xs flex items-center gap-1.5" style={{ color: BENCHMARK_COLOR }}>
          <div className="w-3 h-3 rounded-sm" style={{ outline: `2px solid ${BENCHMARK_COLOR}` }} />
          Cells below benchmark ({benchmark.value.toFixed(1)}) are highlighted
        </div>
      )}
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div className="flex items-center justify-center h-48 text-xs text-center px-6" style={{ color: "var(--text-muted)" }}>
      {msg || "No data matches the current filters."}
    </div>
  );
}

function DrillPanel({ metric, onClose, benchmark, allMetrics }) {
  if (!metric) return null;

  const gap = metric.comparison_value != null ? (metric.value - metric.comparison_value) : null;
  const benchDiff = benchmark.active && benchmark.value != null ? ((metric.metis ?? metric.value) - benchmark.value) : null;

  // Get historical data for this specific metric (same name, region, category)
  const historicalData = useMemo(() => {
    if (!allMetrics) return [];
    return allMetrics
      .filter(m => m.name === metric.name && m.region === metric.region && m.category === metric.category)
      .sort((a, b) => a.year - b.year)
      .map(m => ({ year: m.year, value: m.value, comparison: m.comparison_value }));
  }, [metric, allMetrics]);

  // Calculate historical average and trend
  const histAvg = historicalData.length > 0 ? historicalData.reduce((s, d) => s + d.value, 0) / historicalData.length : null;
  const histChange = historicalData.length >= 2 
    ? historicalData[historicalData.length - 1].value - historicalData[0].value 
    : null;

  const exportMetricData = () => {
    const header = ["Year", "Métis Value", "BC Population", "Gap"].join(",");
    const rows = historicalData.map(d => [
      d.year,
      d.value.toFixed(2),
      d.comparison ? d.comparison.toFixed(2) : "N/A",
      d.comparison ? (d.value - d.comparison).toFixed(2) : "N/A"
    ].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${metric.name.replace(/\s+/g, "_")}_history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg p-4 mt-4 space-y-3" style={{ background: "linear-gradient(to bottom, var(--bg-overlay), rgba(254,221,0,0.03))", border: "1px solid var(--border-default)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent-primary)" }}>Metric Details</span>
        <button onClick={onClose} className="activity-icon" style={{ width: 20, height: 20 }}><X size={12} /></button>
      </div>

      {/* Metric name */}
      <div>
        <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{metric.fullName || metric.name}</div>
        <div className="text-xs mt-1 flex gap-3 flex-wrap">
          <span style={{ color: "var(--text-muted)" }}>{metric.category?.replace(/_/g, " ")}</span>
          <span style={{ color: "var(--text-muted)" }}>•</span>
          <span style={{ color: "var(--text-muted)" }}>{metric.region}</span>
        </div>
      </div>

      {/* Current snapshot */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md p-2" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ color: "var(--text-muted)", fontSize: 9, marginBottom: 2 }}>Current Year ({metric.year})</div>
          <div style={{ color: "var(--accent-primary)", fontWeight: 700 }}>{(metric.metis ?? metric.value).toFixed(2)}</div>
          {metric.comparison_value != null && (
            <div style={{ color: "var(--text-secondary)", fontSize: 9, marginTop: 2 }}>vs BC: {(metric.comparison_value).toFixed(2)}</div>
          )}
        </div>
        {gap != null && (
          <div className="rounded-md p-2" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 9, marginBottom: 2 }}>Disparity Gap</div>
            <div style={{ color: gap > 0 ? "#f85149" : "#2ea043", fontWeight: 700 }}>{gap > 0 ? "+" : ""}{gap.toFixed(2)}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 8, marginTop: 2 }}>
              {gap > 0 ? "Higher" : "Lower"} than BC
            </div>
          </div>
        )}
      </div>

      {/* Historical trend mini-chart */}
      {historicalData.length > 1 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Historical Trend
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: "var(--text-secondary)" }} />
              <YAxis tick={{ fontSize: 9, fill: "var(--text-secondary)" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="value" stroke="#e6a817" strokeWidth={2} dot={{ r: 2 }} name="Métis" />
              {historicalData.some(d => d.comparison != null) && (
                <Line type="monotone" dataKey="comparison" stroke="#58a6ff" strokeWidth={2} dot={{ r: 2 }} strokeDasharray="4 3" name="BC" connectNulls />
              )}
              {benchmark.active && benchmark.value != null && (
                <ReferenceLine y={benchmark.value} stroke={BENCHMARK_COLOR} strokeDasharray="5 3" strokeWidth={1.5} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Historical analysis */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {histAvg != null && (
          <div className="rounded-md p-2" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 9, marginBottom: 2 }}>Historical Avg</div>
            <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{histAvg.toFixed(2)}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 8, marginTop: 2 }}>
              vs Current: {((metric.value - histAvg) > 0 ? "+" : "")}{(metric.value - histAvg).toFixed(2)}
            </div>
          </div>
        )}
        {histChange != null && (
          <div className="rounded-md p-2" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 9, marginBottom: 2 }}>Total Trend</div>
            <div style={{ color: histChange > 0 ? "#2ea043" : "#f85149", fontWeight: 700 }}>
              {histChange > 0 ? "↑" : "↓"} {Math.abs(histChange).toFixed(2)}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 8, marginTop: 2 }}>
              {historicalData[0]?.year} to {historicalData[historicalData.length - 1]?.year}
            </div>
          </div>
        )}
      </div>

      {/* Benchmark deviation */}
      {benchDiff != null && (
        <div className="rounded-md p-2" style={{ background: `${BENCHMARK_COLOR}11`, border: `1px solid ${BENCHMARK_COLOR}33` }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: BENCHMARK_COLOR, marginBottom: 2 }}>vs Benchmark ({benchmark.value.toFixed(1)})</div>
          <div style={{ color: BENCHMARK_COLOR, fontWeight: 700, fontSize: 12 }}>
            {benchDiff > 0 ? "+" : ""}{benchDiff.toFixed(2)} {benchDiff > 0 ? "above" : "below"}
          </div>
        </div>
      )}

      {/* Export button */}
      {historicalData.length > 0 && (
        <button onClick={exportMetricData}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded text-xs font-medium transition-all"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          <Download size={11} style={{ color: "var(--accent-primary)" }} />
          Export Metric History
        </button>
      )}
    </div>
  );
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function exportCSV(data, filename) {
  const cols = ["name", "category", "region", "year", "value", "comparison_value", "unit", "confidence_level", "notes"];
  const header = cols.join(",");
  const rows = data.map(m => cols.map(c => {
    const val = m[c] ?? "";
    return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
  }).join(","));
  const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DisparityExplorer({ metrics }) {
  const [chartType, setChartType] = useState("bar");
  const [selCats, setSelCats] = useState([]);
  const [selRegions, setSelRegions] = useState([]);
  const [yearFrom, setYearFrom] = useState("all");
  const [yearTo, setYearTo] = useState("all");
  const [valueOp, setValueOp] = useState("any");
  const [valueThreshold, setValueThreshold] = useState("");
  const [drillItem, setDrillItem] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [benchmark, setBenchmark] = useState({ active: false, mode: null, value: null });
  const [benchmarkOpen, setBenchmarkOpen] = useState(false);
  const benchmarkRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (benchmarkRef.current && !benchmarkRef.current.contains(e.target)) setBenchmarkOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const years = useMemo(() => [...new Set(metrics.map(m => m.year).filter(Boolean))].sort(), [metrics]);

  const filtered = useMemo(() => metrics.filter(m => {
    if (selCats.length && !selCats.includes(m.category)) return false;
    if (selRegions.length && !selRegions.includes(m.region)) return false;
    if (yearFrom !== "all" && m.year < parseInt(yearFrom)) return false;
    if (yearTo !== "all" && m.year > parseInt(yearTo)) return false;
    if (valueOp !== "any" && valueThreshold !== "") {
      const t = parseFloat(valueThreshold);
      if (valueOp === "gt" && !(m.value > t)) return false;
      if (valueOp === "gte" && !(m.value >= t)) return false;
      if (valueOp === "lt" && !(m.value < t)) return false;
      if (valueOp === "lte" && !(m.value <= t)) return false;
      if (valueOp === "eq" && !(Math.abs(m.value - t) < 0.001)) return false;
    }
    return true;
  }), [metrics, selCats, selRegions, yearFrom, yearTo, valueOp, valueThreshold]);

  const activeFilterCount = [selCats.length > 0, selRegions.length > 0, yearFrom !== "all" || yearTo !== "all", valueOp !== "any"].filter(Boolean).length;
  const clearAll = () => { setSelCats([]); setSelRegions([]); setYearFrom("all"); setYearTo("all"); setValueOp("any"); setValueThreshold(""); };

  return (
    <div className="dashboard-widget-card">
      <style>{`
        .disparity-explorer-header {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .disparity-explorer-title {
          font-family: 'Sofia Sans Extra Condensed', 'Aptos Narrow', sans-serif;
          font-weight: 700;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--mnbc-yellow);
          line-height: 1.2;
        }
        .disparity-explorer-toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          row-gap: 6px;
        }
        .disparity-controls-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
          row-gap: 6px;
        }
        .disparity-chart-container {
          margin: 12px 0;
          padding: 14px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.1);
          border: 1px solid var(--border-subtle);
          line-height: 1.4;
        }
      `}</style>

      {/* Header section */}
      <div className="disparity-explorer-header">
        <div className="disparity-explorer-title">Health Disparity Explorer</div>
        
        {/* Controls toolbar */}
        <div className="disparity-explorer-toolbar">
          <button onClick={() => setFiltersOpen(o => !o)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-all"
            style={{
              background: activeFilterCount > 0 ? "rgba(254,221,0,0.12)" : "var(--bg-overlay)",
              border: `1px solid ${activeFilterCount > 0 ? "var(--accent-primary)" : "var(--border-subtle)"}`,
              color: activeFilterCount > 0 ? "var(--accent-primary)" : "var(--text-secondary)"
            }}>
            <Filter size={11} />
            <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
            <ChevronDown size={10} style={{ transform: filtersOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          <div ref={benchmarkRef} className="relative">
            <BenchmarkPanel
              metrics={filtered}
              allMetrics={metrics}
              benchmark={benchmark}
              setBenchmark={setBenchmark}
              open={benchmarkOpen}
              setOpen={setBenchmarkOpen}
            />
          </div>

          <div className="flex gap-1 border-l border-r" style={{ borderColor: "var(--border-subtle)", paddingLeft: 8, paddingRight: 8 }}>
            {CHART_TYPES.map(ct => (
              <button key={ct.id} onClick={() => { setChartType(ct.id); setDrillItem(null); }}
                className="flex items-center justify-center w-8 h-8 rounded transition-all"
                style={{
                  background: chartType === ct.id ? "rgba(254,221,0,0.12)" : "transparent",
                  color: chartType === ct.id ? "var(--accent-primary)" : "var(--text-secondary)",
                  border: `1px solid ${chartType === ct.id ? "var(--accent-primary)" : "transparent"}`
                }}
                title={ct.label}>
                <ct.icon size={13} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter panel — collapsible */}
      {filtersOpen && (
        <div className="rounded-lg p-3 mb-4 space-y-3 relative z-10" style={{ background: "rgba(254,221,0,0.03)", border: "1px solid var(--border-subtle)" }}>
          <div className="text-xs font-semibold" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Filters</div>
          <div className="disparity-controls-row">
            <MultiSelect label="Category" options={CATEGORIES.map(c => ({ value: c, label: c.replace(/_/g, " ") }))} selected={selCats} onChange={setSelCats} />
            <MultiSelect label="Region" options={REGIONS.map(r => ({ value: r, label: r }))} selected={selRegions} onChange={setSelRegions} />
            <YearRangeFilter years={years} yearFrom={yearFrom} setYearFrom={setYearFrom} yearTo={yearTo} setYearTo={setYearTo} />
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              <span>Value</span>
              <ValueFilter op={valueOp} setOp={setValueOp} threshold={valueThreshold} setThreshold={setValueThreshold} />
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs flex items-center gap-1 px-2 py-1.5 rounded font-medium transition-all"
                style={{ color: "var(--color-error)", border: "1px solid rgba(255, 23, 68, 0.3)", background: "rgba(255, 23, 68, 0.05)" }}>
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chart display */}
      <div className="disparity-chart-container relative z-10">
        {chartType === "bar" && <DisparityBar data={filtered} drill={setDrillItem} benchmark={benchmark} />}
        {chartType === "line" && <TrendLine data={filtered} benchmark={benchmark} />}
        {chartType === "scatter" && <ScatterPlot data={filtered} drill={setDrillItem} benchmark={benchmark} />}
        {chartType === "heatmap" && <Heatmap metrics={filtered} benchmark={benchmark} />}
      </div>

      {/* Benchmark performance table */}
      {<BenchmarkTable data={filtered} benchmark={benchmark} />}

      {/* Stats & actions footer */}
      <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg p-2.5" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 9, marginBottom: 4 }}>Showing</div>
            <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: 13 }}>{filtered.length}/{metrics.length}</div>
          </div>
          {filtered.some(m => m.comparison_value != null) && (() => {
            const withGap = filtered.filter(m => m.comparison_value != null);
            const avgGap = withGap.reduce((s, m) => s + (m.value - m.comparison_value), 0) / withGap.length;
            return (
              <div className="rounded-lg p-2.5" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ color: "var(--text-muted)", fontSize: 9, marginBottom: 4 }}>Avg Gap</div>
                <div style={{ color: avgGap > 0 ? "#f85149" : "#2ea043", fontWeight: 700, fontSize: 13 }}>
                  {avgGap > 0 ? "+" : ""}{avgGap.toFixed(2)}
                </div>
              </div>
            );
          })()}
          {benchmark.active && benchmark.value != null && (
            <div className="rounded-lg p-2.5" style={{ background: "var(--bg-overlay)", border: `1px solid ${BENCHMARK_COLOR}33` }}>
              <div style={{ color: "var(--text-muted)", fontSize: 9, marginBottom: 4 }}>Benchmark</div>
              <div style={{ color: BENCHMARK_COLOR, fontWeight: 700, fontSize: 13 }}>{benchmark.value.toFixed(1)}</div>
            </div>
          )}
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <button onClick={() => exportCSV(filtered, "health_metrics_filtered.csv")}
            className="flex items-center justify-center gap-1.5 flex-1 px-2.5 py-2 rounded text-xs font-medium transition-all"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <Download size={11} style={{ color: "var(--accent-primary)" }} />
            <span>Filtered</span>
          </button>
          <button onClick={() => exportCSV(metrics, "health_metrics_all.csv")}
            className="flex items-center justify-center gap-1.5 flex-1 px-2.5 py-2 rounded text-xs font-medium transition-all"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <Download size={11} />
            <span>All Data</span>
          </button>
        </div>
      </div>

      {/* Drill-down panel */}
      <DrillPanel metric={drillItem} onClose={() => setDrillItem(null)} benchmark={benchmark} allMetrics={metrics} />
    </div>
  );
}