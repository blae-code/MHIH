/**
 * DataTablePanel — sortable, paginated table view of an uploaded dataset.
 */

import React, { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { toNumber } from "@/lib/quantStats";

const PAGE_SIZE = 25;

const thStyle = {
  background: "var(--bg-overlay)",
  color: "var(--text-secondary)",
  fontSize: 10.5,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  padding: "9px 12px",
  borderBottom: "1px solid var(--border-default)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset",
  textAlign: "left",
};

const tdStyle = {
  padding: "7px 12px",
  borderBottom: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
  fontSize: 12,
};

export default function DataTablePanel({ columns, rows, columnTypes }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [page, setPage] = useState(0);

  const typeOf = (c) => columnTypes.find((t) => t.name === c)?.type ?? "categorical";

  const sorted = useMemo(() => {
    if (!sortCol) return rows;
    const numeric = typeOf(sortCol) === "numeric";
    return [...rows].sort((a, b) => {
      if (numeric) {
        const x = toNumber(a[sortCol]) ?? -Infinity;
        const y = toNumber(b[sortCol]) ?? -Infinity;
        return (x - y) * sortDir;
      }
      return String(a[sortCol] ?? "").localeCompare(String(b[sortCol] ?? "")) * sortDir;
    });
  }, [rows, sortCol, sortDir]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (c) => {
    if (sortCol === c) setSortDir((d) => -d);
    else { setSortCol(c); setSortDir(1); }
    setPage(0);
  };

  return (
    <div>
      <div
        className="overflow-auto rounded-lg"
        style={{
          border: "1px solid var(--border-default)",
          maxHeight: 480,
          boxShadow: "inset 0 1px 4px rgba(0,0,0,0.35)",
        }}
      >
        <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ ...thStyle, width: 44 }}>#</th>
              {columns.map((c) => {
                const numeric = typeOf(c) === "numeric";
                return (
                  <th key={c} className="cursor-pointer select-none" onClick={() => toggleSort(c)} title="Click to sort"
                    style={{ ...thStyle, background: sortCol === c ? "var(--bg-hover)" : thStyle.background }}>
                    <span className="inline-flex items-center gap-1.5" style={{ whiteSpace: "nowrap" }}>
                      {c}
                      <span
                        style={{
                          fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          color: numeric ? "#40c4ff" : "var(--text-muted)",
                          background: numeric ? "rgba(64,196,255,0.10)" : "var(--bg-overlay)",
                          border: `1px solid ${numeric ? "rgba(64,196,255,0.30)" : "var(--border-subtle)"}`,
                        }}
                      >
                        {numeric ? "num" : "cat"}
                      </span>
                      {sortCol === c && (sortDir === 1
                        ? <ArrowUp size={10} style={{ color: "#40c4ff" }} />
                        : <ArrowDown size={10} style={{ color: "#40c4ff" }} />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr
                key={i}
                style={{ background: i % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent")}
              >
                <td style={{ ...tdStyle, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {page * PAGE_SIZE + i + 1}
                </td>
                {columns.map((c) => (
                  <td key={c} style={{
                    ...tdStyle,
                    ...(typeOf(c) === "numeric" ? { fontVariantNumeric: "tabular-nums", textAlign: "right" } : {}),
                  }}>
                    {r[c] === "" || r[c] === null || r[c] === undefined
                      ? <span style={{ color: "var(--text-muted)", opacity: 0.6 }}>—</span>
                      : String(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{sorted.length.toLocaleString()} rows · {columns.length} columns</span>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            <button className="activity-icon" style={{ width: 24, height: 24 }} disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft size={12} />
            </button>
            <span className="tabular-nums">Page {page + 1} / {pages}</span>
            <button className="activity-icon" style={{ width: 24, height: 24 }} disabled={page >= pages - 1}
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>
              <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}