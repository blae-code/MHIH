/**
 * PlanningPlans — Plans Registry + Workspace
 * Master-detail: list (left) + plan workspace (right)
 */

import React, { useState } from "react";
import { FolderOpen, FileText, Calendar, Users, ChevronRight } from "lucide-react";
import {
  PLANS, GOALS, INITIATIVES, POLICY_STUBS,
  getInitiativesByPlanId,
} from "@/lib/planningData";
import PlanHeader from "@/components/planning/PlanHeader";
import InitiativeHealthCard from "@/components/planning/InitiativeHealthCard";
import GoalChip from "@/components/planning/GoalChip";

const TYPE_LABELS = {
  "strategic": "Strategic Plan",
  "operational": "Operational",
  "workplan": "Workplan",
  "action-plan": "Action Plan",
};

const TYPE_COLORS = {
  "strategic": "#f59e0b",
  "operational": "#40c4ff",
  "workplan": "#34d399",
  "action-plan": "#a78bfa",
};

const STATUS_COLORS = {
  "draft":        "#ffab40",
  "approved":     "#00e676",
  "active":       "#40c4ff",
  "under-review": "#f59e0b",
  "closed":       "var(--text-muted)",
};

const TABS = ["overview", "initiatives", "documents", "review"];

export default function PlanningPlans() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [activePlanId, setActivePlanId] = useState(PLANS[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState("overview");

  const filtered = activeFilter === "all" ? PLANS : PLANS.filter((p) => p.type === activeFilter);
  const activePlan = PLANS.find((p) => p.id === activePlanId);
  const planInitiatives = activePlan ? getInitiativesByPlanId(activePlan.id) : [];

  return (
    <div className="h-full flex overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* Left panel */}
      <div className="flex-shrink-0 overflow-auto" style={{ width: 320, borderRight: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
        <div className="p-4">
          <div className="section-label mb-1">Planning & KPIs</div>
          <h2 className="mnbc-heading" style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 4 }}>Plans Registry</h2>
          <div style={{ height: 2, background: "linear-gradient(90deg, #f59e0b, transparent 70%)", borderRadius: 2, marginBottom: 12 }} />

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-1 mb-3">
            {["all", "strategic", "operational", "workplan", "action-plan"].map((f) => {
              const color = f === "all" ? "#f59e0b" : TYPE_COLORS[f];
              return (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className="px-2.5 py-1 rounded text-xs font-semibold"
                  style={{
                    background: activeFilter === f ? color + "18" : "var(--bg-overlay)",
                    color: activeFilter === f ? color : "var(--text-muted)",
                    border: activeFilter === f ? `1px solid ${color}33` : "1px solid var(--border-subtle)",
                  }}>
                  {f === "all" ? "All" : TYPE_LABELS[f] ?? f}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {filtered.map((plan) => {
              const tc = TYPE_COLORS[plan.type] ?? "#888";
              const sc = STATUS_COLORS[plan.status] ?? "#888";
              const isActive = activePlanId === plan.id;
              const linkedGoals = plan.goalIds.map((id) => GOALS.find((g) => g.id === id)).filter(Boolean);
              return (
                <button key={plan.id} onClick={() => { setActivePlanId(plan.id); setActiveTab("overview"); }}
                  className="w-full text-left rounded-xl p-3"
                  style={{
                    background: isActive ? tc + "10" : "var(--bg-base)",
                    border: isActive ? `1px solid ${tc}33` : "1px solid var(--border-subtle)",
                    borderLeft: `3px solid ${tc}`,
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{plan.title}</div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: sc, background: sc + "18", border: `1px solid ${sc}33`, padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>
                      {plan.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontSize: 9, fontWeight: 600, color: tc, background: tc + "18", border: `1px solid ${tc}33`, padding: "1px 5px", borderRadius: 3 }}>
                      {TYPE_LABELS[plan.type] ?? plan.type}
                    </span>
                    <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{plan.cycle}</span>
                  </div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {linkedGoals.map((g) => <GoalChip key={g.id} goal={g} size="xs" />)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-auto p-5">
        {!activePlan ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FolderOpen size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-muted)" }}>Select a plan to open workspace</div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 800 }}>
            <PlanHeader plan={activePlan} />

            {/* Tabs */}
            <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: "var(--bg-elevated)", width: "fit-content", border: "1px solid var(--border-subtle)" }}>
              {TABS.map((tab) => {
                const labels = { overview: "Overview", initiatives: `Initiatives (${planInitiatives.length})`, documents: `Documents (${activePlan.documents?.length ?? 0})`, review: "Review Schedule" };
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="px-4 py-1.5 rounded text-xs font-semibold transition-all"
                    style={{
                      background: activeTab === tab ? "rgba(245,158,11,0.1)" : "transparent",
                      color: activeTab === tab ? "#f59e0b" : "var(--text-muted)",
                      border: activeTab === tab ? "1px solid rgba(245,158,11,0.25)" : "1px solid transparent",
                    }}>
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Overview tab */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Description</h3>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65 }}>{activePlan.description}</p>
                </div>
                {activePlan.approvedDate && (
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                    <Calendar size={14} style={{ color: "#00e676" }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>Approved {activePlan.approvedDate}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>By {activePlan.owner}</div>
                    </div>
                  </div>
                )}
                <div className="rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Strategic Goals</h3>
                  <div className="flex flex-wrap gap-2">
                    {activePlan.goalIds.map((id) => {
                      const goal = GOALS.find((g) => g.id === id);
                      return goal ? <GoalChip key={id} goal={goal} size="sm" /> : null;
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Initiatives tab */}
            {activeTab === "initiatives" && (
              <div className="space-y-3">
                {planInitiatives.length === 0 ? (
                  <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No initiatives linked to this plan.</div>
                  </div>
                ) : planInitiatives.map((init) => {
                  const goals = init.goalIds.map((gid) => GOALS.find((g) => g.id === gid)).filter(Boolean);
                  return <InitiativeHealthCard key={init.id} initiative={init} goals={goals} />;
                })}
              </div>
            )}

            {/* Documents tab */}
            {activeTab === "documents" && (
              <div className="space-y-2">
                {(activePlan.documents ?? []).map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                    <FileText size={13} style={{ color: "#f59e0b", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{doc.title}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                        {doc.type} · Updated {doc.lastUpdated}
                      </div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)" }}>
                      {doc.url ? "Available" : "On file"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Review Schedule tab */}
            {activeTab === "review" && (
              <div className="rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} style={{ color: "#f59e0b" }} />
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Review Schedule</h3>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {activePlan.reviewSchedule ?? "No review schedule defined."}
                </p>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
                  Owner: {activePlan.owner} · Department: {activePlan.department}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
