/**
 * PolicyAlertsPanel — open sentinel alerts relevant to policy monitoring.
 */

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Siren, ArrowRight } from "lucide-react";

const SEVERITY_COLORS = { critical: "#ff4d4f", high: "#fb923c", medium: "#FEDD00", low: "#40c4ff" };

export default function PolicyAlertsPanel({ alerts, loading }) {
  const top = alerts.slice(0, 5);

  return (
    <div className="cockpit-widget-card">
      <div className="flex items-center gap-2 mb-3">
        <Siren size={13} style={{ color: "#ff4d4f" }} />
        <span className="dashboard-section-label" style={{ marginBottom: 0 }}>Open Alerts</span>
        <Link to={createPageUrl("AlertsCenter")} className="ml-auto flex items-center gap-1 font-semibold" style={{ color: "#f472b6", fontSize: 10 }}>
          Alerts Center <ArrowRight size={10} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: 30 }} />)}</div>
      ) : top.length === 0 ? (
        <div className="text-xs py-5 text-center" style={{ color: "var(--text-muted)" }}>
          No open alerts — monitoring is quiet.
        </div>
      ) : (
        <div className="space-y-1.5">
          {top.map((a) => {
            const c = SEVERITY_COLORS[a.severity] || "#40c4ff";
            return (
              <div key={a.id} className="flex items-start gap-2 rounded-lg px-2.5 py-2" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", borderLeft: `2px solid ${c}` }}>
                <div className="min-w-0 flex-1">
                  <div className="truncate" style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{a.summary}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)" }}>
                    {[a.metric_name, a.region].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <span className="uppercase shrink-0" style={{ fontSize: 8.5, fontWeight: 800, color: c, letterSpacing: "0.06em" }}>{a.severity}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}