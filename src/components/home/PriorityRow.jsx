import React from "react";

const STATUS_COLORS = {
  "on-track": "#00e676",
  "at-risk": "#ffab40",
  "overdue": "#ff4d4f",
  "complete": "#40c4ff",
};
const STATUS_LABELS = {
  "on-track": "On Track",
  "at-risk": "At Risk",
  "overdue": "Overdue",
  "complete": "Done",
};

export default function PriorityRow({ label, status, app, dueLabel }) {
  const color = STATUS_COLORS[status] ?? "var(--text-muted)";
  return (
    <div
      className="home-priority-row flex items-center gap-2.5 px-2.5 py-1.5 rounded-md"
      title={`${label}${app ? ` · ${app}` : ""}${dueLabel ? ` · due ${dueLabel}` : ""}`}
      style={{
        background: "var(--bg-overlay)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `2px solid ${color}88`,
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <div className="flex-1 min-w-0">
        <div className="truncate" style={{ fontSize: 11.5, color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.3 }}>
          {label}
        </div>
        {app && (
          <div className="truncate" style={{ fontSize: 9.5, color: "var(--text-muted)", lineHeight: 1.2 }}>
            {app}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {dueLabel && (
          <span style={{ fontSize: 9.5, color: "var(--text-muted)" }}>{dueLabel}</span>
        )}
        <span style={{
          fontSize: 9, fontWeight: 700, color,
          background: color + "18", padding: "1.5px 5px",
          borderRadius: 3, border: `1px solid ${color}33`,
          textTransform: "uppercase", letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        }}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>
    </div>
  );
}