/**
 * PlanningScorecard — KPI Registry + Scorecard Views
 */

import React, { useState } from "react";
import { BarChart3, ChevronDown } from "lucide-react";
import { GOALS, KPIS, SCORECARD_ENTRIES, getKpisByGoalId, getScorecardForPeriod } from "@/lib/planningData";
import KPIStatusBadge from "@/components/planning/KPIStatusBadge";
import ScorecardCard from "@/components/planning/ScorecardCard";
import GoalChip from "@/components/planning/GoalChip";
import NarrativeSummaryCard from "@/components/planning/NarrativeSummaryCard";

const PERIODS = ["Q2 2024-25", "Q1 2024-25", "Q3 2024-25"];
const CATEGORIES = ["All", ...Array.from(new Set(KPIS.map((k) => k.category)))];

const TREND_SYMBOLS = { improving: "↑", stable: "→", declining: "↓" };
const TREND_COLORS  = { improving: "#00e676", stable: "#ffab40", declining: "#ff4d4f" };

export default function PlanningScorecard() {
  const [view, setView] = useState("registry");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedKpi, setExpandedKpi] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("Q2 2024-25");

  const filteredKpis = KPIS.filter((k) => {
    if (categoryFilter !== "All" && k.category !== categoryFilter) return false;
    if (statusFilter !== "all" && k.status !== statusFilter) return false;
    return true;
  });

  const periodEntries = getScorecardForPeriod(selectedPeriod);

  const onTrackCount = KPIS.filter((k) => k.status === "on-track").length;
  const atRiskCount  = KPIS.filter((k) => k.status === "at-risk").length;
  const offTrackCount= KPIS.filter((k) => k.status === "off-track").length;

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1100px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-5">
          <div className="section-label mb-1">Planning & KPIs</div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="mnbc-heading" style={{ fontSize: 22, color: "var(--text-primary)", marginBottom: 4 }}>
                KPI Scorecard
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {KPIS.length} KPIs · {onTrackCount} on track · {atRiskCount} at risk · {offTrackCount} off track
              </p>
            </div>
          </div>
          <div style={{ height: 2, background: "linear-gradient(90deg, #f59e0b, transparent 70%)", borderRadius: 2, marginTop: 8 }} />
        </div>

        {/* View toggle */}
        <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: "var(--bg-elevated)", width: "fit-content", border: "1px solid var(--border-subtle)" }}>
          {["registry", "scorecard"].map((v) => (
            <button key={v} onClick={() => setView(v)}
              className="px-5 py-1.5 rounded text-xs font-semibold transition-all"
              style={{
                background: view === v ? "rgba(245,158,11,0.1)" : "transparent",
                color: view === v ? "#f59e0b" : "var(--text-muted)",
                border: view === v ? "1px solid rgba(245,158,11,0.25)" : "1px solid transparent",
              }}>
              {v === "registry" ? "KPI Registry" : "Scorecard View"}
            </button>
          ))}
        </div>

        {/* KPI Registry view */}
        {view === "registry" && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCategoryFilter(c)}
                    className="px-2.5 py-1 rounded text-xs font-semibold"
                    style={{
                      background: categoryFilter === c ? "rgba(245,158,11,0.1)" : "var(--bg-elevated)",
                      color: categoryFilter === c ? "#f59e0b" : "var(--text-muted)",
                      border: categoryFilter === c ? "1px solid rgba(245,158,11,0.25)" : "1px solid var(--border-subtle)",
                    }}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap">
                {["all", "on-track", "at-risk", "off-track", "achieved"].map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className="px-2.5 py-1 rounded text-xs font-semibold"
                    style={{
                      background: statusFilter === s ? "var(--bg-overlay)" : "transparent",
                      color: statusFilter === s ? "var(--text-primary)" : "var(--text-muted)",
                      border: "1px solid var(--border-subtle)",
                    }}>
                    {s === "all" ? "All Status" : s.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI table */}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
              <div className="grid" style={{ gridTemplateColumns: "1fr auto auto auto auto auto", background: "var(--bg-overlay)", borderBottom: "1px solid var(--border-subtle)" }}>
                {["KPI", "Goals", "Baseline → Current → Target", "Trend", "Status", "Cadence"].map((h) => (
                  <div key={h} className="px-3 py-2" style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
                ))}
              </div>

              {filteredKpis.map((kpi, idx) => {
                const trendColor = TREND_COLORS[kpi.trend] ?? "#888";
                const isExpanded = expandedKpi === kpi.id;
                const kpiGoals = kpi.goalIds.map((id) => GOALS.find((g) => g.id === id)).filter(Boolean);
                return (
                  <div key={kpi.id} style={{ borderBottom: idx < filteredKpis.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                    <button
                      onClick={() => setExpandedKpi(isExpanded ? null : kpi.id)}
                      className="w-full text-left grid items-center"
                      style={{
                        gridTemplateColumns: "1fr auto auto auto auto auto",
                        background: isExpanded ? "var(--bg-overlay)" : (idx % 2 === 0 ? "var(--bg-elevated)" : "var(--bg-base)"),
                        padding: "8px 12px",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{kpi.title}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{kpi.category}</div>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {kpiGoals.map((g) => <GoalChip key={g.id} goal={g} size="xs" />)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {kpi.baseline}{kpi.unit === "%" ? "%" : ""} → <strong style={{ color: "var(--text-primary)" }}>{kpi.current}{kpi.unit === "%" ? "%" : ""}</strong> → {kpi.target}{kpi.unit === "%" ? "%" : ""}
                      </div>
                      <div style={{ fontSize: 13, color: trendColor, textAlign: "center" }}>
                        {TREND_SYMBOLS[kpi.trend] ?? "→"}
                      </div>
                      <KPIStatusBadge status={kpi.status} size="sm" />
                      <div style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{kpi.reportingCadence}</div>
                    </button>

                    {isExpanded && (
                      <div className="p-4" style={{ background: "var(--bg-base)", borderTop: "1px solid var(--border-subtle)" }}>
                        <ScorecardCard kpi={kpi} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scorecard view */}
        {view === "scorecard" && (
          <div>
            {/* Period selector + summary */}
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Period:</span>
                <div className="relative">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    style={{
                      fontSize: 12, fontWeight: 600, color: "#f59e0b",
                      background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                      borderRadius: 6, padding: "4px 28px 4px 10px", cursor: "pointer",
                      appearance: "none",
                    }}
                  >
                    {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "#00e676" }}>{periodEntries.filter((e) => KPIS.find((k) => k.id === e.kpiId)?.status === "on-track").length} on track</span>
                <span style={{ color: "#ffab40" }}>{periodEntries.filter((e) => KPIS.find((k) => k.id === e.kpiId)?.status === "at-risk").length} at risk</span>
                <span style={{ color: "#ff4d4f" }}>{periodEntries.filter((e) => KPIS.find((k) => k.id === e.kpiId)?.status === "off-track").length} off track</span>
              </div>
            </div>

            {/* Goal-grouped scorecard */}
            <div className="space-y-8">
              {GOALS.map((goal) => {
                const goalKpis = getKpisByGoalId(goal.id);
                if (goalKpis.length === 0) return null;
                return (
                  <div key={goal.id}>
                    <div className="flex items-center gap-2 mb-4">
                      <div style={{ width: 4, height: 24, borderRadius: 2, background: goal.color }} />
                      <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                        {goal.code}: {goal.title}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {goalKpis.map((kpi) => {
                        const entry = periodEntries.find((e) => e.kpiId === kpi.id);
                        return <ScorecardCard key={kpi.id} kpi={kpi} entry={entry} />;
                      })}
                    </div>
                    {/* Narrative if approved entries exist */}
                    {(() => {
                      const approvedEntry = periodEntries.find((e) => e.goalId === goal.id && e.status === "approved");
                      if (!approvedEntry) return null;
                      return (
                        <div className="mt-3">
                          <NarrativeSummaryCard
                            title={`${goal.code} — ${selectedPeriod} Narrative`}
                            narrative={approvedEntry.narrativeExplanation}
                            preparedBy={approvedEntry.preparedBy}
                            period={selectedPeriod}
                            status={approvedEntry.status}
                          />
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
