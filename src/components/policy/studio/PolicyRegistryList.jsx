/**
 * PolicyRegistryList — live Policy entity rows with edit/delete actions
 * and Data-app evidence indicators.
 */

import React from "react";
import { Scale, ChevronRight, Pencil, Trash2, Database, Search } from "lucide-react";
import { StageChip, StatusChip } from "./PolicyChips";

export default function PolicyRegistryList({ policies, onEdit, onDelete }) {
  if (policies.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <Search size={24} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No policies match.</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {policies.map((policy) => (
        <div
          key={policy.id}
          className="rounded-xl px-4 py-3 flex items-start gap-4 transition-all group"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(244,114,182,0.3)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
        >
          <Scale size={16} style={{ color: "#f472b6", flexShrink: 0, marginTop: 2 }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap mb-1.5">
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{policy.title}</h3>
              <StatusChip status={policy.status} />
              {policy.priority === "high" && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "#fb923c",
                  background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)",
                  padding: "2px 5px", borderRadius: 3, letterSpacing: "0.04em",
                }}>
                  HIGH PRIORITY
                </span>
              )}
              {(policy.evidence_metric_names?.length ?? 0) > 0 && (
                <span className="flex items-center gap-1" style={{
                  fontSize: 9, fontWeight: 600, color: "#40c4ff",
                  background: "rgba(64,196,255,0.08)", border: "1px solid rgba(64,196,255,0.25)",
                  padding: "2px 6px", borderRadius: 3,
                }} title="Linked evidence metrics from the Data & Evidence app">
                  <Database size={8} /> {policy.evidence_metric_names.length} metrics
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap mb-2" style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {policy.portfolio && <span>{policy.portfolio}</span>}
              {policy.owner && <><span style={{ color: "var(--border-subtle)" }}>·</span><span>Owner: {policy.owner}</span></>}
              <span style={{ color: "var(--border-subtle)" }}>·</span>
              <span>Updated {new Date(policy.updated_date).toLocaleDateString("en-CA")}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StageChip stageKey={policy.stage} />
              {policy.category && (
                <span className="capitalize" style={{ fontSize: 10, color: "var(--text-secondary)", background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", padding: "1px 6px", borderRadius: 3 }}>
                  {policy.category.replace(/_/g, " ")}
                </span>
              )}
              {(policy.tags ?? []).map((tag) => (
                <span key={tag} style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", padding: "1px 6px", borderRadius: 3 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(policy)} className="activity-icon" style={{ width: 26, height: 26 }} title="Edit">
              <Pencil size={11} />
            </button>
            <button onClick={() => onDelete(policy)} className="activity-icon" style={{ width: 26, height: 26, color: "var(--color-error)" }} title="Delete">
              <Trash2 size={11} />
            </button>
          </div>
          <ChevronRight size={13} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 4 }} />
        </div>
      ))}
    </div>
  );
}