/**
 * PlanningInitiatives — Initiatives Registry with inline accordion expansion
 */

import React, { useState } from "react";
import { Activity, ChevronDown, ChevronUp, User, Calendar, AlertTriangle, CheckSquare } from "lucide-react";
import { INITIATIVES, GOALS, POLICY_STUBS } from "@/lib/planningData";
import GoalChip from "@/components/planning/GoalChip";
import MilestoneTimeline from "@/components/planning/MilestoneTimeline";
import RiskPanel from "@/components/planning/RiskPanel";
import LinkedEvidencePanel from "@/components/planning/LinkedEvidencePanel";
import RelatedPoliciesPanel from "@/components/planning/RelatedPoliciesPanel";

const HEALTH_COLOR = { green: "#00e676", amber: "#ffab40", red: "#ff4d4f" };

const ACTION_STATUS_COLORS = {
  "pending":     "var(--text-muted)",
  "in-progress": "#40c4ff",
  "at-risk":     "#ffab40",
  "overdue":     "#ff4d4f",
  "complete":    "#00e676",
};

const PRIORITY_COLORS = {
  high: "#ff4d4f",
  medium: "#ffab40",
  low: "var(--text-muted)",
};

const DETAIL_TABS = ["milestones", "actions", "risks", "evidence", "policies"];

export default function PlanningInitiatives() {
  const [healthFilter, setHealthFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [detailTab, setDetailTab] = useState({});

  const filtered = healthFilter === "all" ? INITIATIVES : INITIATIVES.filter((i) => i.health === healthFilter);
  const atRiskCount = INITIATIVES.filter((i) => i.health === "amber" || i.health === "red").length;

  function getDetailTab(id) {
    return detailTab[id] ?? "milestones";
  }

  function setTab(id, tab) {
    setDetailTab((prev) => ({ ...prev, [id]: tab }));
  }

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1000px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-5">
          <div className="section-label mb-1">Planning & KPIs</div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="mnbc-heading" style={{ fontSize: 22, color: "var(--text-primary)", marginBottom: 4 }}>
                Initiatives
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {INITIATIVES.length} initiatives · {atRiskCount} at risk
              </p>
            </div>
          </div>
          <div style={{ height: 2, background: "linear-gradient(90deg, #f59e0b, transparent 70%)", borderRadius: 2, marginTop: 8 }} />
        </div>

        {/* Filter row */}
        <div className="flex gap-1 mb-4">
          {["all", "green", "amber", "red"].map((f) => {
            const color = f === "all" ? "#f59e0b" : HEALTH_COLOR[f];
            const labels = { all: "All", green: "On Track", amber: "At Risk", red: "Off Track" };
            return (
              <button key={f} onClick={() => setHealthFilter(f)}
                className="px-3 py-1.5 rounded text-xs font-semibold"
                style={{
                  background: healthFilter === f ? color + "18" : "var(--bg-elevated)",
                  color: healthFilter === f ? color : "var(--text-muted)",
                  border: healthFilter === f ? `1px solid ${color}33` : "1px solid var(--border-subtle)",
                }}>
                {labels[f]}
              </button>
            );
          })}
        </div>

        {/* Initiative list */}
        <div className="space-y-2">
          {filtered.map((init) => {
            const hc = HEALTH_COLOR[init.health] ?? "#888";
            const isExpanded = expandedId === init.id;
            const goals = init.goalIds.map((id) => GOALS.find((g) => g.id === id)).filter(Boolean);
            const completedMs = init.milestones.filter((m) => m.status === "complete").length;
            const totalMs = init.milestones.length;
            const openActions = init.actionItems.filter((a) => a.status !== "complete").length;
            const msProgress = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0;
            const tab = getDetailTab(init.id);

            return (
              <div key={init.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                {/* Collapsed row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : init.id)}
                  className="w-full text-left px-4 py-3"
                  style={{ background: "var(--bg-elevated)", borderBottom: isExpanded ? "1px solid var(--border-subtle)" : "none" }}
                >
                  <div className="flex items-center gap-3">
                    {/* Health dot */}
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: hc, flexShrink: 0 }} title={init.health} />

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {init.title}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        <span className="flex items-center gap-1"><User size={9} />{init.lead}</span>
                        <span className="flex items-center gap-1"><Calendar size={9} />{init.endDate}</span>
                        <span>{init.department}</span>
                      </div>
                    </div>

                    {/* Right: goals + progress + toggle */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden md:flex gap-1 flex-wrap">
                        {goals.map((g) => <GoalChip key={g.id} goal={g} size="xs" />)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        <div style={{ width: 48, height: 3, borderRadius: 2, background: "var(--bg-overlay)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${msProgress}%`, background: hc }} />
                        </div>
                        <span style={{ fontWeight: 600, color: hc }}>{msProgress}%</span>
                      </div>
                      <span style={{ fontSize: 10, color: openActions > 0 ? "#ffab40" : "var(--text-muted)" }}>
                        {openActions} open
                      </span>
                      {init.riskLevel === "high" && (
                        <AlertTriangle size={12} style={{ color: "#ff4d4f" }} />
                      )}
                      {isExpanded ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ background: "var(--bg-base)" }}>
                    {/* Description */}
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{init.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {init.tags?.map((tag) => (
                          <span key={tag} style={{ fontSize: 9, color: "var(--text-muted)", background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", padding: "1px 6px", borderRadius: 3 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Detail tabs */}
                    <div className="flex gap-1 px-4 py-2" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
                      {DETAIL_TABS.map((t) => {
                        const labels = {
                          milestones: `Milestones (${init.milestones.length})`,
                          actions: `Actions (${init.actionItems.length})`,
                          risks: `Risks (${init.risks.length})`,
                          evidence: "Evidence",
                          policies: "Policies",
                        };
                        return (
                          <button key={t} onClick={() => setTab(init.id, t)}
                            className="px-3 py-1 rounded text-xs font-semibold"
                            style={{
                              background: tab === t ? "rgba(245,158,11,0.1)" : "transparent",
                              color: tab === t ? "#f59e0b" : "var(--text-muted)",
                              border: tab === t ? "1px solid rgba(245,158,11,0.25)" : "1px solid transparent",
                            }}>
                            {labels[t]}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-4">
                      {tab === "milestones" && <MilestoneTimeline milestones={init.milestones} />}

                      {tab === "actions" && (
                        <div className="space-y-2">
                          {init.actionItems.length === 0 ? (
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No action items.</div>
                          ) : init.actionItems.map((ai) => {
                            const sc = ACTION_STATUS_COLORS[ai.status] ?? "var(--text-muted)";
                            const pc = PRIORITY_COLORS[ai.priority] ?? "var(--text-muted)";
                            return (
                              <div key={ai.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: sc }} />
                                <div className="flex-1 min-w-0">
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{ai.title}</div>
                                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                                    {ai.owner} · Due {ai.dueDate}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span style={{ fontSize: 9, fontWeight: 600, color: pc }}>{ai.priority}</span>
                                  <span style={{ fontSize: 9, fontWeight: 600, color: sc, background: sc + "18", border: `1px solid ${sc}33`, padding: "1px 5px", borderRadius: 3 }}>
                                    {ai.status.replace("-", " ")}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {tab === "risks" && <RiskPanel risks={init.risks} />}

                      {tab === "evidence" && (
                        <LinkedEvidencePanel snapshotIds={init.linkedEvidenceSnapshotIds} mhihLinks={init.mhihLinks} />
                      )}

                      {tab === "policies" && (
                        <RelatedPoliciesPanel policyIds={init.linkedPolicyIds} policies={POLICY_STUBS} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
