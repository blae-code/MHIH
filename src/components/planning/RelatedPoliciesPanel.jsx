/**
 * RelatedPoliciesPanel — lists linked policies with stage badge and navigate button
 * Props: policyIds (string[]), policies (PolicyStub[])
 */

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ScrollText, ArrowRight } from "lucide-react";

const STAGE_COLORS = {
  Active: "#00e676",
  Draft: "#ffab40",
  "Under Review": "#a78bfa",
  Negotiation: "#40c4ff",
  Archived: "var(--text-muted)",
};

export default function RelatedPoliciesPanel({ policyIds = [], policies = [] }) {
  const linked = policyIds.map((id) => policies.find((p) => p.id === id)).filter(Boolean);

  if (linked.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>
        No linked policies.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {linked.map((policy) => {
        const sc = STAGE_COLORS[policy.stage] ?? "var(--text-muted)";
        return (
          <div
            key={policy.id}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <ScrollText size={13} style={{ color: "#f472b6", flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {policy.title}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span style={{ fontSize: 9 }}>{policy.category}</span>
                <span
                  style={{
                    fontSize: 9, fontWeight: 600, color: sc,
                    background: sc + "18",
                    border: `1px solid ${sc}33`,
                    padding: "1px 5px", borderRadius: 3,
                  }}
                >
                  {policy.stage}
                </span>
              </div>
            </div>
            <Link
              to={createPageUrl("PolicyStudio")}
              style={{ color: "#f472b6", flexShrink: 0, display: "flex", alignItems: "center" }}
              title="View in Policy Studio"
            >
              <ArrowRight size={13} />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
