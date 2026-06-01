import React, { useMemo } from "react";
import { Database, CheckCircle, AlertCircle, RefreshCw, HelpCircle } from "lucide-react";

/**
 * SourcesStatStrip — top-of-page summary for My Data Sources.
 * Cards: Total Sources · Active · Errors · Auto-Synced
 */
export default function SourcesStatStrip({ sources }) {
  const stats = useMemo(() => {
    const total = sources.length;
    const active = sources.filter(s => s.status === "active").length;
    const error = sources.filter(s => s.status === "error").length;
    const inactive = sources.filter(s => s.status === "inactive").length;
    const pending = sources.filter(s => s.status === "pending").length;
    const autoSynced = sources.filter(s => s.sync_frequency && s.sync_frequency !== "manual").length;
    const recentlySynced = sources.filter(s => {
      if (!s.last_synced) return false;
      return Date.now() - new Date(s.last_synced).getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total, active, error, inactive, pending, autoSynced, recentlySynced };
  }, [sources]);

  const CARDS = [
    {
      id: "total",
      label: "Total Sources",
      value: stats.total,
      icon: Database,
      color: "#FEDD00",
      bgColor: "rgba(254,221,0,0.08)",
      desc: stats.total > 0
        ? `${stats.inactive} disabled · ${stats.pending} pending`
        : "No sources imported yet",
      tooltip: "All data sources you've imported. Includes active, pending, disabled, and errored sources.",
    },
    {
      id: "active",
      label: "Active",
      value: stats.active,
      icon: CheckCircle,
      color: "#00e676",
      bgColor: "rgba(0,230,118,0.08)",
      desc: stats.total > 0
        ? `${Math.round((stats.active / stats.total) * 100)}% operational`
        : "No active sources",
      tooltip: "Data sources currently in the active state and available for syncing or querying.",
    },
    {
      id: "errors",
      label: "Errors",
      value: stats.error,
      icon: AlertCircle,
      color: "#ff1744",
      bgColor: "rgba(255,23,68,0.08)",
      desc: stats.error > 0
        ? `Need attention`
        : "No issues detected",
      tooltip: "Sources that failed their last sync or have configuration problems. Open the source to view details and retry.",
    },
    {
      id: "autosync",
      label: "Auto-Synced",
      value: stats.autoSynced,
      icon: RefreshCw,
      color: "#40c4ff",
      bgColor: "rgba(64,196,255,0.08)",
      desc: stats.recentlySynced > 0
        ? `${stats.recentlySynced} synced in last 7d`
        : "No recent syncs",
      tooltip: "Sources configured with a daily, weekly, or monthly automatic sync schedule. Manual-only sources are excluded.",
    },
  ];

  return (
    <div>
      <div className="dashboard-section-label mb-2">Sources Overview</div>
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