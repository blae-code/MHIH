/**
 * Planning & KPIs — Executive Overview Dashboard
 *
 * High-density executive entry point surfacing key signals across all planning areas.
 * Replaced the scaffold with a full orchestration overview.
 */

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Target, Flag, Activity, BarChart3, FileText, Calendar,
  ArrowRight, AlertTriangle, Clock, TrendingUp,
} from "lucide-react";
import {
  GOALS, KPIS, INITIATIVES, REPORT_CYCLES,
  getOpenReportCycles, getOverdueMilestones, getOverdueActionItems,
  computeGoalProgressFromKPIs,
} from "@/lib/planningData";
import KPIStatusBadge from "@/components/planning/KPIStatusBadge";
import ScorecardCard from "@/components/planning/ScorecardCard";
import InitiativeHealthCard from "@/components/planning/InitiativeHealthCard";
import ReportingDeadlineList from "@/components/planning/ReportingDeadlineList";
import GoalChip from "@/components/planning/GoalChip";

const QUICK_NAV = [
  { label: "Strategic Goals", page: "PlanningGoals", icon: Flag, color: "#34d399", desc: "Goals, objectives, and KPI alignment" },
  { label: "Plans", page: "PlanningPlans", icon: FileText, color: "#40c4ff", desc: "Strategic and operational plans registry" },
  { label: "Initiatives", page: "PlanningInitiatives", icon: Activity, color: "#f59e0b", desc: "Active initiatives, milestones, and actions" },
  { label: "KPI Scorecard", page: "PlanningScorecard", icon: BarChart3, color: "#a78bfa", desc: "KPI registry and quarterly scorecard views" },
  { label: "Reports", page: "PlanningReports", icon: FileText, color: "#fb923c", desc: "Reporting cadence and deliverable tracking" },
  { label: "Calendar", page: "PlanningCalendar", icon: Calendar, color: "#f472b6", desc: "Timeline of milestones and deadlines" },
];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function daysUntil(dateStr) {
  const due = new Date(dateStr);
  const now = new Date();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

export default function PlanningKPI() {
  const openCycles = getOpenReportCycles();
  const overdueMilestones = getOverdueMilestones();
  const overdueActions = getOverdueActionItems();

  // Priority initiatives: amber first, then red
  const priorityInits = [...INITIATIVES]
    .sort((a, b) => {
      const order = { red: 0, amber: 1, green: 2 };
      return (order[a.health] ?? 3) - (order[b.health] ?? 3);
    })
    .slice(0, 4);

  // At-risk KPIs
  const atRiskKpis = KPIS.filter((k) => k.status === "at-risk" || k.status === "off-track").slice(0, 3);

  // Next report deadline
  const nextReport = openCycles.find((rc) => rc.status === "open");
  const nextReportDays = nextReport ? daysUntil(nextReport.dueDate) : null;

  // Stats
  const onTrackGoals = GOALS.filter((g) => g.status === "on-track").length;
  const atRiskGoals = GOALS.filter((g) => g.status === "at-risk").length;
  const activeInits = INITIATIVES.filter((i) => i.status === "active").length;
  const openActions = INITIATIVES.flatMap((i) => i.actionItems).filter((a) => a.status !== "complete").length;

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="section-label mb-1">Red River OS · Planning & KPIs</div>
              <h1 className="mnbc-heading" style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 4 }}>
                Planning & KPIs Overview
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Ministry goals, active initiatives, KPI performance, and reporting status.
              </p>
            </div>
            <Link
              to={createPageUrl("MinistryOverview")}
              className="text-xs flex items-center gap-1 shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              Ministry Overview <ArrowRight size={10} />
            </Link>
          </div>
          <div style={{ height: 2, background: "linear-gradient(90deg, #f59e0b, transparent 70%)", borderRadius: 2, marginTop: 10 }} />
        </div>

        {/* Status banner */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Strategic Goals", value: GOALS.length, color: "#f59e0b" },
            { label: "On Track", value: onTrackGoals, color: "#00e676" },
            { label: "Goals At Risk", value: atRiskGoals, color: "#ffab40" },
            { label: "Active Initiatives", value: activeInits, color: "#40c4ff" },
            { label: "Open Actions", value: openActions, color: "#a78bfa" },
            nextReport
              ? { label: "Next Report Due", value: nextReportDays !== null && nextReportDays > 0 ? `${nextReportDays}d` : "Today", color: nextReportDays !== null && nextReportDays <= 7 ? "#ff4d4f" : "#fb923c" }
              : { label: "Reports", value: "—", color: "var(--text-muted)" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderTop: `2px solid ${s.color}` }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Goals progress strip */}
        <div className="rounded-xl p-4 mb-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Strategic Goals Progress</h2>
            <Link to={createPageUrl("PlanningGoals")} className="flex items-center gap-1 text-xs" style={{ color: "#f59e0b" }}>
              View all goals <ArrowRight size={10} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GOALS.map((goal) => {
              const progress = computeGoalProgressFromKPIs(goal.id);
              return (
                <Link
                  key={goal.id}
                  to={createPageUrl("PlanningGoals")}
                  style={{ textDecoration: "none" }}
                >
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "var(--bg-base)", border: "1px solid var(--border-subtle)", borderLeft: `3px solid ${goal.color}` }}>
                    <GoalChip goal={goal} size="xs" />
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {goal.title}
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: "var(--bg-overlay)", overflow: "hidden", marginTop: 4 }}>
                        <div style={{ height: "100%", width: `${progress}%`, background: goal.color, borderRadius: 2 }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span style={{ fontSize: 10, fontWeight: 700, color: goal.color }}>{progress}%</span>
                      <KPIStatusBadge status={goal.status} size="sm" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Two-column mid section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
          {/* Left: Active initiatives (60%) */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Priority Initiatives</h2>
              <Link to={createPageUrl("PlanningInitiatives")} className="flex items-center gap-1 text-xs" style={{ color: "#f59e0b" }}>
                View all <ArrowRight size={10} />
              </Link>
            </div>
            <div className="space-y-2">
              {priorityInits.map((init) => {
                const goals = init.goalIds.map((id) => GOALS.find((g) => g.id === id)).filter(Boolean);
                return <InitiativeHealthCard key={init.id} initiative={init} goals={goals} compact />;
              })}
            </div>
          </div>

          {/* Right: KPI spotlight (40%) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>KPIs Needing Attention</h2>
              <Link to={createPageUrl("PlanningScorecard")} className="flex items-center gap-1 text-xs" style={{ color: "#f59e0b" }}>
                Scorecard <ArrowRight size={10} />
              </Link>
            </div>
            {atRiskKpis.length === 0 ? (
              <div className="rounded-xl p-4 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <TrendingUp size={20} style={{ color: "#00e676", margin: "0 auto 8px" }} />
                <div style={{ fontSize: 12, color: "#00e676", fontWeight: 600 }}>All KPIs on track</div>
              </div>
            ) : (
              <div className="space-y-2">
                {atRiskKpis.map((kpi) => <ScorecardCard key={kpi.id} kpi={kpi} compact />)}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: 3 panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {/* Reporting deadlines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Reporting Deadlines</h2>
              <Link to={createPageUrl("PlanningReports")} className="flex items-center gap-1 text-xs" style={{ color: "#f59e0b" }}>
                View all <ArrowRight size={10} />
              </Link>
            </div>
            <ReportingDeadlineList cycles={openCycles} limit={4} />
          </div>

          {/* Overdue items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                Overdue Items
                {(overdueMilestones.length + overdueActions.length) > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#ff4d4f", background: "rgba(255,77,79,0.15)", border: "1px solid rgba(255,77,79,0.3)", padding: "1px 6px", borderRadius: 10 }}>
                    {overdueMilestones.length + overdueActions.length}
                  </span>
                )}
              </h2>
            </div>
            <div className="space-y-2">
              {overdueMilestones.slice(0, 3).map((ms) => (
                <div key={ms.id} className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                  <AlertTriangle size={11} style={{ color: "#ff4d4f", marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{ms.title}</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>Milestone · {ms.initiativeTitle}</div>
                  </div>
                </div>
              ))}
              {overdueActions.slice(0, 3 - overdueMilestones.slice(0, 3).length).map((ai) => (
                <div key={ai.id} className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                  <Clock size={11} style={{ color: "#ffab40", marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{ai.title}</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>Action · {ai.owner}</div>
                  </div>
                </div>
              ))}
              {(overdueMilestones.length + overdueActions.length) === 0 && (
                <div className="rounded-xl p-4 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: 11, color: "#00e676", fontWeight: 600 }}>No overdue items</div>
                </div>
              )}
            </div>
          </div>

          {/* Quick navigation */}
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Quick Navigation</h2>
            <div className="space-y-1.5">
              {QUICK_NAV.map((nav) => {
                const NavIcon = nav.icon;
                return (
                  <Link
                    key={nav.page}
                    to={createPageUrl(nav.page)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", textDecoration: "none" }}
                  >
                    <NavIcon size={13} style={{ color: nav.color, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{nav.label}</div>
                    </div>
                    <ArrowRight size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
