/**
 * RiskPanel — risk register panel with likelihood × impact classification
 * Props: risks (Risk[]), collapsible (bool)
 */

import React, { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

const SEVERITY_COLOR = {
  "high-high":    "#ff4d4f",
  "high-medium":  "#ffab40",
  "medium-high":  "#ffab40",
  "medium-medium":"#ffab40",
  "high-low":     "#40c4ff",
  "low-high":     "#40c4ff",
  "medium-low":   "var(--text-muted)",
  "low-medium":   "var(--text-muted)",
  "low-low":      "var(--text-muted)",
};

function severityColor(likelihood, impact) {
  return SEVERITY_COLOR[`${likelihood}-${impact}`] ?? "var(--text-muted)";
}

const STATUS_COLORS = {
  open:      "#ffab40",
  mitigated: "#00e676",
  closed:    "var(--text-muted)",
};

export default function RiskPanel({ risks = [], collapsible = false }) {
  const [expanded, setExpanded] = useState(!collapsible);
  const [expandedRisk, setExpandedRisk] = useState(null);

  if (risks.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>
        No risks recorded.
      </div>
    );
  }

  return (
    <div>
      {collapsible && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold mb-2"
          style={{ color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <AlertTriangle size={13} style={{ color: "#ffab40" }} />
          Risks ({risks.length})
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}

      {expanded && (
        <div className="space-y-2">
          {risks.map((risk) => {
            const sc = severityColor(risk.likelihood, risk.impact);
            const isOpen = expandedRisk === risk.id;
            return (
              <div
                key={risk.id}
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${sc}33`, background: "var(--bg-elevated)" }}
              >
                <button
                  onClick={() => setExpandedRisk(isOpen ? null : risk.id)}
                  className="w-full text-left px-3 py-2.5 flex items-start gap-3"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <AlertTriangle size={13} style={{ color: sc, marginTop: 1, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{risk.title}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap" style={{ fontSize: 9 }}>
                      <span style={{ color: sc }}>↑ {risk.likelihood} likelihood · {risk.impact} impact</span>
                      <span style={{ color: STATUS_COLORS[risk.status] ?? "#888" }}>{risk.status}</span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={12} style={{ color: "var(--text-muted)", marginTop: 2 }} /> : <ChevronDown size={12} style={{ color: "var(--text-muted)", marginTop: 2 }} />}
                </button>

                {isOpen && (
                  <div className="px-3 pb-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "8px 0 6px", lineHeight: 1.5 }}>
                      {risk.description}
                    </p>
                    {risk.mitigationStrategy && (
                      <div className="p-2 rounded-lg" style={{ background: "var(--bg-overlay)", borderLeft: "2px solid #00e676" }}>
                        <div style={{ fontSize: 9, color: "#00e676", fontWeight: 600, marginBottom: 3 }}>MITIGATION</div>
                        <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                          {risk.mitigationStrategy}
                        </p>
                      </div>
                    )}
                    {risk.owner && (
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>Owner: {risk.owner}</div>
                    )}
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
