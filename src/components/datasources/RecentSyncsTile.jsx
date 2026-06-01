/**
 * RecentSyncsTile — polished recent-activity feed for the Data Sources page.
 * Shows the most recently synced sources with status pulse, relative time,
 * and a subtle cadence badge.
 */
import React from "react";
import { CheckCircle, AlertCircle, Pause, Clock, Activity } from "lucide-react";

const STATUS_META = {
  active:   { color: "#00e676", icon: CheckCircle, label: "Active" },
  error:    { color: "#ff1744", icon: AlertCircle, label: "Error" },
  inactive: { color: "#8bafd4", icon: Pause,       label: "Paused" },
  pending:  { color: "#ffab40", icon: Clock,       label: "Pending" },
};

function relativeTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const wks = Math.floor(days / 7);
  if (wks < 5) return `${wks}w ago`;
  return new Date(iso).toLocaleDateString("en-CA");
}

export default function RecentSyncsTile({ recentSyncs }) {
  return (
    <div className="src-widget-card">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="dashboard-section-label flex items-center gap-1.5" style={{ margin: 0 }}>
            <Activity size={11} style={{ color: "#40c4ff" }} />
            Recent Syncs
          </div>
          {recentSyncs.length > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full font-bold font-mono"
              style={{
                fontSize: 9,
                background: "rgba(64,196,255,0.12)",
                color: "#40c4ff",
                border: "1px solid rgba(64,196,255,0.3)",
              }}
            >
              {recentSyncs.length}
            </span>
          )}
        </div>

        {recentSyncs.length === 0 ? (
          <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
            <Activity size={18} className="mx-auto mb-1.5 opacity-30" />
            <p className="text-xs">No sync activity yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentSyncs.map((src) => {
              const meta = STATUS_META[src.status] ?? STATUS_META.pending;
              const Icon = meta.icon;
              const isAuto = src.sync_frequency && src.sync_frequency !== "manual";
              return (
                <div
                  key={src.id}
                  className="relative pl-3 pr-2.5 py-2 rounded-md transition-all group"
                  style={{
                    background: "var(--bg-overlay)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${meta.color}55`;
                    e.currentTarget.style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.background = "var(--bg-overlay)";
                  }}
                >
                  {/* Status bar (left accent) */}
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 6,
                      bottom: 6,
                      width: 2,
                      borderRadius: "0 2px 2px 0",
                      background: meta.color,
                      boxShadow: `0 0 6px ${meta.color}88`,
                    }}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Icon size={10} style={{ color: meta.color, flexShrink: 0 }} />
                        <span
                          className="text-xs font-semibold truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {src.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 ml-[14px]">
                        <span
                          className="text-xs"
                          style={{ color: meta.color, fontSize: 9.5, fontWeight: 600 }}
                        >
                          {meta.label}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontSize: 9 }}>·</span>
                        <span
                          className="text-xs capitalize"
                          style={{ color: "var(--text-muted)", fontSize: 9.5 }}
                        >
                          {isAuto ? (
                            <span style={{ color: "var(--accent-primary)" }}>
                              {src.sync_frequency}
                            </span>
                          ) : (
                            "manual"
                          )}
                        </span>
                      </div>
                    </div>
                    <span
                      className="shrink-0 font-mono tabular-nums"
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 9.5,
                      }}
                      title={new Date(src.last_synced).toLocaleString("en-CA")}
                    >
                      {relativeTime(src.last_synced)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}