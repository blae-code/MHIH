import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  BarChart, Bar, ScatterChart, Scatter, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, Legend
} from "recharts";
import {
  BarChart2, TrendingUp, Grid3X3, X, ChevronDown, Check, Filter,
  Download, Target, ArrowUp, ArrowDown, Minus
} from "lucide-react";
import {
  compareToBenchmark, directionLabel, getMetricDirection, isHarmfulGap, isImprovement
} from "@/lib/metricSemantics";

const COLORS = ["#e6a817", "#58a6ff", "#2ea043", "#f85149", "#a78bfa", "#d29922", "#38bdf8"];
const CATEGORIES = ["chronic_disease", "mental_health", "substance_use", "maternal_child", "social_determinants", "demographics", "mortality", "access_to_care", "other"];
const REGIONS = ["BC", "Northern BC", "Interior BC", "Fraser", "Vancouver Island", "Vancouver Coastal", "Provincial"];
const BENCHMARK_COLOR = "#a78bfa";

const CHART_TYPES = [
  { id: "bar",     label: "Bar Chart",   icon: BarChart2 },
  { id: "line",    label: "Trend Line",  icon: TrendingUp },
  { id: "scatter", label: "Scatter Plot", icon: ({ size }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="7" cy="17" r="2" /><circle cx="17" cy="7" r="2" /><circle cx="12" cy="12" r="2" />
    </svg>
  },
  { id: "heatmap", label: "Heatmap",     icon: Grid3X3 },
];

const TOOLTIP_STYLE = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-default)",
  color: "var(--text-primary)",
  fontSize: 12,
  padding: "8px 12px",
  borderRadius: "6px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
};
const TOOLTIP_LABEL_STYLE = { color: "var(--accent-primary)", fontWeight: 600, marginBottom: "4px" };
const TOOLTIP_ITEM_STYLE  = { color: "var(--text-primary)", fontWeight: 500 };

// ── Portal-based floating panel ───────────────────────────────────────────────
function FloatingPanel({ anchorRef, open, onClose, children, align = "left", minWidth = 200 }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (open && anchorRef.current) {
      setRect(anchorRef.current.getBoundingClientRect());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (anchorRef.current && !anchorRef.current.closest("[data-floating-panel]")?.contains(e.target)
        && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Small delay to avoid immediate close from the open click
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 10);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [open, onClose]);

  if (!open || !rect) return null;

  const style = {
    position: "fixed",
    top: rect.bottom + 6,
    zIndex: 99999,
    minWidth,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    borderRadius: 10,
    boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
    overflow: "hidden",
  };

  if (align === "right") {
    style.right = window.innerWidth - rect.right;
  } else {
    style.left = rect.left;
  }

  return (
    <div data-floating-panel="" style={style}>
      {children}
    </div>
  );
}

// ── Multi-select dropdown ─────────────────────────────────────────────────────
function MultiSelect({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef();
  const isActive = selected.length > 0;

  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs pl-2.5 pr-2 py-1.5 rounded-lg whitespace-nowrap transition-all"
        style={{
          background: isActive ? "rgba(254,221,0,0.1)" : "var(--bg-overlay)",
          border: `1px solid ${isActive ? "rgba(254,221,0,0.5)" : "var(--border-default)"}`,
          color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
          minWidth: 120,
          boxShadow: isActive ? "0 0 0 1px rgba(254,221,0,0.12)" : "none",
        }}
      >
        <span className="flex-1 text-left truncate font-medium">
          {!selected.length
            ? `All ${label}s`
            : selected.length === 1
            ? selected[0].replace(/_/g, " ")
            : `${selected.length} ${label}s`}
        </span>
        {isActive && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
            className="rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(254,221,0,0.2)", width: 15, height: 15 }}
          >
            <X size={8} style={{ color: "var(--accent-primary)" }} />
          </span>
        )}
        <ChevronDown
          size={10}
          style={{
            color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </button>

      <FloatingPanel anchorRef={btnRef} open={open} onClose={() => setOpen(false)} minWidth={200}>
        {/* Header */}
        <div className="px-3 py-2 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            {label}
          </span>
          {selected.length > 0 && (
            <button onClick={() => onChange([])} style={{ fontSize: 10, color: "var(--color-error)" }}>
              Clear all
            </button>
          )}
        </div>
        {/* Options */}
        <div style={{ maxHeight: 220, overflowY: "auto", padding: "4px 0" }}>
          {options.map((opt) => {
            const isSel = selected.includes(opt.value);
            return (
              <div
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="flex items-center gap-2.5 cursor-pointer text-xs"
                style={{ padding: "7px 12px", color: isSel ? "var(--text-primary)" : "var(--text-secondary)" }}
                onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >
                <div
                  className="flex items-center justify-center shrink-0 transition-all"
                  style={{
                    width: 16, height: 16, borderRadius: 4,
                    background: isSel ? "var(--accent-primary)" : "transparent",
                    border: `1.5px solid ${isSel ? "var(--accent-primary)" : "var(--border-default)"}`,
                  }}
                >
                  {isSel && <Check size={10} style={{ color: "#000" }} />}
                </div>
                <span className="capitalize">{opt.label}</span>
              </div>
            );
          })}
        </div>
        {/* Footer */}
        <div className="px-3 py-1.5" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
            {selected.length} of {options.length} selected
          </span>
        </div>
      </FloatingPanel>
    </div>
  );
}

// ── Value filter ──────────────────────────────────────────────────────────────
function ValueFilter({ op, setOp, threshold, setThreshold }) {
  return (
    <div className="flex items-center gap-1.5">
      <select value={op} onChange={e => setOp(e.target.value)}
        className="text-xs px-2 py-1.5 rounded-lg appearance-none outline-none"
        style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
        <option value="any" style={{ background: "#0c1625", color: "#f0f6ff" }}>Any value</option>
        <option value="gt"  style={{ background: "#0c1625", color: "#f0f6ff" }}>&gt;</option>
        <option value="gte" style={{ background: "#0c1625", color: "#f0f6ff" }}>≥</option>
        <option value="lt"  style={{ background: "#0c1625", color: "#f0f6ff" }}>&lt;</option>
        <option value="lte" style={{ background: "#0c1625", color: "#f0f6ff" }}>≤</option>
        <option value="eq"  style={{ background: "#0c1625", color: "#f0f6ff" }}>=</option>
      </select>
      {op !== "any" && (
        <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="0"
          className="text-xs px-2 py-1.5 rounded-lg outline-none w-20"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
      )}
    </div>
  );
}

// ── Year range filter ─────────────────────────────────────────────────────────
function YearRangeFilter({ years, yearFrom, setYearFrom, yearTo, setYearTo }) {
  const selStyle = { background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" };
  const optStyle = { background: "#0c1625", color: "#f0f6ff" };
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Year</span>
      <select value={yearFrom} onChange={e => setYearFrom(e.target.value)}
        className="px-2 py-1.5 rounded-lg appearance-none outline-none" style={selStyle}>
        <option value="all" style={optStyle}>From</option>
        {years.map(y => <option key={y} value={y} style={optStyle}>{y}</option>)}
      </select>
      <span style={{ color: "var(--text-muted)" }}>–</span>
      <select value={yearTo} onChange={e => setYearTo(e.target.value)}
        className="px-2 py-1.5 rounded-lg appearance-none outline-none" style={selStyle}>
        <option value="all" style={optStyle}>To</option>
        {years.map(y => <option key={y} value={y} style={optStyle}>{y}</option>)}
      </select>
    </div>
  );
}

// ── Benchmark panel ───────────────────────────────────────────────────────────
function BenchmarkPanel({ metrics, allMetrics, benchmark, setBenchmark, open, setOpen }) {
  const btnRef = useRef();
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

  const isActive = benchmark.active;

  return (
    <div>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: isActive ? "rgba(167,139,250,0.12)" : "var(--bg-overlay)",
          border: `1px solid ${isActive ? BENCHMARK_COLOR : "var(--border-default)"}`,
          color: isActive ? BENCHMARK_COLOR : "var(--text-secondary)",
          boxShadow: isActive ? `0 0 0 1px rgba(167,139,250,0.15)` : "none",
        }}
      >
        <Target size={11} />
        <span>Benchmark{isActive && benchmark.value != null ? ` (${benchmark.value.toFixed(1)})` : ""}</span>
        <ChevronDown size={10} style={{ transform: open ? "rotate(180deg)" : "none", transition: "0.15s" }} />
      </button>

      <FloatingPanel anchorRef={btnRef} open={open} onClose={() => setOpen(false)} align="left" minWidth={280}>
        {/* Header */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BENCHMARK_COLOR, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Benchmark Mode
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
            Overlay a reference line on charts
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Provincial average */}
          <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg transition-colors"
            style={{ background: benchmark.mode === "provincial" ? "rgba(167,139,250,0.08)" : "transparent",
              border: `1px solid ${benchmark.mode === "provincial" ? "rgba(167,139,250,0.3)" : "transparent"}` }}>
            <input type="radio" checked={benchmark.mode === "provincial"}
              onChange={() => setBenchmark({ mode: "provincial", active: true, value: provincialAvg })}
              style={{ accentColor: BENCHMARK_COLOR }} />
            <div>
              <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Provincial Average</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {provincialAvg != null ? <span style={{ color: BENCHMARK_COLOR }}>avg: {provincialAvg.toFixed(1)}</span> : "No comparison data"}
              </div>
            </div>
          </label>

          {/* Past year */}
          <div className="p-2 rounded-lg transition-colors"
            style={{ background: benchmark.mode === "year" ? "rgba(167,139,250,0.08)" : "transparent",
              border: `1px solid ${benchmark.mode === "year" ? "rgba(167,139,250,0.3)" : "transparent"}` }}>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" checked={benchmark.mode === "year"}
                onChange={() => {
                  const y = benchmark.selectedYear || years[0];
                  setBenchmark({ mode: "year", active: true, selectedYear: y, value: yearAvgs[y] ?? null });
                }}
                style={{ accentColor: BENCHMARK_COLOR }} />
              <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Past Year Average</div>
            </label>
            <div className="mt-2 ml-6">
              <select value={benchmark.selectedYear || ""}
                onChange={e => {
                  const y = e.target.value;
                  setBenchmark({ mode: "year", active: true, selectedYear: y, value: yearAvgs[y] ?? null });
                }}
                className="text-xs px-2 py-1.5 rounded-lg appearance-none outline-none w-full"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                {years.map(y => (
                  <option key={y} value={y} style={{ background: "#0c1625", color: "#f0f6ff" }}>
                    {y} — avg: {yearAvgs[y]?.toFixed(1) ?? "—"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom target */}
          <div className="p-2 rounded-lg"
            style={{ background: benchmark.mode === "custom" ? "rgba(167,139,250,0.08)" : "transparent",
              border: `1px solid ${benchmark.mode === "custom" ? "rgba(167,139,250,0.3)" : "transparent"}` }}>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" checked={benchmark.mode === "custom"}
                onChange={() => setBenchmark({ ...benchmark, mode: "custom", active: true })}
                style={{ accentColor: BENCHMARK_COLOR }} />
              <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Custom Target</div>
            </label>
            {benchmark.mode === "custom" && (
              <input type="number" placeholder="Enter target value"
                value={benchmark.customValue ?? ""}
                onChange={e => setBenchmark({ ...benchmark, mode: "custom", active: true, value: parseFloat(e.target.value) || null, customValue: e.target.value })}
                className="text-xs px-2 py-1.5 rounded-lg outline-none w-full mt-2 ml-6"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)", width: "calc(100% - 24px)" }} />
            )}
          </div>
        </div>

        {/* Footer — clear */}
        <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
          <button
            onClick={() => { setBenchmark({ active: false, mode: null, value: null }); setOpen(false); }}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: "var(--color-error)" }}
          >
            <X size={10} /> Remove benchmark
          </button>
        </div>
      </FloatingPanel>
    </div>
  );
}

// ── Benchmark performance table ───────────────────────────────────────────────
function BenchmarkTable({ data, benchmark }) {
  if (!benchmark.active || benchmark.value == null) return null;
  const rows = data
    .filter(m => m.value != null)
    .map(m => {
      const direction = getMetricDirection(m);
      const bench = compareToBenchmark(m.value, benchmark.value, direction);
      return { ...m, direction, diff: bench.delta, better: bench.better, pct: (bench.delta / Math.abs(benchmark.value || 1)) * 100 };
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 10);

  return (
    <div className="mt-3 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
      <div className="px-3 py-2 text-xs font-semibold flex items-center gap-2"
        style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)" }}>
        <Target size={10} style={{ color: BENCHMARK_COLOR }} />
        Performance vs Benchmark ({benchmark.value.toFixed(1)}) — top deviations
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
              const isNeutral = Math.abs(m.diff) < 0.01 || m.better == null;
              const color = isNeutral ? "var(--text-muted)" : m.better ? "#2ea043" : "#f85149";
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
                      {isNeutral ? <Minus size={10} /> : m.diff > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                      {m.diff > 0 ? "+" : ""}{m.diff.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5" style={{ color }}>
                    {m.diff > 0 ? "+" : ""}{m.pct.toFixed(1)}%
                    <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{directionLabel(m.direction)}</div>
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
  const chartData = useMemo(() => {
    return data
      .filter(m => m.comparison_value != null)
      .slice(0, 20)
      .map(m => ({
        name: m.name.length > 22 ? m.name.slice(0, 22) + "…" : m.name,
        fullName: m.name,
        metis: parseFloat(m.value?.toFixed(2)),
        bc: parseFloat(m.comparison_value?.toFixed(2)),
        gap: parseFloat((m.value - m.comparison_value).toFixed(2)),
        direction: getMetricDirection(m),
        region: m.region, category: m.category, year: m.year
      }))
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  }, [data]);

  if (!chartData.length) return <EmptyState msg="No metrics with BC comparison values." />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.3} />
        <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fill: "var(--accent-primary)", fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
          formatter={(val, name) => [val?.toFixed(2), name === "metis" ? "Métis" : "BC Population"]}
          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
          cursor={{ fill: "rgba(254,221,0,0.08)" }} />
        <Legend formatter={n => n === "metis" ? "Métis" : "BC Population"} wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
        <Bar dataKey="metis" fill="#e6a817" radius={[0, 3, 3, 0]} onClick={drill} style={{ cursor: "pointer" }} />
        <Bar dataKey="bc"    fill="#58a6ff" radius={[0, 3, 3, 0]} opacity={0.7} onClick={drill} style={{ cursor: "pointer" }} />
        <ReferenceLine x={0} stroke="var(--border-default)" />
        {benchmark.active && benchmark.value != null &&
          <ReferenceLine x={benchmark.value} stroke={BENCHMARK_COLOR} strokeDasharray="5 3" strokeWidth={2}
            label={{ value: `Benchmark: ${benchmark.value.toFixed(1)}`, position: "top", fill: BENCHMARK_COLOR, fontSize: 10 }} />}
      </BarChart>
    </ResponsiveContainer>
  );
}

function TrendLine({ data, benchmark }) {
  const chartData = useMemo(() => {
    const yearMap = {};
    data.forEach(m => {
      if (!m.year) return;
      if (!yearMap[m.year]) yearMap[m.year] = { year: m.year, sum: 0, count: 0, bcSum: 0, bcCount: 0 };
      yearMap[m.year].sum += m.value; yearMap[m.year].count++;
      if (m.comparison_value != null) { yearMap[m.year].bcSum += m.comparison_value; yearMap[m.year].bcCount++; }
    });
    return Object.values(yearMap).sort((a, b) => a.year - b.year)
      .map(d => ({ year: d.year, metis: parseFloat((d.sum / d.count).toFixed(2)), bc: d.bcCount ? parseFloat((d.bcSum / d.bcCount).toFixed(2)) : null }));
  }, [data]);

  if (!chartData.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.3} />
        <XAxis dataKey="year" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
        <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
          formatter={(v, n) => [v?.toFixed(2), n === "metis" ? "Métis Avg" : "BC Avg"]}
          cursor={{ fill: "rgba(254,221,0,0.08)" }} />
        <Legend formatter={n => n === "metis" ? "Métis Avg" : "BC Population Avg"} wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
        <Line type="monotone" dataKey="metis" stroke="#e6a817" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="bc" stroke="#58a6ff" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} connectNulls />
        {benchmark.active && benchmark.value != null &&
          <ReferenceLine y={benchmark.value} stroke={BENCHMARK_COLOR} strokeDasharray="5 3" strokeWidth={2}
            label={{ value: `Benchmark: ${benchmark.value.toFixed(1)}`, position: "right", fill: BENCHMARK_COLOR, fontSize: 10 }} />}
      </LineChart>
    </ResponsiveContainer>
  );
}

function ScatterPlot({ data, drill, benchmark }) {
  const { catColors, points } = useMemo(() => {
    const colorMap = {};
    [...new Set(data.map(m => m.category))].forEach((c, i) => { colorMap[c] = COLORS[i % COLORS.length]; });
    const pts = data.filter(m => m.value != null && m.comparison_value != null).map(m => ({
      x: parseFloat(m.comparison_value?.toFixed(2)),
      y: parseFloat(m.value?.toFixed(2)),
      name: m.name, category: m.category, region: m.region, year: m.year,
      direction: getMetricDirection(m),
    }));
    return { catColors: colorMap, points: pts };
  }, [data]);

  if (!points.length) return <EmptyState msg="No metrics with BC comparison values for scatter plot." />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.3} />
        <XAxis dataKey="x" name="BC" tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
          label={{ value: "BC Pop.", position: "insideBottom", offset: -4, fill: "var(--text-secondary)", fontSize: 11 }} />
        <YAxis dataKey="y" name="Métis" tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
          label={{ value: "Métis", angle: -90, position: "insideLeft", fill: "var(--text-secondary)", fontSize: 11 }} />
        <Tooltip content={({ payload }) => {
          const d = payload?.[0]?.payload;
          if (!d) return null;
          const bench = benchmark.active && benchmark.value != null ? compareToBenchmark(d.y, benchmark.value, d.direction) : null;
          return (
            <div className="rounded-lg p-3 text-xs space-y-2" style={{ ...TOOLTIP_STYLE, minWidth: 200 }}>
              <div style={{ ...TOOLTIP_LABEL_STYLE, fontSize: 12 }}>{d.name}</div>
              <div className="flex items-center gap-2" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                <span>{d.category?.replace(/_/g, " ")}</span><span>·</span><span>{d.region}</span><span>·</span><span>{d.year}</span>
              </div>
              <div className="space-y-1.5 pt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div className="flex justify-between"><span style={{ color: "var(--text-muted)", fontSize: 10 }}>Métis</span><span style={{ color: "#e6a817", fontWeight: 600 }}>{d.y.toFixed(2)}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--text-muted)", fontSize: 10 }}>BC Pop.</span><span style={{ color: "#58a6ff", fontWeight: 600 }}>{d.x.toFixed(2)}</span></div>
                <div className="flex justify-between pt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: 10 }}>Gap</span>
                  <span style={{ color: isHarmfulGap(d.y - d.x, d.direction) ? "#f85149" : "#2ea043", fontWeight: 700 }}>
                    {(d.y - d.x) > 0 ? "+" : ""}{(d.y - d.x).toFixed(2)}
                  </span>
                </div>
                {bench && <div className="flex justify-between"><span style={{ color: "var(--text-muted)", fontSize: 10 }}>vs Benchmark</span><span style={{ color: BENCHMARK_COLOR, fontWeight: 600 }}>{bench.delta > 0 ? "+" : ""}{bench.delta.toFixed(2)}</span></div>}
              </div>
            </div>
          );
        }} cursor={{ fill: "rgba(254,221,0,0.04)" }} />
        <Scatter data={points} onClick={drill} style={{ cursor: "pointer" }}>
          {points.map((p, i) => <Cell key={i} fill={catColors[p.category] || "#e6a817"} fillOpacity={0.8} />)}
        </Scatter>
        {benchmark.active && benchmark.value != null &&
          <ReferenceLine y={benchmark.value} stroke={BENCHMARK_COLOR} strokeDasharray="5 3" strokeWidth={2}
            label={{ value: `Benchmark: ${benchmark.value.toFixed(1)}`, position: "right", fill: BENCHMARK_COLOR, fontSize: 10 }} />}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function Heatmap({ metrics, benchmark }) {
  const { cats, regs, grid } = useMemo(() => {
    const cats = CATEGORIES.filter(c => metrics.some(m => m.category === c));
    const regs = REGIONS.filter(r => metrics.some(m => m.region === r));
    const map = {};
    metrics.forEach(m => {
      const key = `${m.region}||${m.category}`;
      if (!map[key]) map[key] = { sum: 0, count: 0, direction: getMetricDirection(m) };
      map[key].sum += m.value; map[key].count++;
    });
    return { cats, regs, grid: map };
  }, [metrics]);

  const vals = Object.values(grid).map(v => v.sum / v.count).filter(Boolean);
  const min = Math.min(...vals), max = Math.max(...vals);
  const color = (val) => {
    if (!val) return "var(--bg-overlay)";
    const t = (val - min) / (max - min || 1);
    if (t < 0.33) return `rgba(46,213,115,${0.25 + t * 0.75})`;
    if (t < 0.66) return `rgba(254,221,0,${0.25 + (t - 0.33) * 0.75})`;
    return `rgba(255,71,87,${0.3 + (t - 0.66) * 0.7})`;
  };
  if (!cats.length || !regs.length) return <EmptyState />;
  return (
    <div className="overflow-auto" style={{ maxHeight: 280 }}>
      <table className="text-xs border-collapse" style={{ minWidth: 400 }}>
        <thead>
          <tr>
            <th className="px-2 py-1 text-left sticky left-0" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 11 }}>Region \ Cat.</th>
            {cats.map(c => <th key={c} className="px-2 py-1 text-center" style={{ color: "var(--accent-primary)", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>{c.replace(/_/g, " ")}</th>)}
          </tr>
        </thead>
        <tbody>
          {regs.map(reg => (
            <tr key={reg}>
              <td className="px-2 py-1 sticky left-0 font-semibold" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{reg}</td>
              {cats.map(cat => {
                const cell = grid[`${reg}||${cat}`];
                const avg = cell ? cell.sum / cell.count : null;
                const benchEval = benchmark.active && benchmark.value != null && avg != null
                  ? compareToBenchmark(avg, benchmark.value, cell?.direction || "neutral") : null;
                const isHarmfulVsBench = benchEval ? benchEval.better === false : false;
                return (
                  <td key={cat} className="px-1 py-1 text-center"
                    title={avg ? `${reg} / ${cat}: ${avg.toFixed(1)}` : "No data"}>
                    <div className="rounded mx-auto flex items-center justify-center font-bold"
                      style={{ background: color(avg), width: 52, height: 28, color: "var(--bg-base)", fontSize: 11,
                        outline: isHarmfulVsBench ? `2px solid ${BENCHMARK_COLOR}` : "none",
                        textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
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
          Cells on harmful side of benchmark ({benchmark.value.toFixed(1)}) highlighted
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
  const activeMetric = metric || null;

  const historicalData = useMemo(() => {
    if (!allMetrics || !activeMetric) return [];
    return allMetrics
      .filter(m => m.name === activeMetric.name && m.region === activeMetric.region && m.category === activeMetric.category)
      .sort((a, b) => a.year - b.year)
      .map(m => ({ year: m.year, value: m.value, comparison: m.comparison_value }));
  }, [activeMetric, allMetrics]);

  if (!activeMetric) return null;

  const direction = getMetricDirection(activeMetric);
  const gap = activeMetric.comparison_value != null ? activeMetric.value - activeMetric.comparison_value : null;
  const gapIsHarmfulNow = gap != null ? isHarmfulGap(gap, direction) : null;
  const benchCmp = benchmark.active && benchmark.value != null
    ? compareToBenchmark(activeMetric.metis ?? activeMetric.value, benchmark.value, direction) : null;
  const benchDiff = benchCmp ? benchCmp.delta : null;
  const histAvg = historicalData.length > 0 ? historicalData.reduce((s, d) => s + d.value, 0) / historicalData.length : null;
  const histChange = historicalData.length >= 2
    ? historicalData[historicalData.length - 1].value - historicalData[0].value : null;

  const exportMetricData = () => {
    const header = ["Year", "Métis Value", "BC Population", "Gap"].join(",");
    const rows = historicalData.map(d => [d.year, d.value.toFixed(2), d.comparison ? d.comparison.toFixed(2) : "N/A", d.comparison ? (d.value - d.comparison).toFixed(2) : "N/A"].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${activeMetric.name.replace(/\s+/g, "_")}_history.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl p-4 mt-4 space-y-3"
      style={{ background: "linear-gradient(135deg, var(--bg-overlay) 0%, rgba(254,221,0,0.03) 100%)", border: "1px solid var(--border-default)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-primary)" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent-primary)" }}>Metric Details</span>
        </div>
        <button onClick={onClose} className="activity-icon" style={{ width: 22, height: 22 }}><X size={12} /></button>
      </div>

      <div>
        <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{activeMetric.fullName || activeMetric.name}</div>
        <div className="text-xs mt-1 flex gap-2 flex-wrap">
          <span style={{ color: "var(--text-muted)" }}>{activeMetric.category?.replace(/_/g, " ")}</span>
          <span style={{ color: "var(--border-default)" }}>•</span>
          <span style={{ color: "var(--text-muted)" }}>{activeMetric.region}</span>
          <span style={{ color: "var(--border-default)" }}>•</span>
          <span style={{ color: "var(--text-muted)" }}>{directionLabel(direction)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-2.5" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ color: "var(--text-muted)", fontSize: 9, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Current ({activeMetric.year})
          </div>
          <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: 15 }}>{(activeMetric.metis ?? activeMetric.value).toFixed(2)}</div>
          {activeMetric.comparison_value != null && (
            <div style={{ color: "var(--text-secondary)", fontSize: 9, marginTop: 2 }}>vs BC: {activeMetric.comparison_value.toFixed(2)}</div>
          )}
        </div>
        {gap != null && (
          <div className="rounded-lg p-2.5" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 9, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Disparity Gap</div>
            <div style={{ color: gapIsHarmfulNow ? "#f85149" : "#2ea043", fontWeight: 700, fontSize: 15 }}>{gap > 0 ? "+" : ""}{gap.toFixed(2)}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 9, marginTop: 2 }}>{gapIsHarmfulNow ? "Worse" : "Better"} than BC baseline</div>
          </div>
        )}
      </div>

      {historicalData.length > 1 && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Historical Trend
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: "#8bafd4" }} />
              <YAxis tick={{ fontSize: 9, fill: "#8bafd4" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(254,221,0,0.04)" }} />
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

      <div className="grid grid-cols-2 gap-2">
        {histAvg != null && (
          <div className="rounded-lg p-2.5" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Historical Avg</div>
            <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{histAvg.toFixed(2)}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 9, marginTop: 2 }}>
              vs Current: {activeMetric.value - histAvg > 0 ? "+" : ""}{(activeMetric.value - histAvg).toFixed(2)}
            </div>
          </div>
        )}
        {histChange != null && (
          <div className="rounded-lg p-2.5" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Total Trend</div>
            <div style={{ color: isImprovement(histChange, direction) ? "#2ea043" : "#f85149", fontWeight: 700 }}>
              {histChange > 0 ? "↑" : "↓"} {Math.abs(histChange).toFixed(2)}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 9, marginTop: 2 }}>
              {historicalData[0]?.year} → {historicalData[historicalData.length - 1]?.year}
            </div>
          </div>
        )}
      </div>

      {benchDiff != null && (
        <div className="rounded-lg p-2.5" style={{ background: `${BENCHMARK_COLOR}11`, border: `1px solid ${BENCHMARK_COLOR}33` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: BENCHMARK_COLOR, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            vs Benchmark ({benchmark.value.toFixed(1)})
          </div>
          <div style={{ color: BENCHMARK_COLOR, fontWeight: 700, fontSize: 13 }}>
            {benchDiff > 0 ? "+" : ""}{benchDiff.toFixed(2)} — {benchCmp?.better == null ? "delta" : benchCmp.better ? "beneficial side" : "harmful side"}
          </div>
        </div>
      )}

      {historicalData.length > 0 && (
        <button onClick={exportMetricData}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          onMouseOver={e => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
          <Download size={11} style={{ color: "var(--accent-primary)" }} />
          Export Metric History
        </button>
      )}
    </div>
  );
}

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
export default function DisparityExplorer({ metrics, trackedMetricIds = [] }) {
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

  const years = useMemo(() => [...new Set(metrics.map(m => m.year).filter(Boolean))].sort(), [metrics]);

  const filtered = useMemo(() => metrics.filter(m => {
    if (trackedMetricIds.length > 0 && !trackedMetricIds.includes(m.id)) return false;
    if (selCats.length && !selCats.includes(m.category)) return false;
    if (selRegions.length && !selRegions.includes(m.region)) return false;
    if (yearFrom !== "all" && m.year < parseInt(yearFrom)) return false;
    if (yearTo !== "all" && m.year > parseInt(yearTo)) return false;
    if (valueOp !== "any" && valueThreshold !== "") {
      const t = parseFloat(valueThreshold);
      if (valueOp === "gt"  && !(m.value > t))  return false;
      if (valueOp === "gte" && !(m.value >= t)) return false;
      if (valueOp === "lt"  && !(m.value < t))  return false;
      if (valueOp === "lte" && !(m.value <= t)) return false;
      if (valueOp === "eq"  && !(Math.abs(m.value - t) < 0.001)) return false;
    }
    return true;
  }), [metrics, selCats, selRegions, yearFrom, yearTo, valueOp, valueThreshold]);

  const activeFilterCount = [selCats.length > 0, selRegions.length > 0, yearFrom !== "all" || yearTo !== "all", valueOp !== "any"].filter(Boolean).length;
  const clearAll = () => { setSelCats([]); setSelRegions([]); setYearFrom("all"); setYearTo("all"); setValueOp("any"); setValueThreshold(""); };

  return (
    <div className="dashboard-widget-card" style={{ overflow: "visible" }}>
      {/* Header */}
      <div className="mb-4 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ fontFamily: "'Sofia Sans Extra Condensed','Aptos Narrow',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mnbc-yellow)" }}>
          Health Disparity Explorer
        </div>
        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          Analyze gaps between Métis health outcomes and BC population benchmarks
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeFilterCount > 0 ? "rgba(254,221,0,0.1)" : "var(--bg-overlay)",
              border: `1px solid ${activeFilterCount > 0 ? "rgba(254,221,0,0.5)" : "var(--border-default)"}`,
              color: activeFilterCount > 0 ? "var(--accent-primary)" : "var(--text-secondary)",
            }}
          >
            <Filter size={11} />
            <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</span>
            <ChevronDown size={10} style={{ transform: filtersOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          {/* Benchmark */}
          <BenchmarkPanel
            metrics={filtered}
            allMetrics={metrics}
            benchmark={benchmark}
            setBenchmark={setBenchmark}
            open={benchmarkOpen}
            setOpen={setBenchmarkOpen}
          />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Chart type pills */}
          <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}>
            {CHART_TYPES.map(ct => (
              <button
                key={ct.id}
                onClick={() => { setChartType(ct.id); setDrillItem(null); }}
                title={ct.label}
                className="flex items-center justify-center w-7 h-7 rounded-md transition-all"
                style={{
                  background: chartType === ct.id ? "rgba(254,221,0,0.15)" : "transparent",
                  color: chartType === ct.id ? "var(--accent-primary)" : "var(--text-muted)",
                  border: `1px solid ${chartType === ct.id ? "rgba(254,221,0,0.4)" : "transparent"}`,
                }}
              >
                <ct.icon size={12} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="rounded-lg p-3 mb-3" style={{ background: "rgba(254,221,0,0.02)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex flex-wrap gap-2 items-center">
            <MultiSelect label="Category" options={CATEGORIES.map(c => ({ value: c, label: c.replace(/_/g, " ") }))} selected={selCats} onChange={setSelCats} />
            <MultiSelect label="Region" options={REGIONS.map(r => ({ value: r, label: r }))} selected={selRegions} onChange={setSelRegions} />
            <YearRangeFilter years={years} yearFrom={yearFrom} setYearFrom={setYearFrom} yearTo={yearTo} setYearTo={setYearTo} />
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Value</span>
              <ValueFilter op={valueOp} setOp={setValueOp} threshold={valueThreshold} setThreshold={setValueThreshold} />
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg font-medium"
                style={{ color: "var(--color-error)", border: "1px solid rgba(255,23,68,0.3)", background: "rgba(255,23,68,0.05)" }}>
                <X size={10} /> Clear all
              </button>
            )}
          </div>
          <div className="mt-2 text-xs" style={{ color: "var(--text-muted)", fontSize: 10 }}>
            {filtered.length} of {metrics.length} metrics shown
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="rounded-lg p-4" style={{ background: "linear-gradient(135deg, var(--bg-overlay) 0%, rgba(254,221,0,0.02) 100%)", border: "1px solid var(--border-subtle)" }}>
        {chartType === "bar"     && <DisparityBar data={filtered} drill={setDrillItem} benchmark={benchmark} />}
        {chartType === "line"    && <TrendLine    data={filtered} benchmark={benchmark} />}
        {chartType === "scatter" && <ScatterPlot  data={filtered} drill={setDrillItem} benchmark={benchmark} />}
        {chartType === "heatmap" && <Heatmap      metrics={filtered} benchmark={benchmark} />}
      </div>

      <BenchmarkTable data={filtered} benchmark={benchmark} />

      {/* Export */}
      <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {[
          { label: "Filtered Data", onClick: () => exportCSV(filtered, "health_metrics_filtered.csv"), accent: true },
          { label: "All Data", onClick: () => exportCSV(metrics, "health_metrics_all.csv"), accent: false },
        ].map(btn => (
          <button key={btn.label} onClick={btn.onClick}
            className="flex items-center justify-center gap-1.5 flex-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: "var(--bg-overlay)", border: `1px solid ${btn.accent ? "rgba(254,221,0,0.2)" : "var(--border-subtle)"}`, color: "var(--text-secondary)" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = btn.accent ? "rgba(254,221,0,0.2)" : "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            <Download size={11} style={{ color: "var(--accent-primary)" }} />
            {btn.label}
          </button>
        ))}
      </div>

      <DrillPanel metric={drillItem} onClose={() => setDrillItem(null)} benchmark={benchmark} allMetrics={metrics} />
    </div>
  );
}