/**
 * GoalChip — small coloured chip showing a strategic goal code + short title
 * Props: goal (StrategicGoal), size ("xs"|"sm"), onClick
 */

import React from "react";

export default function GoalChip({ goal, size = "sm", onClick }) {
  if (!goal) return null;
  const isXs = size === "xs";
  return (
    <span
      onClick={onClick}
      title={goal.title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: isXs ? 9 : 10,
        fontWeight: 700,
        color: goal.color,
        background: goal.color + "15",
        border: `1px solid ${goal.color}33`,
        padding: isXs ? "1px 5px" : "2px 7px",
        borderRadius: 4,
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : "default",
        flexShrink: 0,
      }}
    >
      <span style={{ fontWeight: 800 }}>{goal.code}</span>
      {!isXs && (
        <span style={{ fontWeight: 500, opacity: 0.85, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
          {goal.title.length > 18 ? goal.title.slice(0, 18) + "…" : goal.title}
        </span>
      )}
    </span>
  );
}
