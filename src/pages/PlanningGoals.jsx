/**
 * PlanningGoals — Strategic Goals Registry
 * Two-column: goals list (left) + goal detail workspace (right)
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Flag, Target, ChevronRight, ArrowRight } from "lucide-react";
import {
  GOALS, KPIS, PLANS, POLICY_STUBS,
  getKpisByGoalId, getInitiativesByGoalId, computeGoalProgressFromKPIs,
} from "@/lib/planningData";
import KPIStatusBadge from "@/components/planning/KPIStatusBadge";
import ScorecardCard from "@/components/planning/ScorecardCard";
import InitiativeHealthCard from "@/components/planning/InitiativeHealthCard";
import GoalChip from "@/components/planning/GoalChip";
import RelatedPoliciesPanel from "@/components/planning/RelatedPoliciesPanel";
import LinkedEvidencePanel from "@/components/planning/LinkedEvidencePanel";

function ProgressRing({ progress, color, size = 44 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (progress / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-overlay)" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ fontSize: 10, fontWeight: 700, fill: color }}>
        {progress}%
      </text>
    </svg>
  );
}

const PILLAR_COLORS = ["#f59e0b", "#40c4ff", "#34d399", "#a78bfa", "#f472b6"];

export default function PlanningGoals() {
  const [activeGoalId, setActiveGoalId] = useState(GOALS[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all" ? GOALS : GOALS.filter((g) => g.status === statusFilter);
  const activeGoal = GOALS.find((g) => g.id === activeGoalId);
  const goalKpis = activeGoal ? getKpisByGoalId(activeGoal.id) : [];
  const goalInitiatives = activeGoal ? getInitiativesByGoalId(activeGoal.id) : [];
  const linkedPlans = activeGoal ? PLANS.filter((p) => p.goalIds.includes(activeGoal.id)) : [];

  return (
    <div className="h-full flex overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* Left panel — Goals list */}
      <div
        className="flex-shrink-0 overflow-auto"
        style={{ width: 300, borderRight: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}
      >
        <div className="p-4">
          <div className="section-label mb-1">Planning & KPIs</div>
          <h2 className="mnbc-heading" style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 4 }}>
            Strategic Goals
          </h2>
          <div style={{ height: 2, background: "linear-gradient(90deg, #f59e0b, transparent 70%)", borderRadius: 2, marginBottom: 12 }} />

          {/* Status filter */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {["all", "on-track", "at-risk", "off-track"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className="px-2.5 py-1 rounded text-xs font-semibold"
                style={{
                  background: statusFilter === f ? "rgba(245,158,11,0.1)" : "var(--bg-overlay)",
                  color: statusFilter === f ? "#f59e0b" : "var(--text-muted)",
                  border: statusFilter === f ? "1px solid rgba(245,158,11,0.25)" : "1px solid var(--border-subtle)",
                }}
              >
                {f === "all" ? "All" : f.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((goal) => {
              const progress = computeGoalProgressFromKPIs(goal.id);
              const isActive = activeGoalId === goal.id;
              return (
                <button
                  key={goal.id}
                  onClick={() => setActiveGoalId(goal.id)}
                  className="w-full text-left rounded-xl p-3"
                  style={{
                    background: isActive ? goal.color + "12" : "var(--bg-base)",
                    border: isActive ? `1px solid ${goal.color}44` : "1px solid var(--border-subtle)",
                    borderLeft: `3px solid ${goal.color}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: goal.color }}>{goal.code}</span>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3, marginTop: 1 }}>
                        {goal.title}
                      </div>
                    </div>
                    <KPIStatusBadge status={goal.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{goal.cycle}</span>
                    <div className="flex items-center gap-1">
                      <div style={{ height: 3, width: 48, borderRadius: 2, background: "var(--bg-overlay)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${progress}%`, background: goal.color, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: goal.color }}>{progress}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel — Goal detail */}
      <div className="flex-1 overflow-auto p-5">
        {!activeGoal ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Flag size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-muted)" }}>Select a goal to view details</div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 760 }}>
            {/* Goal header */}
            <div
              className="rounded-xl p-4 mb-5"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderLeft: `4px solid ${activeGoal.color}` }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 12, fontWeight: 800, color: activeGoal.color }}>{activeGoal.code}</span>
                    <KPIStatusBadge status={activeGoal.status} />
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    {activeGoal.title}
                  </h2>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{activeGoal.description}</p>
                </div>
                <ProgressRing progress={computeGoalProgressFromKPIs(activeGoal.id)} color={activeGoal.color} />
              </div>
              <div className="flex items-center gap-3 flex-wrap mt-3" style={{ fontSize: 11 }}>
                <span style={{ color: "var(--text-muted)" }}>Cycle: <strong style={{ color: "var(--text-secondary)" }}>{activeGoal.cycle}</strong></span>
                <span style={{ color: "var(--text-muted)" }}>Owner: <strong style={{ color: "var(--text-secondary)" }}>{activeGoal.owner}</strong></span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {activeGoal.pillars.map((p, i) => (
                  <span key={p} style={{ fontSize: 10, fontWeight: 600, color: PILLAR_COLORS[i % PILLAR_COLORS.length], background: PILLAR_COLORS[i % PILLAR_COLORS.length] + "18", border: `1px solid ${PILLAR_COLORS[i % PILLAR_COLORS.length]}33`, padding: "1px 7px", borderRadius: 4 }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Objectives */}
            <div className="mb-5">
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                Objectives ({activeGoal.objectives.length})
              </h3>
              <div className="space-y-2">
                {activeGoal.objectives.map((obj) => (
                  <div key={obj.id} className="rounded-xl px-3 py-2.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{obj.title}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{obj.description}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }}>
                        Target {obj.targetYear}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KPI Grid */}
            {goalKpis.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    KPIs ({goalKpis.length})
                  </h3>
                  <Link to={createPageUrl("PlanningScorecard")} className="flex items-center gap-1 text-xs" style={{ color: "#f59e0b" }}>
                    View scorecard <ArrowRight size={10} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {goalKpis.map((kpi) => <ScorecardCard key={kpi.id} kpi={kpi} compact />)}
                </div>
              </div>
            )}

            {/* Linked Plans */}
            {linkedPlans.length > 0 && (
              <div className="mb-5">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Linked Plans ({linkedPlans.length})
                </h3>
                <div className="space-y-2">
                  {linkedPlans.map((plan) => (
                    <Link
                      key={plan.id}
                      to={createPageUrl("PlanningPlans")}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", textDecoration: "none" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{plan.title}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{plan.type} · {plan.cycle} · {plan.department}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>
                        {plan.status}
                      </span>
                      <ChevronRight size={13} style={{ color: "var(--text-muted)" }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Initiatives */}
            {goalInitiatives.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    Initiatives ({goalInitiatives.length})
                  </h3>
                  <Link to={createPageUrl("PlanningInitiatives")} className="flex items-center gap-1 text-xs" style={{ color: "#f59e0b" }}>
                    View all <ArrowRight size={10} />
                  </Link>
                </div>
                <div className="space-y-2">
                  {goalInitiatives.map((init) => {
                    const goals = init.goalIds.map((gid) => GOALS.find((g) => g.id === gid)).filter(Boolean);
                    return <InitiativeHealthCard key={init.id} initiative={init} goals={goals} compact />;
                  })}
                </div>
              </div>
            )}

            {/* Related Policies */}
            {activeGoal.linkedPolicyIds?.length > 0 && (
              <div className="mb-5">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Related Policies
                </h3>
                <RelatedPoliciesPanel policyIds={activeGoal.linkedPolicyIds} policies={POLICY_STUBS} />
              </div>
            )}

            {/* MHIH Evidence Links */}
            {activeGoal.linkedMhihPages?.length > 0 && (
              <div className="mb-5">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  MHIH Links
                </h3>
                <LinkedEvidencePanel mhihLinks={activeGoal.linkedMhihPages.map((page) => ({ page, label: page, description: `View ${page} in MHIH` }))} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
