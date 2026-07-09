/**
 * chartTheme — shared dark-mode styling for workbench Recharts charts:
 * solid elevated tooltips, muted axis ticks, and grid stroke.
 */

export const TOOLTIP_PROPS = {
  contentStyle: {
    background: "#131f33",
    border: "1px solid #2a456a",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35)",
    fontSize: 11,
    padding: "8px 12px",
  },
  labelStyle: { color: "#f0f6ff", fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: "#8bafd4", padding: "1px 0" },
};

export const AXIS_TICK = { fontSize: 10, fill: "#4a6a8a" };
export const GRID_STROKE = "#1c2e48";
export const CURSOR_FILL = { fill: "rgba(64,196,255,0.05)" };