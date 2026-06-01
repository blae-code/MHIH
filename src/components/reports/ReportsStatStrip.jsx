import React, { useMemo } from "react";
import { FileText, Calendar, CheckCircle2, Clock, HelpCircle } from "lucide-react";

/**
 * ReportsStatStrip — top-of-page summary cards, matching Dashboard's stat_cards pattern.
 * Cards: Total Reports · Generated · Scheduled Active · Last 7 Days
 */
export default function ReportsStatStrip({ reports, configs }) {
  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const generated = reports.filter((r) => r.status === "generated" || r.status === "exported").length;
    const recent = reports.filter((r) => {
      const t = r.generated_at ? new Date(r.generated_at).getTime() : new Date(r.created_date || 0).getTime();
      return t >= sevenDaysAgo;
    }).length;
    const activeSchedules = configs.filter((c) => c.status === "active").length;
    return {
      total: reports.length,
      generated,
      activeSchedules,
      pausedSchedules: configs.length - activeSchedules,
      recent,
    };
  }, [reports, configs]);

  const CARDS = [
    {
      id: "total",
      label: "Total Reports",
      value: stats.total,
      icon: FileText,
      color: "#FEDD00",
      bgColor: "rgba(254,221,0,0.08)",
      desc: stats.total > 0
        ? `${stats.total} custom report${stats.total === 1 ? "" : "s"} in library`
        : "No reports created yet",
      tooltip: "Total number of custom reports created in the system, including drafts and generated outputs.",
    },
    {
      id: "generated",
      label: "Generated",
      value: stats.generated,
      icon: CheckCircle2,
      color: "#00e676",
      bgColor: "rgba(0,230,118,0.08)",
      desc: stats.total > 0
        ? `${Math.round((stats.generated / stats.total) * 100)}% of reports ready`
        : "Awaiting first generation",
      tooltip: "Reports that have been successfully generated and are ready to download or export. Draft reports are excluded.",
    },
    {
      id: "schedules",
      label: "Active Schedules",
      value: stats.activeSchedules,
      icon: Calendar,
      color: "#40c4ff",
      bgColor: "rgba(64,196,255,0.08)",
      desc: stats.pausedSchedules > 0
        ? `${stats.activeSchedules} running · ${stats.pausedSchedules} paused`
        : stats.activeSchedules > 0
          ? "All schedules active"
          : "No automated schedules",
      tooltip: "Scheduled report configurations currently running on daily, weekly, or monthly cadence. Recipients receive auto-generated outputs.",
    },
    {
      id: "recent",
      label: "Last 7 Days",
      value: stats.recent,
      icon: Clock,
      color: "#a78bfa",
      bgColor: "rgba(167,139,250,0.08)",
      desc: stats.recent > 0
        ? `${stats.recent} new this week`
        : "No recent activity",
      tooltip: "Reports created or generated within the past 7 days. Indicates how actively the reports system is being used.",
    },
  ];

  return (
    <div>
      <div className="dashboard-section-label mb-2">Reports Overview</div>
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