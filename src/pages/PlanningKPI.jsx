/**
 * Planning & KPIs — Red River OS
 *
 * Ministry and department goals, action items, milestones,
 * KPI dashboards, and reporting cadence.
 *
 * Status: scaffold — integration with planning cycle data in progress.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Target, Flag, CheckSquare, Milestone, BarChart3,
  TrendingUp, TrendingDown, Minus, ChevronRight,
  ArrowRight, Plus, Calendar,
} from "lucide-react";

// ── Ministry goals with KPIs ───────────────────────────────────────────────
const MINISTRY_GOALS = [
  {
    id: 1,
    title: "Reduce Chronic Disease Burden",
    description: "Measurably reduce the prevalence of preventable chronic disease in Métis communities.",
    kpi: "Chronic disease prevalence rate",
    baseline: "24.3%",
    target: "21.0%",
    current: "23.1%",
    progress: 45,
    status: "on-track",
    color: "#40c4ff",
  },
  {
    id: 2,
    title: "Improve Culturally Safe Care Access",
    description: "Increase access to culturally safe, Métis-specific health services across BC.",
    kpi: "Cultural safety training completion (HA staff)",
    baseline: "12%",
    target: "65%",
    current: "38%",
    progress: 49,
    status: "on-track",
    color: "#34d399",
  },
  {
    id: 3,
    title: "Advance Data Sovereignty",
    description: "Establish Métis ownership and governance over health data.",
    kpi: "Data sharing agreements with Métis governance provisions",
    baseline: "2",
    target: "8",
    current: "4",
    progress: 33,
    status: "at-risk",
    color: "#a78bfa",
  },
  {
    id: 4,
    title: "Strengthen Mental Health Supports",
    description: "Expand culturally grounded mental health and wellness programming.",
    kpi: "Unique service interactions (mental health)",
    baseline: "680",
    target: "1,200",
    current: "890",
    progress: 40,
    status: "on-track",
    color: "#f472b6",
  },
];

const ACTION_ITEMS = [
  { title: "Finalise Mental Health Strategy consultation summary", owner: "Policy Team", due: "Apr 5", status: "in-progress" },
  { title: "Submit Q3 KPI narrative to executive", owner: "Analytics", due: "Mar 28", status: "overdue" },
  { title: "Coordinate with Interior Health on training rollout", owner: "Health Equity", due: "Apr 15", status: "pending" },
  { title: "Update ministry dashboard with Q3 actuals", owner: "MHIH Analytics", due: "Apr 10", status: "in-progress" },
  { title: "Prepare 2025–26 planning deck for Director review", owner: "Planning Team", due: "Apr 1", status: "at-risk" },
];

const STATUS_COLORS = {
  "on-track": "#00e676",
  "at-risk": "#ffab40",
  "overdue": "#ff4d4f",
  "in-progress": "#40c4ff",
  pending: "var(--text-muted)",
};

function ProgressBar({ value, color }) {
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-overlay)" }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}

export default function PlanningKPI() {
  const [activeTab, setActiveTab] = useState("goals");

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="section-label mb-1">Red River OS · Planning & KPIs</div>
              <h1 className="mnbc-heading" style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 4 }}>
                Planning & KPIs
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Ministry goals, action items, milestones, and KPI performance tracking.
              </p>
            </div>
            <div
              className="shrink-0 px-2 py-1 rounded text-xs font-semibold"
              style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              Beta Module
            </div>
          </div>
          <div style={{ height: 2, background: "linear-gradient(90deg, #f59e0b, transparent 70%)", borderRadius: 2, marginTop: 12 }} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Ministry Goals", value: "4", color: "#f59e0b" },
            { label: "On Track", value: "3", color: "#00e676" },
            { label: "At Risk", value: "1", color: "#ffab40" },
            { label: "Open Actions", value: "5", color: "#40c4ff" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderTop: `2px solid ${s.color}` }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: "var(--bg-elevated)", width: "fit-content", border: "1px solid var(--border-subtle)" }}>
          {["goals", "actions", "milestones", "kpis"].map((tab) => {
            const labels = { goals: "Ministry Goals", actions: "Action Items", milestones: "Milestones", kpis: "KPI Dashboard" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded text-xs font-semibold transition-all"
                style={{
                  background: activeTab === tab ? "rgba(245,158,11,0.1)" : "transparent",
                  color: activeTab === tab ? "#f59e0b" : "var(--text-muted)",
                  border: activeTab === tab ? "1px solid rgba(245,158,11,0.25)" : "1px solid transparent",
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Goals */}
        {activeTab === "goals" && (
          <div className="space-y-4">
            {MINISTRY_GOALS.map((goal) => {
              const statusColor = STATUS_COLORS[goal.status] ?? "var(--text-muted)";
              return (
                <div
                  key={goal.id}
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderLeft: `3px solid ${goal.color}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                        {goal.title}
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{goal.description}</p>
                    </div>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 600, color: statusColor,
                        background: statusColor + "18", border: `1px solid ${statusColor}33`,
                        padding: "2px 7px", borderRadius: 4, flexShrink: 0,
                      }}
                    >
                      {goal.status.replace("-", " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    {[
                      { label: "Baseline", value: goal.baseline },
                      { label: "Current", value: goal.current },
                      { label: "Target", value: goal.target },
                    ].map((kv) => (
                      <div key={kv.label}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{kv.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{kv.value}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{goal.kpi}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: goal.color }}>{goal.progress}%</span>
                    </div>
                    <ProgressBar value={goal.progress} color={goal.color} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Items */}
        {activeTab === "actions" && (
          <div className="space-y-2">
            {ACTION_ITEMS.map((item) => {
              const color = STATUS_COLORS[item.status] ?? "var(--text-muted)";
              return (
                <div
                  key={item.title}
                  className="rounded-xl px-4 py-3 flex items-center gap-4"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.owner} · Due {item.due}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 600, color,
                      background: color + "18", border: `1px solid ${color}33`,
                      padding: "2px 7px", borderRadius: 4, flexShrink: 0,
                    }}
                  >
                    {item.status.replace("-", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Milestones / KPIs */}
        {(activeTab === "milestones" || activeTab === "kpis") && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            {activeTab === "milestones"
              ? <Milestone size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
              : <BarChart3 size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            }
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              {activeTab === "milestones" ? "Milestone Tracker" : "KPI Dashboard"}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 440, margin: "0 auto 20px" }}>
              {activeTab === "milestones"
                ? "Timeline-based milestone tracking across ministry programs and strategic initiatives."
                : "Live KPI views connected to MHIH data platform. For detailed analytics, use the MHIH Dashboard."}
            </p>
            {activeTab === "kpis" && (
              <Link
                to={createPageUrl("Dashboard")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
              >
                Open MHIH Dashboard <ArrowRight size={13} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
