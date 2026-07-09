/**
 * PolicyRecommendationsPanel — top pending recommendations by priority.
 */

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ListOrdered, ArrowRight } from "lucide-react";

export default function PolicyRecommendationsPanel({ recs, loading }) {
  const top = recs.slice(0, 5);

  return (
    <div className="cockpit-widget-card">
      <div className="flex items-center gap-2 mb-3">
        <ListOrdered size={13} style={{ color: "#f472b6" }} />
        <span className="dashboard-section-label" style={{ marginBottom: 0 }}>Pending Recommendations</span>
        <Link to={createPageUrl("Recommendations")} className="ml-auto flex items-center gap-1 font-semibold" style={{ color: "#f472b6", fontSize: 10 }}>
          Queue <ArrowRight size={10} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: 34 }} />)}</div>
      ) : top.length === 0 ? (
        <div className="text-xs py-5 text-center" style={{ color: "var(--text-muted)" }}>
          No recommendations awaiting approval.
        </div>
      ) : (
        <div className="space-y-2">
          {top.map((r) => {
            const score = Math.max(0, Math.min(100, r.priority_score ?? 0));
            const color = score >= 70 ? "#ff4d4f" : score >= 40 ? "#fb923c" : "#40c4ff";
            return (
              <div key={r.id} className="rounded-lg px-2.5 py-2" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="truncate flex-1" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-primary)" }}>{r.title}</span>
                  <span className="tabular-nums shrink-0" style={{ fontSize: 10, fontWeight: 700, color }}>{score}</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 4, background: "var(--bg-hover)" }}>
                  <div style={{ width: `${score}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}77)`, borderRadius: 99 }} />
                </div>
                {(r.category || r.region) && (
                  <div className="mt-1" style={{ fontSize: 9, color: "var(--text-muted)" }}>
                    {[r.category?.replace(/_/g, " "), r.region].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}