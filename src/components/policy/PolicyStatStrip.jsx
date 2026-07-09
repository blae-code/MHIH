/**
 * PolicyStatStrip — headline stats for the Policy command centre.
 */

import React from "react";

const CLOSED = ["completed", "rejected", "closed"];

export default function PolicyStatStrip({ requests, recs, alerts, loading }) {
  const today = new Date().toISOString().slice(0, 10);
  const open = requests.filter((r) => !CLOSED.includes(r.current_status));

  const stats = [
    { label: "Open Requests", value: open.length, color: "#40c4ff" },
    { label: "Unassigned", value: open.filter((r) => !r.assigned_to_user_id).length, color: "#FEDD00" },
    {
      label: "Overdue",
      value: open.filter((r) => r.required_completion_date && r.required_completion_date < today).length,
      color: "#ff4d4f",
    },
    { label: "Critical Urgency", value: open.filter((r) => r.urgency === "critical").length, color: "#fb923c" },
    { label: "Pending Recommendations", value: recs.length, color: "#f472b6" },
    { label: "Open Alerts", value: alerts.length, color: "#a78bfa" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl px-3 py-2.5"
          style={{
            background: "var(--bg-card, var(--bg-elevated))",
            border: "1px solid var(--border-subtle)",
            borderTop: `2px solid ${s.color}`,
            boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {loading ? (
            <div className="shimmer" style={{ height: 22, width: 40, marginBottom: 4 }} />
          ) : (
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>
              {s.value}
            </div>
          )}
          <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}