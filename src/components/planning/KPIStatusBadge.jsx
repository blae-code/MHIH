/**
 * KPIStatusBadge — coloured pill showing KPI status
 * Props: status ("on-track"|"at-risk"|"off-track"|"achieved"), size ("sm"|"md")
 */

import React from "react";

const STATUS_CONFIG = {
  "on-track":  { color: "#00e676", label: "On Track" },
  "at-risk":   { color: "#ffab40", label: "At Risk" },
  "off-track": { color: "#ff4d4f", label: "Off Track" },
  "achieved":  { color: "#a78bfa", label: "Achieved" },
};

export default function KPIStatusBadge({ status, size = "md" }) {
  const cfg = STATUS_CONFIG[status] ?? { color: "var(--text-muted)", label: status };
  const fontSize = size === "sm" ? 10 : 11;
  const dotSize = size === "sm" ? 5 : 6;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.color + "18",
        border: `1px solid ${cfg.color}33`,
        padding: size === "sm" ? "1px 6px" : "2px 8px",
        borderRadius: 4,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span style={{ width: dotSize, height: dotSize, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}
