import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Pin, PinOff, RefreshCw } from "lucide-react";

export default function PinnedMetrics({ pinnedIds, onUnpin }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pinnedIds || pinnedIds.length === 0) { setLoading(false); return; }
    Promise.all(pinnedIds.map(id => base44.entities.HealthMetric.filter({ id }, "-year", 1).catch(() => [])))
      .then(results => setMetrics(results.flat()))
      .finally(() => setLoading(false));
  }, [pinnedIds?.join(",")]);

  if (!pinnedIds || pinnedIds.length === 0) {
    return (
      <div className="metric-card">
        <div className="flex items-center gap-2 mb-3">
          <Pin size={13} style={{ color: "var(--accent-primary)" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Pinned Metrics</span>
        </div>
        <div className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
          No pinned metrics. Pin metrics from the Data Repository for quick access.
        </div>
      </div>
    );
  }

  return (
    <div className="metric-card">
      <div className="flex items-center gap-2 mb-3">
        <Pin size={13} style={{ color: "var(--accent-primary)" }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Pinned Metrics</span>
      </div>
      {loading ? (
        <div className="flex justify-center py-4"><RefreshCw size={13} className="animate-spin" style={{ color: "var(--text-muted)" }} /></div>
      ) : (
        <div className="space-y-2">
          {metrics.map(m => (
            <div key={m.id} className="flex items-center justify-between py-1.5 px-2 rounded"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{m.name}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                  {m.category?.replace(/_/g, " ")} · {m.region} · {m.year}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
                  {m.value}{m.unit || ""}
                </span>
                <button onClick={() => onUnpin(m.id)} title="Unpin" className="activity-icon" style={{ width: 20, height: 20 }}>
                  <PinOff size={11} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}