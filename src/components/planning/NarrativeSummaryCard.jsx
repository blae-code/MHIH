/**
 * NarrativeSummaryCard — card for displaying quarterly/annual narrative summaries
 * Props: title, narrative, preparedBy, period, status ("draft"|"submitted"|"approved")
 */

import React from "react";
import { FileText } from "lucide-react";

const STATUS_CONFIG = {
  draft:     { color: "#ffab40", label: "Draft" },
  submitted: { color: "#40c4ff", label: "Submitted" },
  approved:  { color: "#00e676", label: "Approved" },
};

export default function NarrativeSummaryCard({ title, narrative, preparedBy, period, status = "draft" }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderLeft: "3px solid #f59e0b",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <FileText size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
            {period && (
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{period}</div>
            )}
          </div>
        </div>
        <span
          style={{
            fontSize: 10, fontWeight: 700,
            color: cfg.color,
            background: cfg.color + "18",
            border: `1px solid ${cfg.color}33`,
            padding: "2px 8px", borderRadius: 4, flexShrink: 0,
          }}
        >
          {cfg.label}
        </span>
      </div>

      <div
        className="p-3 rounded-lg"
        style={{ background: "var(--bg-overlay)", borderLeft: "2px solid rgba(245,158,11,0.4)" }}
      >
        <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
          {narrative}
        </p>
      </div>

      {preparedBy && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 10 }}>
          Prepared by {preparedBy}
        </div>
      )}
    </div>
  );
}
