import React, { useMemo } from "react";
import { AlertTriangle, AlertCircle, Eye, CheckCircle, HelpCircle } from "lucide-react";

/**
 * QualityStatStrip — top-of-page summary for Data Quality.
 * Cards: Open Flags · Critical · In Review · Resolved
 */
export default function QualityStatStrip({ flags }) {
  const stats = useMemo(() => ({
    open: flags.filter(f => f.status === "open").length,
    critical: flags.filter(f => f.severity === "critical" && f.status === "open").length,
    high: flags.filter(f => f.severity === "high" && f.status === "open").length,
    in_review: flags.filter(f => f.status === "in_review").length,
    resolved: flags.filter(f => f.status === "resolved").length,
    total: flags.length,
  }), [flags]);

  const CARDS = [
    {
      id: "open",
      label: "Open Flags",
      value: stats.open,
      icon: AlertTriangle,
      color: "#ff1744",
      bgColor: "rgba(255,23,68,0.08)",
      desc: stats.total > 0
        ? `${Math.round((stats.open / stats.total) * 100)}% of all flags`
        : "No flags raised",
      tooltip: "Data quality issues that have been detected but not yet reviewed or resolved. These require attention.",
    },
    {
      id: "critical",
      label: "Critical",
      value: stats.critical,
      icon: AlertCircle,
      color: "#f97316",
      bgColor: "rgba(249,115,22,0.08)",
      desc: stats.critical > 0
        ? `+${stats.high} high severity open`
        : "No critical issues",
      tooltip: "Critical-severity flags currently open. These typically indicate corrupted, missing, or wildly out-of-range values affecting analytics.",
    },
    {
      id: "in_review",
      label: "In Review",
      value: stats.in_review,
      icon: Eye,
      color: "#ffab40",
      bgColor: "rgba(255,171,64,0.08)",
      desc: stats.in_review > 0
        ? `Being investigated`
        : "Nothing in review",
      tooltip: "Flags assigned to a team member and actively being investigated. Status moves to resolved or dismissed once triaged.",
    },
    {
      id: "resolved",
      label: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
      color: "#00e676",
      bgColor: "rgba(0,230,118,0.08)",
      desc: stats.total > 0
        ? `${Math.round((stats.resolved / stats.total) * 100)}% closure rate`
        : "No resolutions yet",
      tooltip: "Flags that have been investigated and corrected. A healthy data pipeline shows a high resolution rate over time.",
    },
  ];

  return (
    <div>
      <div className="dashboard-section-label mb-2">Quality Overview</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {CARDS.map((card) => (
          <div
            key={card.id}
            className="relative overflow-hidden group"
            title={card.tooltip}
            style={{
              background: `linear-gradient(135deg, ${card.bgColor} 0%, var(--bg-elevated) 100%)`,
              border: `1.5px solid ${card.color}33`,
              cursor: "help",
              padding: 12,
              borderRadius: 10,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.35)",
              transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${card.color} 0%, transparent 100%)` }} />
            <div className="flex items-start justify-between mb-2 relative z-10">
              <span className="font-semibold uppercase tracking-wider leading-tight" style={{ color: "var(--text-secondary)", fontSize: "9px", letterSpacing: "0.05em" }}>
                {card.label}
              </span>
              <div className="flex items-center gap-1">
                <div className="p-1.5 rounded-md shrink-0 transition-all group-hover:scale-110" style={{ background: card.bgColor, boxShadow: `0 0 8px ${card.color}22` }}>
                  <card.icon size={12} style={{ color: card.color, strokeWidth: 2.5 }} />
                </div>
                <HelpCircle size={10} style={{ color: card.color, opacity: 0.5 }} />
              </div>
            </div>
            <div className="font-black mb-1 relative z-10 leading-none" style={{ color: card.color, textShadow: `0 2px 8px ${card.color}18`, fontSize: 26 }}>
              {card.value}
            </div>
            <div className="leading-snug relative z-10" style={{ color: "var(--text-secondary)", fontSize: "10.5px" }}>
              {card.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}