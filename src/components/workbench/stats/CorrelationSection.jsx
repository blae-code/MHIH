/**
 * CorrelationSection — Pearson heatmap plus a ranked list of the
 * strongest correlated variable pairs with strength indicators.
 */

import React, { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

function corrColor(v) {
  if (v === null) return "var(--bg-overlay)";
  const a = Math.min(Math.abs(v), 1) * 0.55;
  return v >= 0 ? `rgba(0,230,118,${a})` : `rgba(255,23,68,${a})`;
}

function strengthLabel(a) {
  if (a >= 0.7) return { label: "Strong", color: "#00e676" };
  if (a >= 0.4) return { label: "Moderate", color: "#FEDD00" };
  return { label: "Weak", color: "var(--text-muted)" };
}

export default function CorrelationSection({ corr, numericCols }) {
  const topPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < numericCols.length; i++)
      for (let j = i + 1; j < numericCols.length; j++)
        if (corr[i][j] !== null) pairs.push({ a: numericCols[i], b: numericCols[j], r: corr[i][j] });
    return pairs.sort((x, y) => Math.abs(y.r) - Math.abs(x.r)).slice(0, 6);
  }, [corr, numericCols]);

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
      {/* Heatmap */}
      <div className="depth-card p-3 overflow-auto">
        <table style={{ borderCollapse: "separate", borderSpacing: 3 }}>
          <thead>
            <tr>
              <th></th>
              {numericCols.map((c) => (
                <th key={c} className="text-xs px-1" style={{ color: "var(--text-muted)", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {numericCols.map((rowName, i) => (
              <tr key={rowName}>
                <td className="text-xs pr-2 font-semibold" style={{ color: "var(--text-secondary)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={rowName}>{rowName}</td>
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
        <div className="flex items-center gap-3 mt-2.5" style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(0,230,118,0.5)" }} /> Positive</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(255,23,68,0.5)" }} /> Negative</span>
          <span>Pairwise-complete Pearson r</span>
        </div>
      </div>

      {/* Top correlated pairs */}
      <div className="depth-card p-3.5">
        <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }} className="mb-2">
          Strongest Relationships
        </div>
        {topPairs.length === 0 && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No computable pairs.</div>}
        <div className="space-y-2">
          {topPairs.map((p, i) => {
            const s = strengthLabel(Math.abs(p.r));
            const Icon = p.r >= 0 ? TrendingUp : TrendingDown;
            return (
              <div key={i} className="px-2.5 py-2 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-1.5 mb-1" style={{ fontSize: 11 }}>
                  <Icon size={11} style={{ color: p.r >= 0 ? "#00e676" : "#ff5252" }} />
                  <span className="truncate" style={{ color: "var(--text-primary)", fontWeight: 600 }} title={`${p.a} × ${p.b}`}>
                    {p.a} × {p.b}
                  </span>
                  <span className="ml-auto tabular-nums font-bold shrink-0" style={{ color: p.r >= 0 ? "#00e676" : "#ff5252" }}>
                    {p.r.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full" style={{ background: "var(--bg-hover)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.abs(p.r) * 100}%`, background: p.r >= 0 ? "#00e676" : "#ff5252", opacity: 0.7 }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}