/**
 * NeedsAttentionTile — sources in error/pending state, merged from the
 * former "My Sources" page into Data Sources.
 */

import React from "react";
import { AlertCircle } from "lucide-react";

const STATUS_COLORS = {
  error: "var(--color-error)",
  pending: "var(--color-warning)",
};

export default function NeedsAttentionTile({ sources, onSelect }) {
  const needsAttention = sources.filter(s => s.status === "error" || s.status === "pending").slice(0, 4);

  return (
    <div className="src-widget-card">
      <div className="dashboard-section-label relative z-10 flex items-center gap-1.5">
        <AlertCircle size={11} style={{ color: "var(--color-error)" }} />
        Needs Attention
      </div>
      <div className="space-y-2 relative z-10">
        {needsAttention.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
            All sources healthy — no issues.
          </p>
        ) : (
          needsAttention.map(s => (
            <div key={s.id} className="p-2.5 rounded-md cursor-pointer transition-all"
              style={{ background: "var(--bg-overlay)", border: `1px solid ${s.status === "error" ? "rgba(255,23,68,0.3)" : "rgba(255,171,64,0.25)"}` }}
              onClick={() => onSelect?.(s)}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{s.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                    {s.category?.replace(/_/g, " ") || s.type}
                  </div>
                </div>
                <span className="text-xs capitalize font-semibold shrink-0" style={{ color: STATUS_COLORS[s.status] || "var(--text-muted)" }}>
                  {s.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}