/**
 * Small chip components shared across the Policy Studio views.
 */

import React from "react";
import { LIFECYCLE_STAGES, STATUS_CONFIG, StageChipStyle } from "./lifecycleStages";

export function StageChip({ stageKey, small = false }) {
  const stage = LIFECYCLE_STAGES.find((s) => s.key === stageKey);
  if (!stage) return null;
  const style = StageChipStyle(stage);
  if (small) { style.fontSize = 9; style.padding = "1px 5px"; }
  return <span style={style}>{stage.label}</span>;
}

export function StatusChip({ status }) {
  const c = STATUS_CONFIG[status] ?? { label: status, color: "var(--text-muted)" };
  return (
    <span
      style={{
        fontSize: 10, fontWeight: 600, color: c.color,
        background: c.color + "18", border: `1px solid ${c.color}33`,
        padding: "2px 6px", borderRadius: 3, whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}