/**
 * CorrelationVariablePicker — toggleable chips for selecting which
 * numeric variables are included in the correlation analysis.
 */

import React from "react";
import { Check } from "lucide-react";

export default function CorrelationVariablePicker({ allCols, selected, onChange }) {
  const toggle = (c) => {
    onChange(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);
  };

  return (
    <div className="depth-card p-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Variables in Analysis
        </span>
        <span className="tag" style={{ fontSize: 9 }}>{selected.length} of {allCols.length}</span>
        <div className="flex-1" />
        <button
          onClick={() => onChange(allCols)}
          className="text-xs px-2 py-0.5 rounded transition-colors"
          style={{ color: "#40c4ff", fontSize: 10, fontWeight: 600 }}
        >
          Select all
        </button>
        <button
          onClick={() => onChange([])}
          className="text-xs px-2 py-0.5 rounded transition-colors"
          style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600 }}
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {allCols.map((c) => {
          const on = selected.includes(c);
          return (
            <button
              key={c}
              onClick={() => toggle(c)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: on ? "rgba(0,230,118,0.10)" : "var(--bg-overlay)",
                border: `1px solid ${on ? "rgba(0,230,118,0.40)" : "var(--border-default)"}`,
                color: on ? "#00e676" : "var(--text-muted)",
                boxShadow: on ? "0 0 8px rgba(0,230,118,0.10)" : "none",
              }}
              title={on ? "Click to exclude from correlation analysis" : "Click to include"}
            >
              {on && <Check size={10} />}
              {c}
            </button>
          );
        })}
      </div>
      {selected.length === 1 && (
        <div className="mt-2" style={{ fontSize: 10, color: "#ffab40" }}>
          Select at least 2 variables to compute correlations.
        </div>
      )}
    </div>
  );
}