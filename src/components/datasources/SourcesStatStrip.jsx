import React, { useMemo } from "react";
import { Database, CheckCircle, AlertCircle, Clock, HelpCircle } from "lucide-react";

/**
 * SourcesStatStrip — top-of-page summary for the Data Sources catalog.
 * Cards: Total · Active · Errors · Scheduled
 */
export default function SourcesStatStrip({ sources, failedSyncCount = 0 }) {
  const stats = useMemo(() => {
    const total = sources.length;
    const active = sources.filter(s => s.status === "active").length;
    const errors = sources.filter(s => s.status === "error").length;
    const scheduled = sources.filter(s => s.sync_frequency && s.sync_frequency !== "manual").length;
    const inactive = sources.filter(s => s.status === "inactive").length;
    const pending = sources.filter(s => s.status === "pending").length;
    const lastSyncedRecord = sources
      .filter(s => s.last_synced)
      .sort((a, b) => new Date(b.last_synced) - new Date(a.last_synced))[0];
    return { total, active, errors, scheduled, inactive, pending, lastSyncedRecord };
  }, [sources]);

  const lastSyncRel = stats.lastSyncedRecord
    ? new Date(stats.lastSyncedRecord.last_synced).toLocaleDateString("en-CA")
    : null;

  const CARDS = [
    {
      id: "total",
      label: "Total Sources",
      value: stats.total,
      icon: Database,
      color: "#FEDD00",
      bgColor: "rgba(254,221,0,0.08)",
      desc: stats.total > 0
        ? `${stats.inactive} inactive · ${stats.pending} pending`
        : "No sources connected",
      tooltip: "Total registered data sources, including active, inactive, pending, and errored. Each can be synced manually or on a schedule.",
    },
    {
      id: "active",
      label: "Active",
      value: stats.active,
      icon: CheckCircle,
      color: "#00e676",
      bgColor: "rgba(0,230,118,0.08)",
      desc: stats.total > 0
        ? `${Math.round((stats.active / stats.total) * 100)}% of sources running`
        : "No active sources",
      tooltip: "Sources currently set to active and eligible to pull data. Inactive sources are paused and won't auto-sync.",
    },
    {
      id: "errors",
      label: "Errors",
      value: stats.errors + failedSyncCount,
      icon: AlertCircle,
      color: stats.errors + failedSyncCount > 0 ? "#ff1744" : "#4a6a8a",
      bgColor: stats.errors + failedSyncCount > 0 ? "rgba(255,23,68,0.08)" : "rgba(74,106,138,0.08)",
      desc: stats.errors > 0 || failedSyncCount > 0
        ? `${stats.errors} bad config · ${failedSyncCount} failed jobs`
        : "All clear — no failures",
      tooltip: "Sources in error state plus recent failed sync jobs. Click 'Sync Logs' in the header to review and re-run failures.",
    },
    {
      id: "scheduled",
      label: "Scheduled",
      value: stats.scheduled,
      icon: Clock,
      color: "#40c4ff",
      bgColor: "rgba(64,196,255,0.08)",
      desc: lastSyncRel
        ? `Last sync: ${lastSyncRel}`
        : stats.scheduled > 0
          ? "Awaiting first scheduled run"
          : "No schedules configured",
      tooltip: "Sources with an automated sync cadence (daily, weekly, monthly). Manual sources only refresh when triggered.",
    },
  ];

  return (
    <div>
      <div className="dashboard-section-label mb-2">Data Sources Overview</div>
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