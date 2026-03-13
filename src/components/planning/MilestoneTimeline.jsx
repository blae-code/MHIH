/**
 * MilestoneTimeline — horizontal timeline with milestone status nodes
 * Props: milestones (Milestone[])
 */

import React from "react";
import { Check, Clock, AlertCircle, Circle } from "lucide-react";

const STATUS_CONFIG = {
  complete:    { color: "#00e676", Icon: Check, label: "Complete" },
  "in-progress": { color: "#40c4ff", Icon: Clock, label: "In Progress" },
  overdue:     { color: "#ff4d4f", Icon: AlertCircle, label: "Overdue" },
  pending:     { color: "var(--border-subtle)", Icon: Circle, label: "Pending" },
  deferred:    { color: "var(--text-muted)", Icon: Circle, label: "Deferred" },
  "at-risk":   { color: "#ffab40", Icon: AlertCircle, label: "At Risk" },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export default function MilestoneTimeline({ milestones }) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="py-6 text-center" style={{ color: "var(--text-muted)", fontSize: 12 }}>
        No milestones defined.
      </div>
    );
  }

  return (
    <div className="relative py-2">
      {milestones.map((ms, idx) => {
        const cfg = STATUS_CONFIG[ms.status] ?? STATUS_CONFIG.pending;
        const { Icon } = cfg;
        const isLast = idx === milestones.length - 1;

        return (
          <div key={ms.id} className="flex gap-3" style={{ marginBottom: isLast ? 0 : 0 }}>
            {/* Left: icon + connector line */}
            <div className="flex flex-col items-center" style={{ minWidth: 28 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: cfg.color === "var(--border-subtle)" ? "var(--bg-overlay)" : cfg.color + "20",
                  border: `2px solid ${cfg.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={13} style={{ color: cfg.color }} />
              </div>
              {!isLast && (
                <div style={{ width: 2, flex: 1, minHeight: 16, background: "var(--border-subtle)", margin: "2px 0" }} />
              )}
            </div>

            {/* Right: content */}
            <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1, minWidth: 0 }}>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                  {ms.title}
                </div>
                <span
                  style={{
                    fontSize: 9, fontWeight: 600, color: cfg.color,
                    background: cfg.color === "var(--border-subtle)" ? "var(--bg-overlay)" : cfg.color + "18",
                    border: `1px solid ${cfg.color}33`,
                    padding: "1px 6px", borderRadius: 4, flexShrink: 0,
                  }}
                >
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                <span>Due {formatDate(ms.dueDate)}</span>
                {ms.completedDate && <span style={{ color: "#00e676" }}>✓ {formatDate(ms.completedDate)}</span>}
                {ms.owner && <span>{ms.owner}</span>}
              </div>
              {ms.notes && (
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, fontStyle: "italic" }}>
                  {ms.notes}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
