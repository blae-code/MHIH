/**
 * PlanningReports — Reporting Cadence
 * Two sections: Reporting Calendar overview + Cycle Detail
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Calendar, Clock, ArrowRight, CheckSquare, Users } from "lucide-react";
import { REPORT_CYCLES, KPIS, INITIATIVES, getScorecardForPeriod } from "@/lib/planningData";
import ReportingDeadlineList from "@/components/planning/ReportingDeadlineList";
import NarrativeSummaryCard from "@/components/planning/NarrativeSummaryCard";

const STATUS_CONFIG = {
  published:   { color: "#00e676", label: "Published" },
  open:        { color: "#f59e0b", label: "Open" },
  upcoming:    { color: "#40c4ff", label: "Upcoming" },
  "in-review": { color: "#a78bfa", label: "In Review" },
  closed:      { color: "var(--text-muted)", label: "Closed" },
};

const TYPE_LABELS = {
  quarterly: "Quarterly",
  "semi-annual": "Semi-Annual",
  annual: "Annual",
  "ad-hoc": "Ad-hoc",
};

const DELIVERABLE_STATUS_COLORS = {
  pending:     "var(--text-muted)",
  "in-progress": "#40c4ff",
  complete:    "#00e676",
  overdue:     "#ff4d4f",
};

function daysUntil(dateStr) {
  const due = new Date(dateStr);
  const now = new Date();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export default function PlanningReports() {
  const [selectedCycleId, setSelectedCycleId] = useState(REPORT_CYCLES[2]?.id ?? null);
  const activeCycle = REPORT_CYCLES.find((rc) => rc.id === selectedCycleId);
  const linkedKpis = activeCycle ? KPIS.filter((k) => activeCycle.linkedKpiIds.includes(k.id)) : [];
  const linkedInits = activeCycle ? INITIATIVES.filter((i) => activeCycle.linkedInitiativeIds.includes(i.id)) : [];
  const narrativeEntries = activeCycle ? getScorecardForPeriod(activeCycle.period.replace("–", "-")) : [];
  const openCycles = REPORT_CYCLES.filter((rc) => rc.status === "open" || rc.status === "upcoming");

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1000px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-5">
          <div className="section-label mb-1">Planning & KPIs</div>
          <h1 className="mnbc-heading" style={{ fontSize: 22, color: "var(--text-primary)", marginBottom: 4 }}>
            Reporting Cadence
          </h1>
          <div style={{ height: 2, background: "linear-gradient(90deg, #f59e0b, transparent 70%)", borderRadius: 2, marginTop: 8 }} />
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {REPORT_CYCLES.map((cycle) => {
            const cfg = STATUS_CONFIG[cycle.status] ?? { color: "#888", label: cycle.status };
            const isSelected = selectedCycleId === cycle.id;
            const days = cycle.status !== "published" && cycle.status !== "closed" ? daysUntil(cycle.dueDate) : null;

            return (
              <button
                key={cycle.id}
                onClick={() => setSelectedCycleId(cycle.id)}
                className="text-left rounded-xl p-3"
                style={{
                  background: isSelected ? cfg.color + "12" : "var(--bg-elevated)",
                  border: isSelected ? `2px solid ${cfg.color}44` : "1px solid var(--border-subtle)",
                  borderTop: `3px solid ${cfg.color}`,
                }}
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span style={{ fontSize: 9, fontWeight: 600, color: cfg.color, background: cfg.color + "18", border: `1px solid ${cfg.color}33`, padding: "1px 6px", borderRadius: 3 }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{TYPE_LABELS[cycle.type] ?? cycle.type}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.3 }}>
                  {cycle.period}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  <div className="flex items-center gap-1"><Calendar size={9} /> Due {formatDate(cycle.dueDate)}</div>
                  {days !== null && (
                    <div className="flex items-center gap-1 mt-1" style={{ color: days <= 7 ? "#ff4d4f" : days <= 21 ? "#ffab40" : "var(--text-muted)" }}>
                      <Clock size={9} />
                      {days > 0 ? `${days} days remaining` : "Overdue"}
                    </div>
                  )}
                  {cycle.publishedDate && (
                    <div className="flex items-center gap-1 mt-1" style={{ color: "#00e676" }}>
                      <CheckSquare size={9} /> Published {formatDate(cycle.publishedDate)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Cycle Detail */}
        {activeCycle && (
          <div className="space-y-5">
            <div className="rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderLeft: "3px solid #f59e0b" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{activeCycle.title}</h2>
                  <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{TYPE_LABELS[activeCycle.type]} · {activeCycle.period}</span>
                    <span>Open: {formatDate(activeCycle.openDate)}</span>
                    <span>Due: {formatDate(activeCycle.dueDate)}</span>
                  </div>
                </div>
                {activeCycle.linkedContractIds?.length > 0 && (
                  <Link
                    to={createPageUrl("ContractsReporting")}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(251,146,60,0.1)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.25)", textDecoration: "none", flexShrink: 0 }}
                  >
                    View in Contracts <ArrowRight size={10} />
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Users size={12} style={{ color: "var(--text-muted)" }} />
                {activeCycle.assignedTo.map((a) => (
                  <span key={a} style={{ fontSize: 10, color: "var(--text-secondary)", background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", padding: "1px 7px", borderRadius: 4 }}>{a}</span>
                ))}
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                Deliverables ({activeCycle.deliverables.length})
              </h3>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                {activeCycle.deliverables.map((d, idx) => {
                  const sc = DELIVERABLE_STATUS_COLORS[d.status] ?? "#888";
                  return (
                    <div key={d.id} className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: idx < activeCycle.deliverables.length - 1 ? "1px solid var(--border-subtle)" : "none", background: idx % 2 === 0 ? "var(--bg-elevated)" : "var(--bg-base)" }}>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sc }} />
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{d.title}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{d.type} · {d.owner} · Due {formatDate(d.dueDate)}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, color: sc, background: sc + "18", border: `1px solid ${sc}33`, padding: "1px 6px", borderRadius: 3, flexShrink: 0 }}>
                        {d.status.replace("-", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Linked KPIs (compact) */}
            {linkedKpis.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Linked KPIs ({linkedKpis.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {linkedKpis.map((k) => (
                    <span key={k.id} style={{ fontSize: 10, fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", padding: "2px 8px", borderRadius: 4 }}>
                      {k.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Initiatives (compact) */}
            {linkedInits.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Linked Initiatives ({linkedInits.length})
                </h3>
                <div className="flex flex-col gap-1">
                  {linkedInits.map((i) => (
                    <div key={i.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: i.health === "green" ? "#00e676" : i.health === "amber" ? "#ffab40" : "#ff4d4f", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "var(--text-primary)" }}>{i.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Narrative entries */}
            {narrativeEntries.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Narrative Summaries
                </h3>
                <div className="space-y-3">
                  {narrativeEntries.slice(0, 3).map((entry) => (
                    <NarrativeSummaryCard
                      key={entry.id}
                      title={`KPI Narrative — ${entry.period}`}
                      narrative={entry.narrativeExplanation}
                      preparedBy={entry.preparedBy}
                      period={entry.period}
                      status={entry.status}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming deadlines */}
            {openCycles.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Upcoming Deadlines
                </h3>
                <ReportingDeadlineList cycles={openCycles} limit={4} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
