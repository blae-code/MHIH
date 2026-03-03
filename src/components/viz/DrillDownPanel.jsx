import React from "react";
import { X, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function DrillDownPanel({ selection, metrics, onClose }) {
  if (!selection) return null;

  const { type, value } = selection;
  const details = metrics.filter(m => {
    if (type === "category") return m.category === value;
    if (type === "region") return m.region === value;
    if (type === "year") return String(m.year) === String(value);
    return m.name === value;
  }).sort((a, b) => b.value - a.value);

  const withComparison = details.filter(m => m.comparison_value != null);

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--accent-primary)" }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--accent-muted)" }}>
        <div className="flex items-center gap-2">
          <ChevronRight size={13} style={{ color: "var(--accent-primary)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>
            Drill-down: <span className="font-bold">{value?.toString().replace(/_/g, " ")}</span>
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>({details.length} metrics)</span>
        </div>
        <button onClick={onClose} className="activity-icon" style={{ width: 22, height: 22 }}>
          <X size={12} />
        </button>
      </div>
      <div className="overflow-auto" style={{ maxHeight: 260 }}>
        {details.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>No metrics found.</div>
        ) : (
          <table className="w-full data-table text-xs">
            <thead>
              <tr>
                <th className="text-left">Metric</th>
                <th className="text-right">Year</th>
                <th className="text-right">Métis Value</th>
                <th className="text-right">BC Avg</th>
                <th className="text-right">Gap</th>
              </tr>
            </thead>
            <tbody>
              {details.map(m => {
                const gap = m.comparison_value != null ? m.value - m.comparison_value : null;
                const worse = gap != null && gap > 0;
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ color: "var(--text-primary)" }}>{m.name}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 10 }}>{m.region} · {m.category?.replace(/_/g," ")}</div>
                    </td>
                    <td className="text-right" style={{ color: "var(--text-secondary)" }}>{m.year}</td>
                    <td className="text-right font-mono font-semibold" style={{ color: "var(--accent-primary)" }}>
                      {m.value}{m.unit ? ` ${m.unit}` : ""}
                    </td>
                    <td className="text-right font-mono" style={{ color: "var(--text-muted)" }}>
                      {m.comparison_value != null ? m.comparison_value : "—"}
                    </td>
                    <td className="text-right">
                      {gap != null ? (
                        <span className="flex items-center justify-end gap-0.5 font-mono" style={{ color: worse ? "var(--color-error)" : "var(--color-success)", fontSize: 11 }}>
                          {worse ? <TrendingUp size={10} /> : gap < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                          {gap > 0 ? "+" : ""}{gap.toFixed(1)}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}