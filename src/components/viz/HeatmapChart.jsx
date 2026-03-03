import React from "react";

const COLORS_SCALE = ["#1a2332", "#1e3a5f", "#1a5276", "#1d6a6a", "#1e8449", "#d4ac0d", "#e67e22", "#e74c3c", "#c0392b"];

function getColor(value, min, max) {
  if (max === min) return COLORS_SCALE[4];
  const ratio = (value - min) / (max - min);
  const idx = Math.floor(ratio * (COLORS_SCALE.length - 1));
  return COLORS_SCALE[Math.min(idx, COLORS_SCALE.length - 1)];
}

export default function HeatmapChart({ data, onCellClick, activeFilter }) {
  // data: array of { rowKey, colKey, value, label }
  const rows = [...new Set(data.map(d => d.rowKey))];
  const cols = [...new Set(data.map(d => d.colKey))];
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (rows.length === 0) return (
    <div className="flex items-center justify-center h-48 text-xs" style={{ color: "var(--text-muted)" }}>
      No data available for heatmap view.
    </div>
  );

  return (
    <div className="overflow-auto">
      <table className="border-collapse text-xs" style={{ minWidth: "100%" }}>
        <thead>
          <tr>
            <th className="px-2 py-1 text-left sticky left-0 z-10" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: 10, minWidth: 120 }}>
              Region \ Category
            </th>
            {cols.map(col => (
              <th key={col} className="px-2 py-1 text-center font-medium" style={{ color: "var(--text-secondary)", fontSize: 10, minWidth: 80, whiteSpace: "nowrap" }}>
                {col.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row}>
              <td className="px-2 py-1 font-medium sticky left-0 z-10 border-r"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)", fontSize: 11, whiteSpace: "nowrap" }}>
                {row}
              </td>
              {cols.map(col => {
                const cell = data.find(d => d.rowKey === row && d.colKey === col);
                const isActive = activeFilter?.row === row || activeFilter?.col === col;
                return (
                  <td key={col} className="px-1 py-1 text-center cursor-pointer transition-all"
                    style={{ padding: "4px" }}
                    onClick={() => cell && onCellClick && onCellClick({ row, col, value: cell.value })}>
                    {cell ? (
                      <div className="rounded flex items-center justify-center font-mono font-semibold"
                        style={{
                          background: getColor(cell.value, min, max),
                          color: cell.value > (max * 0.6 + min * 0.4) ? "#fff" : "#cdd9e5",
                          height: 36, minWidth: 60,
                          fontSize: 11,
                          opacity: isActive ? 1 : 0.85,
                          outline: isActive ? "2px solid var(--accent-primary)" : "none",
                        }}>
                        {cell.value.toFixed(1)}
                      </div>
                    ) : (
                      <div className="rounded flex items-center justify-center" style={{ height: 36, minWidth: 60, background: "var(--bg-overlay)", opacity: 0.3 }}>
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Low</span>
        <div className="flex h-3 rounded overflow-hidden flex-1" style={{ maxWidth: 200 }}>
          {COLORS_SCALE.map((c, i) => <div key={i} style={{ background: c, flex: 1 }} />)}
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>High</span>
      </div>
    </div>
  );
}