/**
 * RecentSyncsTile — recent-activity feed with a themed cyan header strip,
 * ambient glow, and status-tinted rows showing relative time + cadence.
 */
import React from "react";
import { CheckCircle, AlertCircle, Pause, Clock, Activity, Zap } from "lucide-react";

const ACCENT = "#40c4ff";

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
    <div
      className="rounded-xl relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, rgba(64,196,255,0.06) 0%, var(--bg-elevated) 60%)`,
        border: "1px solid var(--border-subtle)",
        boxShadow: `0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(64,196,255,0.12)`,
      }}
    >
      {/* Gradient top edge */}
      <span aria-hidden style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${ACCENT} 0%, #00e676 60%, transparent 100%)`,
      }} />
      {/* Ambient corner glow */}
      <div aria-hidden style={{
        position: "absolute", top: -40, right: -40, width: 140, height: 140,
        background: `radial-gradient(circle, ${ACCENT}33 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div className="relative p-3.5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}33 0%, ${ACCENT}11 100%)`,
                border: `1px solid ${ACCENT}55`,
                boxShadow: `0 0 10px ${ACCENT}22`,
              }}>
              <Activity size={11} style={{ color: ACCENT, strokeWidth: 2.5 }} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: ACCENT, fontSize: 10, letterSpacing: "0.1em" }}>
                Recent Syncs
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)", fontSize: 9.5 }}>
                Latest ingest activity
              </div>
            </div>
          </div>
          {recentSyncs.length > 0 && (
            <span className="px-2 py-0.5 rounded-full font-bold font-mono tabular-nums"
              style={{
                fontSize: 10,
                background: `linear-gradient(135deg, ${ACCENT}28 0%, ${ACCENT}10 100%)`,
                color: ACCENT,
                border: `1px solid ${ACCENT}55`,
                boxShadow: `0 0 8px ${ACCENT}22`,
              }}>
              {recentSyncs.length}
            </span>
          )}
        </div>

        {recentSyncs.length === 0 ? (
          <div className="text-center py-6" style={{ color: "var(--text-muted)" }}>
            <Activity size={20} className="mx-auto mb-2 opacity-30" />
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
                    background: `linear-gradient(90deg, ${meta.color}0a 0%, var(--bg-overlay) 30%)`,
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${meta.color}66`;
                    e.currentTarget.style.boxShadow = `0 0 12px ${meta.color}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span aria-hidden style={{
                    position: "absolute", left: 0, top: 6, bottom: 6, width: 2.5,
                    borderRadius: "0 2px 2px 0",
                    background: `linear-gradient(180deg, ${meta.color} 0%, ${meta.color}66 100%)`,
                    boxShadow: `0 0 8px ${meta.color}`,
                  }} />
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Icon size={10} style={{ color: meta.color, flexShrink: 0 }} />
                        <span className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {src.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 ml-[14px]">
                        <span style={{ color: meta.color, fontSize: 9.5, fontWeight: 600 }}>
                          {meta.label}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontSize: 9 }}>·</span>
                        {isAuto ? (
                          <span className="flex items-center gap-0.5" style={{ color: "var(--accent-primary)", fontSize: 9.5, fontWeight: 600 }}>
                            <Zap size={8} fill="currentColor" />{src.sync_frequency}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 9.5 }}>manual</span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono tabular-nums"
                      style={{ color: "var(--text-muted)", fontSize: 9.5 }}
                      title={new Date(src.last_synced).toLocaleString("en-CA")}>
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