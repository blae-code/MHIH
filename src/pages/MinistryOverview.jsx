/**
 * Ministry Overview — Red River OS
 *
 * Strategic plan alignment, Goals of the Nation, ministry priorities,
 * and high-level ministry health dashboard.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Building2, Target, Flag, BarChart3, TrendingUp,
  ChevronRight, Users, FileText, Calendar, Activity,
  ArrowUpRight, Shield, BookOpen,
} from "lucide-react";

const GOALS = [
  { id: 1, title: "Citizenship & Identity", kpi: "Registry integrity", value: "94%", trend: "+2%", color: "#FEDD00" },
  { id: 2, title: "Health & Wellness", kpi: "Health equity index", value: "68", trend: "+4", color: "#40c4ff" },
  { id: 3, title: "Education & Training", kpi: "Participation rate", value: "71%", trend: "+1%", color: "#a78bfa" },
  { id: 4, title: "Economic Development", kpi: "Employment index", value: "62", trend: "+3", color: "#fb923c" },
  { id: 5, title: "Housing", kpi: "Housing stability score", value: "58", trend: "—", color: "#34d399" },
  { id: 6, title: "Self-Determination", kpi: "Governance capacity", value: "81%", trend: "+5%", color: "#f472b6" },
];

const DEPARTMENTS = [
  { name: "Provincial Health & Wellness", director: "TBD", programs: 4, status: "active" },
  { name: "Health Policy Implementation", director: "TBD", programs: 3, status: "active" },
  { name: "Métis Health Equity", director: "TBD", programs: 3, status: "active" },
  { name: "Health Research & Evaluation", director: "TBD", programs: 2, status: "active" },
];

export default function MinistryOverview() {
  const [activeTab, setActiveTab] = useState("goals");

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <div className="section-label mb-1">Red River OS · Strategic</div>
          <h1 className="mnbc-heading" style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 4 }}>
            Ministry Overview
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Strategic alignment, governance portfolios, and ministry-level health snapshot.
          </p>
          <div style={{ height: 2, background: "linear-gradient(90deg, #FEDD00, transparent 70%)", borderRadius: 2, marginTop: 12 }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: "var(--bg-elevated)", width: "fit-content", border: "1px solid var(--border-subtle)" }}>
          {["goals", "departments", "priorities"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded text-xs font-semibold capitalize transition-all"
              style={{
                background: activeTab === tab ? "rgba(254,221,0,0.1)" : "transparent",
                color: activeTab === tab ? "#FEDD00" : "var(--text-muted)",
                border: activeTab === tab ? "1px solid rgba(254,221,0,0.25)" : "1px solid transparent",
              }}
            >
              {tab === "goals" ? "Six Goals" : tab === "departments" ? "Portfolios" : "Priorities"}
            </button>
          ))}
        </div>

        {/* Six Goals */}
        {activeTab === "goals" && (
          <div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {GOALS.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderTop: `3px solid ${goal.color}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>Goal {goal.id}</div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{goal.title}</h3>
                    </div>
                    <Flag size={14} style={{ color: goal.color, flexShrink: 0 }} />
                  </div>
                  <div className="flex items-end gap-3">
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{goal.kpi}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: goal.color, lineHeight: 1 }}>{goal.value}</div>
                    </div>
                    <span style={{ fontSize: 11, color: goal.trend.startsWith("+") ? "#00e676" : "var(--text-muted)", marginBottom: 2 }}>
                      {goal.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="section-label mb-3">Strategic Alignment Note</div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                The Six Goals of the Métis Nation BC represent the foundational priorities of the Nation's strategic plan.
                MNBC Health &amp; Wellness primarily anchors to Goal 2 (Health &amp; Wellness) but contributes evidence and
                programming that supports all six goals. KPI values shown are indicative — connect the MHIH data platform
                for live metrics.
              </p>
              <div className="mt-3">
                <Link
                  to={createPageUrl("Dashboard")}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "#40c4ff" }}
                >
                  Open MHIH Dashboard for live KPIs <ChevronRight size={11} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Portfolios */}
        {activeTab === "departments" && (
          <div className="space-y-3">
            {DEPARTMENTS.map((dept) => (
              <div
                key={dept.name}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(64,196,255,0.1)", border: "1px solid rgba(64,196,255,0.2)" }}
                >
                  <Building2 size={16} style={{ color: "#40c4ff" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{dept.name}</h3>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {dept.programs} active programs
                  </div>
                </div>
                <div
                  className="px-2 py-1 rounded text-xs font-semibold"
                  style={{ background: "rgba(0,230,118,0.1)", color: "#00e676", border: "1px solid rgba(0,230,118,0.2)" }}
                >
                  Active
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Priorities */}
        {activeTab === "priorities" && (
          <div
            className="rounded-xl p-6"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="section-label mb-3">Ministry Priorities — 2025–26</div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Connect the Planning &amp; KPIs module and Policy Studio for live priority tracking.
              This view will be driven by the ministry planning cycle data.
            </p>
            <Link
              to={createPageUrl("PlanningKPI")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "rgba(254,221,0,0.1)", color: "#FEDD00", border: "1px solid rgba(254,221,0,0.25)" }}
            >
              Open Planning &amp; KPIs <ChevronRight size={13} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
