/**
 * DataTablePanel — sortable, paginated table view of an uploaded dataset.
 */

import React, { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { toNumber } from "@/lib/quantStats";

const PAGE_SIZE = 25;

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
      <div className="overflow-auto rounded-lg" style={{ border: "1px solid var(--border-subtle)", maxHeight: 480 }}>
        <table className="data-table w-full" style={{ borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ width: 44 }}>#</th>
              {columns.map((c) => (
                <th key={c} className="cursor-pointer select-none" onClick={() => toggleSort(c)} title="Click to sort">
                  <span className="inline-flex items-center gap-1">
                    {c}
                    <span className="tag" style={{ fontSize: 8, padding: "0 4px", textTransform: "uppercase" }}>
                      {typeOf(c) === "numeric" ? "num" : "cat"}
                    </span>
                    {sortCol === c && (sortDir === 1 ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={i}>
                <td style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {page * PAGE_SIZE + i + 1}
                </td>
                {columns.map((c) => (
                  <td key={c} style={typeOf(c) === "numeric" ? { fontVariantNumeric: "tabular-nums", textAlign: "right" } : {}}>
                    {r[c] === "" || r[c] === null || r[c] === undefined
                      ? <span style={{ color: "var(--text-muted)" }}>—</span>
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