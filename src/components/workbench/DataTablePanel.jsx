/**
 * DataTablePanel — sortable, paginated, searchable table view of an
 * uploaded dataset with inline numeric data bars and per-column
 * completeness meters.
 */

import React, { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from "lucide-react";
import { toNumber } from "@/lib/quantStats";

const ACCENT = "#40c4ff";

const thStyle = {
  background: "linear-gradient(180deg, var(--bg-overlay) 0%, var(--bg-elevated) 100%)",
  color: "var(--text-secondary)",
  fontSize: 10.5,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  padding: "9px 12px 7px",
  borderBottom: "1px solid var(--border-default)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
  textAlign: "left",
};

const tdStyle = {
  padding: "7px 12px",
  borderBottom: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
  fontSize: 12,
};

const isMissing = (v) => v === "" || v === null || v === undefined;

export default function DataTablePanel({ columns, rows, columnTypes }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [query, setQuery] = useState("");

  const typeOf = (c) => columnTypes.find((t) => t.name === c)?.type ?? "categorical";

  // Per-column stats: completeness + numeric min/max for inline data bars
  const colMeta = useMemo(() => {
    const meta = {};
    for (const c of columns) {
      let present = 0, min = Infinity, max = -Infinity;
      const numeric = typeOf(c) === "numeric";
      for (const r of rows) {
        if (!isMissing(r[c])) present++;
        if (numeric) {
          const n = toNumber(r[c]);
          if (n !== null && n !== undefined && !Number.isNaN(n)) {
            if (n < min) min = n;
            if (n > max) max = n;
          }
        }
      }
      meta[c] = { completeness: rows.length ? present / rows.length : 0, min, max, numeric };
    }
    return meta;
  }, [columns, rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => columns.some((c) => String(r[c] ?? "").toLowerCase().includes(q)));
  }, [rows, columns, query]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const numeric = typeOf(sortCol) === "numeric";
    return [...filtered].sort((a, b) => {
      if (numeric) {
        const x = toNumber(a[sortCol]) ?? -Infinity;
        const y = toNumber(b[sortCol]) ?? -Infinity;
        return (x - y) * sortDir;
      }
      return String(a[sortCol] ?? "").localeCompare(String(b[sortCol] ?? "")) * sortDir;
    });
  }, [filtered, sortCol, sortDir]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const pageRows = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const firstRow = sorted.length === 0 ? 0 : safePage * pageSize + 1;
  const lastRow = Math.min(sorted.length, (safePage + 1) * pageSize);

  const toggleSort = (c) => {
    if (sortCol === c) setSortDir((d) => -d);
    else { setSortCol(c); setSortDir(1); }
    setPage(0);
  };

  // Fraction of column range for the inline numeric data bar
  const barFraction = (c, v) => {
    const m = colMeta[c];
    if (!m?.numeric || m.min === Infinity || m.max === m.min) return null;
    const n = toNumber(v);
    if (n === null || n === undefined || Number.isNaN(n)) return null;
    return (n - m.min) / (m.max - m.min);
  };

  const pagerBtn = (disabled) => ({
    width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 6, border: "1px solid var(--border-subtle)",
    background: "var(--bg-overlay)", color: disabled ? "var(--text-muted)" : "var(--text-secondary)",
    opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer",
    transition: "all 0.12s",
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <div className="relative" style={{ width: 240 }}>
          <Search size={11} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder="Search all columns…"
            className="w-full text-xs rounded-md transition-colors"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              padding: "6px 26px 6px 26px",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(64,196,255,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
          />
          {query && (
            <button onClick={() => { setQuery(""); setPage(0); }}
              style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
              <X size={11} />
            </button>
          )}
        </div>
        {query && (
          <span className="tag" style={{ color: ACCENT, borderColor: "rgba(64,196,255,0.3)", background: "rgba(64,196,255,0.08)" }}>
            {sorted.length.toLocaleString()} match{sorted.length === 1 ? "" : "es"}
          </span>
        )}
        <div className="flex-1" />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
          className="text-xs rounded-md"
          style={{
            background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)", padding: "5px 8px", outline: "none", cursor: "pointer",
          }}
        >
          {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Table */}
      <div
        className="overflow-auto rounded-lg"
        style={{
          border: "1px solid var(--border-default)",
          maxHeight: 480,
          boxShadow: "inset 0 1px 4px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ ...thStyle, width: 44 }}>#</th>
              {columns.map((c) => {
                const numeric = typeOf(c) === "numeric";
                const active = sortCol === c;
                const completeness = colMeta[c]?.completeness ?? 1;
                return (
                  <th key={c} className="cursor-pointer select-none" onClick={() => toggleSort(c)}
                    title={`Click to sort · ${Math.round(completeness * 100)}% complete`}
                    style={{
                      ...thStyle,
                      position: "relative",
                      background: active
                        ? "linear-gradient(180deg, rgba(64,196,255,0.10) 0%, var(--bg-elevated) 100%)"
                        : thStyle.background,
                    }}>
                    <span className="inline-flex items-center gap-1.5" style={{ whiteSpace: "nowrap", color: active ? "var(--text-primary)" : undefined }}>
                      {c}
                      <span
                        style={{
                          fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          color: numeric ? ACCENT : "var(--text-muted)",
                          background: numeric ? "rgba(64,196,255,0.10)" : "var(--bg-overlay)",
                          border: `1px solid ${numeric ? "rgba(64,196,255,0.30)" : "var(--border-subtle)"}`,
                        }}
                      >
                        {numeric ? "num" : "cat"}
                      </span>
                      {active && (sortDir === 1
                        ? <ArrowUp size={10} style={{ color: ACCENT }} />
                        : <ArrowDown size={10} style={{ color: ACCENT }} />)}
                    </span>
                    {/* Completeness meter — thin strip along the bottom edge */}
                    <span aria-hidden style={{
                      position: "absolute", left: 0, bottom: 0, height: 2,
                      width: `${completeness * 100}%`,
                      background: completeness >= 0.98 ? "rgba(0,230,118,0.45)"
                        : completeness >= 0.8 ? "rgba(255,171,64,0.5)"
                        : "rgba(255,23,68,0.55)",
                    }} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} style={{ ...tdStyle, textAlign: "center", padding: "28px 12px", color: "var(--text-muted)" }}>
                  No rows match “{query}”
                </td>
              </tr>
            )}
            {pageRows.map((r, i) => (
              <tr
                key={i}
                style={{ background: i % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(64,196,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent")}
              >
                <td style={{ ...tdStyle, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", fontSize: 10.5 }}>
                  {safePage * pageSize + i + 1}
                </td>
                {columns.map((c) => {
                  const missing = isMissing(r[c]);
                  const frac = missing ? null : barFraction(c, r[c]);
                  return (
                    <td key={c} style={{
                      ...tdStyle,
                      position: "relative",
                      ...(typeOf(c) === "numeric" ? { fontVariantNumeric: "tabular-nums", textAlign: "right" } : {}),
                    }}>
                      {frac !== null && (
                        <span aria-hidden style={{
                          position: "absolute", right: 0, top: 4, bottom: 4,
                          width: `${Math.max(2, frac * 100)}%`,
                          background: "linear-gradient(90deg, transparent 0%, rgba(64,196,255,0.10) 100%)",
                          borderRight: "2px solid rgba(64,196,255,0.35)",
                          borderRadius: 2,
                          pointerEvents: "none",
                        }} />
                      )}
                      <span style={{ position: "relative" }}>
                        {missing
                          ? <span style={{ color: "var(--text-muted)", opacity: 0.55, fontStyle: "italic", fontSize: 11 }}>—</span>
                          : String(r[c])}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5 text-xs flex-wrap gap-2" style={{ color: "var(--text-muted)" }}>
        <span className="tabular-nums">
          Showing {firstRow.toLocaleString()}–{lastRow.toLocaleString()} of {sorted.length.toLocaleString()} rows
          {query && ` (filtered from ${rows.length.toLocaleString()})`} · {columns.length} columns
        </span>
        {pages > 1 && (
          <div className="flex items-center gap-1.5">
            <button style={pagerBtn(safePage === 0)} disabled={safePage === 0} onClick={() => setPage(0)} title="First page">
              <ChevronsLeft size={12} />
            </button>
            <button style={pagerBtn(safePage === 0)} disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft size={12} />
            </button>
            <span className="tabular-nums px-2 py-1 rounded-md"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
              {safePage + 1} / {pages}
            </span>
            <button style={pagerBtn(safePage >= pages - 1)} disabled={safePage >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>
              <ChevronRight size={12} />
            </button>
            <button style={pagerBtn(safePage >= pages - 1)} disabled={safePage >= pages - 1} onClick={() => setPage(pages - 1)} title="Last page">
              <ChevronsRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}