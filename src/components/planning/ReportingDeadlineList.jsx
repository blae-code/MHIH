/**
 * ReportingDeadlineList — compact list of upcoming/open reporting deadlines
 * Props: cycles (ReportCycle[]), limit (number)
 */

import React from "react";
import { Calendar, Clock } from "lucide-react";

const STATUS_CONFIG = {
  open:      { color: "#f59e0b", label: "Open" },
  upcoming:  { color: "#40c4ff", label: "Upcoming" },
  published: { color: "#00e676", label: "Published" },
  "in-review": { color: "#a78bfa", label: "In Review" },
  closed:    { color: "var(--text-muted)", label: "Closed" },
};

const TYPE_LABELS = {
  quarterly: "Quarterly",
  "semi-annual": "Semi-Annual",
  annual: "Annual",
  "ad-hoc": "Ad-hoc",
};

function daysUntil(dateStr) {
  const due = new Date(dateStr);
  const now = new Date();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days) {
  if (days <= 7) return "#ff4d4f";
  if (days <= 21) return "#ffab40";
  return "var(--text-muted)";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export default function ReportingDeadlineList({ cycles = [], limit = 5 }) {
  const visible = cycles.slice(0, limit);
  if (visible.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>
        No upcoming reporting deadlines.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visible.map((cycle) => {
        const cfg = STATUS_CONFIG[cycle.status] ?? { color: "#888", label: cycle.status };
        const days = daysUntil(cycle.dueDate);
        const uc = urgencyColor(days);

        return (
          <div
            key={cycle.id}
            className="rounded-xl px-3 py-2.5 flex items-center gap-3"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <Calendar size={13} style={{ color: cfg.color, flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {cycle.title}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                {TYPE_LABELS[cycle.type] ?? cycle.type} · Due {formatDate(cycle.dueDate)}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                style={{
                  fontSize: 10, fontWeight: 700, color: uc,
                  background: uc + "18",
                  border: `1px solid ${uc}33`,
                  padding: "1px 6px", borderRadius: 4,
                  display: "flex", alignItems: "center", gap: 3,
                }}
              >
                <Clock size={9} />
                {days > 0 ? `${days}d` : "Overdue"}
              </span>
              <span
                style={{
                  fontSize: 9, fontWeight: 600, color: cfg.color,
                  background: cfg.color + "18",
                  border: `1px solid ${cfg.color}33`,
                  padding: "1px 6px", borderRadius: 4,
                }}
              >
                {cfg.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
