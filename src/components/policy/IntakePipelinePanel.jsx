/**
 * IntakePipelinePanel — live intake status funnel + most recent requests.
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ClipboardCheck, ArrowRight, User } from "lucide-react";

const STATUS_ORDER = [
  ["submitted", "#40c4ff"],
  ["received", "#8bafd4"],
  ["in_review", "#a78bfa"],
  ["assigned", "#FEDD00"],
  ["in_progress", "#fb923c"],
  ["proofing", "#f472b6"],
  ["sent_for_approval", "#34d399"],
  ["completed", "#52c41a"],
];

const URGENCY_COLORS = { low: "#52c41a", medium: "#40c4ff", high: "#faad14", critical: "#ff4d4f" };

export default function IntakePipelinePanel({ requests, loading }) {
  const navigate = useNavigate();
  const counts = {};
  requests.forEach((r) => { counts[r.current_status] = (counts[r.current_status] || 0) + 1; });
  const max = Math.max(1, ...STATUS_ORDER.map(([s]) => counts[s] || 0));
  const recent = requests.slice(0, 6);

  return (
    <div className="cockpit-widget-card">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardCheck size={13} style={{ color: "#FEDD00" }} />
        <span className="dashboard-section-label" style={{ marginBottom: 0 }}>Intake Pipeline</span>
        <Link to={createPageUrl("PolicyRequestTable")} className="ml-auto flex items-center gap-1 text-xs font-semibold" style={{ color: "#f472b6", fontSize: 10 }}>
          All requests <ArrowRight size={10} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 18 }} />)}</div>
      ) : requests.length === 0 ? (
        <div className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>
          No policy requests yet.{" "}
          <Link to={createPageUrl("PolicyRequestForm")} className="underline" style={{ color: "#FEDD00" }}>Submit one →</Link>
        </div>
      ) : (
        <>
          {/* Status funnel */}
          <div className="space-y-1.5 mb-4">
            {STATUS_ORDER.map(([status, color]) => {
              const n = counts[status] || 0;
              if (n === 0) return null;
              return (
                <div key={status} className="flex items-center gap-2">
                  <span className="capitalize shrink-0" style={{ fontSize: 10, color: "var(--text-secondary)", width: 110 }}>
                    {status.replace(/_/g, " ")}
                  </span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "var(--bg-overlay)" }}>
                    <div style={{ width: `${(n / max) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 99, boxShadow: `0 0 8px ${color}55` }} />
                  </div>
                  <span className="tabular-nums shrink-0" style={{ fontSize: 10, fontWeight: 700, color, width: 22, textAlign: "right" }}>{n}</span>
                </div>
              );
            })}
          </div>

          {/* Recent requests */}
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
            Most Recent
          </div>
          <div className="space-y-1.5">
            {recent.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(createPageUrl("PolicyRequestTable"))}
                className="w-full text-left flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(244,114,182,0.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: URGENCY_COLORS[r.urgency] || "#40c4ff", boxShadow: `0 0 6px ${URGENCY_COLORS[r.urgency] || "#40c4ff"}` }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-primary)" }}>{r.request_title}</div>
                  <div className="flex items-center gap-2" style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
                    <span>{r.department}</span>
                    {r.assigned_to_user_name && (
                      <span className="flex items-center gap-1"><User size={8} />{r.assigned_to_user_name}</span>
                    )}
                  </div>
                </div>
                <span className="tag capitalize shrink-0" style={{ fontSize: 9 }}>
                  {r.current_status?.replace(/_/g, " ")}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}