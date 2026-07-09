/**
 * PolicyEvidencePanel — shows each policy's linked evidence metrics
 * from the Data & Evidence app, with latest observed values and
 * deep links into the Data app.
 */

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Database, ArrowRight, BookOpen } from "lucide-react";
import { StageChip } from "./PolicyChips";

export default function PolicyEvidencePanel({ policies, metrics }) {
  const withEvidence = policies.filter((p) => (p.evidence_metric_names?.length ?? 0) > 0);

  // Latest observation per metric name
  const latestByName = {};
  metrics.forEach((m) => {
    const cur = latestByName[m.name];
    if (!cur || (m.year ?? 0) > (cur.year ?? 0)) latestByName[m.name] = m;
  });

  if (withEvidence.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-elevated)", border: "1px dashed var(--border-subtle)" }}>
        <Database size={22} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>No evidence linkages yet</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Edit a policy in the Registry tab and link health metrics from the Data &amp; Evidence app.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Live evidence links between policies and health metrics in the Data &amp; Evidence app.
        </p>
        <Link to={createPageUrl("MetricCatalog")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
          style={{ background: "rgba(64,196,255,0.08)", color: "#40c4ff", border: "1px solid rgba(64,196,255,0.3)" }}>
          <Database size={11} /> Metric Catalog <ArrowRight size={10} />
        </Link>
      </div>

      {withEvidence.map((policy) => (
        <div key={policy.id} className="rounded-xl p-4"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderLeft: "3px solid #40c4ff" }}>
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <BookOpen size={13} style={{ color: "#f472b6" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{policy.title}</span>
            <StageChip stageKey={policy.stage} small />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {policy.evidence_metric_names.map((name) => {
              const latest = latestByName[name];
              return (
                <Link key={name} to={createPageUrl("DataRepository")}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(64,196,255,0.45)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
                  title="Open in Data Repository">
                  <Database size={11} style={{ color: "#40c4ff", flexShrink: 0 }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate" style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{name}</div>
                    {latest ? (
                      <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
                        {latest.year}: <span style={{ color: "#40c4ff", fontWeight: 700 }}>{latest.value}</span>
                        {latest.unit ? ` ${latest.unit}` : ""} · {latest.region}
                      </div>
                    ) : (
                      <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>No observations found</div>
                    )}
                  </div>
                  <ArrowRight size={10} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}