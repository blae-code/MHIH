/**
 * LifecyclePipeline — the Métis policy lifecycle stages with live
 * policy counts and expandable stage detail.
 */

import React, { useState } from "react";
import { ChevronRight, CircleDot, Scale } from "lucide-react";
import { LIFECYCLE_STAGES } from "./lifecycleStages";
import { StatusChip } from "./PolicyChips";

export default function LifecyclePipeline({ policies }) {
  const [expandedStage, setExpandedStage] = useState(null);

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
        The Métis policy lifecycle reflects the Nation's governance values — from grounded research through
        community dialogue to accountable implementation and continuous improvement.
      </p>

      {/* Stage pipeline */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {LIFECYCLE_STAGES.map((stage, i) => (
          <React.Fragment key={stage.key}>
            <button
              onClick={() => setExpandedStage(expandedStage === stage.key ? null : stage.key)}
              className="flex flex-col items-center gap-1 shrink-0 rounded-lg px-3 py-2 transition-all"
              style={{
                background: expandedStage === stage.key ? stage.color + "18" : "var(--bg-elevated)",
                border: `1px solid ${expandedStage === stage.key ? stage.color + "55" : "var(--border-subtle)"}`,
                minWidth: 90,
              }}
            >
              <CircleDot size={12} style={{ color: stage.color }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: stage.color, textAlign: "center" }}>{stage.label}</span>
              <span style={{ fontSize: 9, color: "var(--text-muted)", background: "var(--bg-overlay)", borderRadius: 3, padding: "0 4px" }}>
                {policies.filter((p) => p.stage === stage.key).length} active
              </span>
            </button>
            {i < LIFECYCLE_STAGES.length - 1 && <ChevronRight size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
          </React.Fragment>
        ))}
      </div>

      <div className="space-y-3">
        {LIFECYCLE_STAGES.map((stage, i) => {
          const isExpanded = expandedStage === stage.key;
          const stagePolicies = policies.filter((p) => p.stage === stage.key);
          return (
            <div key={stage.key} className="rounded-xl overflow-hidden"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderLeft: `3px solid ${stage.color}` }}>
              <button className="w-full p-4 text-left flex items-start justify-between gap-4"
                onClick={() => setExpandedStage(isExpanded ? null : stage.key)}>
                <div className="flex-1">
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>Stage {i + 1}</div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: stage.color, marginBottom: 3 }}>{stage.label}</h3>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{stage.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {stagePolicies.length > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: stage.color,
                      background: stage.color + "18", border: `1px solid ${stage.color}33`,
                      padding: "2px 7px", borderRadius: 4,
                    }}>
                      {stagePolicies.length} {stagePolicies.length === 1 ? "policy" : "policies"}
                    </span>
                  )}
                  <ChevronRight size={12} style={{ color: "var(--text-muted)", transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                </div>
              </button>

              {isExpanded && (
                <div style={{ borderTop: `1px solid ${stage.color}22`, padding: "0 16px 16px" }}>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: stagePolicies.length ? 12 : 0, paddingTop: 12 }}>
                    {stage.detail}
                  </p>
                  {stagePolicies.length > 0 && (
                    <div className="space-y-2">
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, letterSpacing: "0.06em" }}>
                        POLICIES AT THIS STAGE
                      </div>
                      {stagePolicies.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 rounded-lg px-3 py-2"
                          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                          <Scale size={12} style={{ color: stage.color, flexShrink: 0 }} />
                          <div className="flex-1 min-w-0">
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{p.title}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{[p.portfolio, p.owner].filter(Boolean).join(" · ")}</div>
                          </div>
                          <StatusChip status={p.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}