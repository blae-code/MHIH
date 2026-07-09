/**
 * PolicyStatStrip — headline stats for the Policy command centre.
 *
 * Visual hierarchy rules:
 *  - Risk stats (Overdue, Critical) glow softly when non-zero.
 *  - Zero-value stats render muted so live numbers draw the eye.
 *  - Matches the OS metric-card treatment (bg-card, inset highlight, hover lift).
 */

import React from "react";
import { Inbox, UserX, CalendarClock, Flame, ListOrdered, Siren } from "lucide-react";

const CLOSED = ["completed", "rejected", "closed"];

export default function PolicyStatStrip({ requests, recs, alerts, loading }) {
  const today = new Date().toISOString().slice(0, 10);
  const open = requests.filter((r) => !CLOSED.includes(r.current_status));

  const stats = [
    { label: "Open Requests", value: open.length, color: "#40c4ff", icon: Inbox },
    { label: "Unassigned", value: open.filter((r) => !r.assigned_to_user_id).length, color: "#FEDD00", icon: UserX },
    {
      label: "Overdue",
      value: open.filter((r) => r.required_completion_date && r.required_completion_date < today).length,
      color: "#ff4d4f",
      icon: CalendarClock,
      risk: true,
    },
    { label: "Critical Urgency", value: open.filter((r) => r.urgency === "critical").length, color: "#fb923c", icon: Flame, risk: true },
    { label: "Pending Recommendations", value: recs.length, color: "#f472b6", icon: ListOrdered },
    { label: "Open Alerts", value: alerts.length, color: "#a78bfa", icon: Siren, risk: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {stats.map((s) => {
        const isZero = !loading && s.value === 0;
        const hot = !loading && s.risk && s.value > 0;
        return (
          <div
            key={s.label}
            className="rounded-xl px-3 py-2.5 relative overflow-hidden transition-all hover:-translate-y-px"
            style={{
              background: hot
                ? `linear-gradient(135deg, ${s.color}10 0%, var(--bg-card, var(--bg-elevated)) 60%)`
                : "var(--bg-card, var(--bg-elevated))",
              border: `1px solid ${hot ? s.color + "44" : "var(--border-subtle)"}`,
              boxShadow: hot
                ? `0 1px 0 rgba(255,255,255,0.04) inset, 0 0 16px ${s.color}14, 0 2px 8px rgba(0,0,0,0.3)`
                : "0 1px 0 rgba(255,255,255,0.03) inset, 0 2px 8px rgba(0,0,0,0.3)",
              opacity: isZero ? 0.75 : 1,
            }}
          >
            {/* Accent line — fades out instead of a hard stripe */}
            <div
              aria-hidden
              style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${s.color}${isZero ? "55" : ""} 0%, transparent 85%)`,
              }}
            />
            <div className="flex items-start justify-between gap-1">
              {loading ? (
                <div className="shimmer" style={{ height: 22, width: 40, marginBottom: 4 }} />
              ) : (
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: hot ? 22 : 20,
                    fontWeight: 800,
                    color: isZero ? "var(--text-muted)" : s.color,
                    lineHeight: 1.2,
                    textShadow: hot ? `0 2px 10px ${s.color}33` : "none",
                  }}
                >
                  {s.value}
                </div>
              )}
              <s.icon
                size={12}
                style={{ color: isZero ? "var(--text-muted)" : s.color, opacity: isZero ? 0.5 : 0.85, marginTop: 3, flexShrink: 0 }}
              />
            </div>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}