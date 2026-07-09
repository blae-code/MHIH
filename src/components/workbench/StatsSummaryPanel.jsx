/**
 * StatsSummaryPanel — descriptive statistics per column plus a Pearson
 * correlation matrix for numeric columns.
 */

import React, { useMemo } from "react";
import { describeNumeric, describeCategorical, correlationMatrix, fmtNum } from "@/lib/quantStats";

function corrColor(v) {
  if (v === null) return "var(--bg-overlay)";
  const a = Math.min(Math.abs(v), 1) * 0.55;
  return v >= 0 ? `rgba(0,230,118,${a})` : `rgba(255,23,68,${a})`;
}

export default function StatsSummaryPanel({ columns, rows, columnTypes }) {
  const numericCols = columnTypes.filter((c) => c.type === "numeric").map((c) => c.name);
  const catCols = columnTypes.filter((c) => c.type === "categorical").map((c) => c.name);

  const numericStats = useMemo(
    () => numericCols.map((c) => ({ name: c, ...describeNumeric(rows.map((r) => r[c])) })),
    [rows, numericCols] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const catStats = useMemo(
    () => catCols.map((c) => ({ name: c, ...describeCategorical(rows.map((r) => r[c])) })),
    [rows, catCols] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const corr = useMemo(
    () => (numericCols.length >= 2 ? correlationMatrix(rows, numericCols) : null),
    [rows, numericCols] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-5">
      {/* Numeric descriptives */}
      {numericStats.length > 0 && (
        <div>
          <div className="dashboard-section-label">Numeric Columns — Descriptive Statistics</div>
          <div className="overflow-auto rounded-lg" style={{ border: "1px solid var(--border-subtle)" }}>
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Column</th><th>N</th><th>Missing</th><th>Mean</th><th>Median</th>
                  <th>Std Dev</th><th>Min</th><th>Q1</th><th>Q3</th><th>Max</th>
                </tr>
              </thead>
              <tbody>
                {numericStats.map((s) => (
                  <tr key={s.name}>
                    <td className="font-semibold">{s.name}</td>
                    <td className="tabular-nums">{s.count}</td>
                    <td className="tabular-nums" style={{ color: s.missing > 0 ? "var(--color-warning)" : undefined }}>{s.missing}</td>
                    <td className="tabular-nums">{fmtNum(s.mean)}</td>
                    <td className="tabular-nums">{fmtNum(s.median)}</td>
                    <td className="tabular-nums">{fmtNum(s.std)}</td>
                    <td className="tabular-nums">{fmtNum(s.min)}</td>
                    <td className="tabular-nums">{fmtNum(s.q1)}</td>
                    <td className="tabular-nums">{fmtNum(s.q3)}</td>
                    <td className="tabular-nums">{fmtNum(s.max)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categorical summaries */}
      {catStats.length > 0 && (
        <div>
          <div className="dashboard-section-label">Categorical Columns</div>
          <div className="overflow-auto rounded-lg" style={{ border: "1px solid var(--border-subtle)" }}>
            <table className="data-table w-full">
              <thead>
                <tr><th>Column</th><th>N</th><th>Missing</th><th>Unique</th><th>Most Frequent</th><th>Frequency</th></tr>
              </thead>
              <tbody>
                {catStats.map((s) => (
                  <tr key={s.name}>
                    <td className="font-semibold">{s.name}</td>
                    <td className="tabular-nums">{s.count}</td>
                    <td className="tabular-nums" style={{ color: s.missing > 0 ? "var(--color-warning)" : undefined }}>{s.missing}</td>
                    <td className="tabular-nums">{s.unique}</td>
                    <td>{s.top}</td>
                    <td className="tabular-nums">{s.topFreq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Correlation matrix */}
      {corr && (
        <div>
          <div className="dashboard-section-label">Correlation Matrix (Pearson)</div>
          <div className="overflow-auto rounded-lg p-3" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
            <table style={{ borderCollapse: "separate", borderSpacing: 3 }}>
              <thead>
                <tr>
                  <th></th>
                  {numericCols.map((c) => (
                    <th key={c} className="text-xs px-1" style={{ color: "var(--text-muted)", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {numericCols.map((rowName, i) => (
                  <tr key={rowName}>
                    <td className="text-xs pr-2 font-semibold" style={{ color: "var(--text-secondary)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={rowName}>
                      {rowName}
                    </td>
                    {numericCols.map((_, j) => {
                      const v = corr[i][j];
                      return (
                        <td key={j} className="text-center text-xs tabular-nums rounded"
                          style={{ background: corrColor(v), minWidth: 48, padding: "5px 4px", color: "var(--text-primary)" }}
                          title={v === null ? "Insufficient paired data" : `r = ${v.toFixed(3)}`}>
                          {v === null ? "—" : v.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              Green = positive correlation · Red = negative · computed on pairwise-complete observations
            </div>
          </div>
        </div>
      )}

      {numericStats.length === 0 && catStats.length === 0 && (
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>No columns to analyze.</div>
      )}
    </div>
  );
}