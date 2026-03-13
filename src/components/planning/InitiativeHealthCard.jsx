/**
 * InitiativeHealthCard — shows an initiative with health traffic light and key metrics
 * Props: initiative (Initiative), goals (StrategicGoal[]), onClick, compact (bool)
 */

import React from "react";
import { User, Calendar, AlertTriangle } from "lucide-react";
import GoalChip from "./GoalChip";

const HEALTH_COLOR = { green: "#00e676", amber: "#ffab40", red: "#ff4d4f" };
const HEALTH_LABEL = { green: "On Track", amber: "At Risk", red: "Off Track" };

const STATUS_COLORS = {
  active: "#40c4ff",
  planning: "#a78bfa",
  "on-hold": "#ffab40",
  completed: "#00e676",
  cancelled: "var(--text-muted)",
};

export default function InitiativeHealthCard({ initiative, goals = [], onClick, compact = false }) {
  if (!initiative) return null;
  const hc = HEALTH_COLOR[initiative.health] ?? "#888";
  const completedMs = initiative.milestones.filter((m) => m.status === "complete").length;
  const totalMs = initiative.milestones.length;
  const openActions = initiative.actionItems.filter((a) => a.status !== "complete").length;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="rounded-xl px-3 py-2.5 flex items-center gap-3"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          cursor: onClick ? "pointer" : "default",
        }}
      >
        {/* Health dot */}
        <div
          title={HEALTH_LABEL[initiative.health]}
          style={{ width: 10, height: 10, borderRadius: "50%", background: hc, flexShrink: 0 }}
        />
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {initiative.title}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
            {initiative.lead} · {completedMs}/{totalMs} milestones
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {goals.map((g) => <GoalChip key={g.id} goal={g} size="xs" />)}
        </div>
      </div>
    );
  }

  const msProgress = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `3px solid ${hc}`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: hc, flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: STATUS_COLORS[initiative.status] ?? "#888",
              background: (STATUS_COLORS[initiative.status] ?? "#888") + "18",
              border: `1px solid ${(STATUS_COLORS[initiative.status] ?? "#888")}33`,
              padding: "1px 6px", borderRadius: 4 }}>
              {initiative.status}
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
            {initiative.title}
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          {goals.map((g) => <GoalChip key={g.id} goal={g} size="xs" />)}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 flex-wrap text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1">
          <User size={10} />
          {initiative.lead}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={10} />
          {initiative.endDate}
        </span>
        {initiative.riskLevel === "high" && (
          <span className="flex items-center gap-1" style={{ color: "#ff4d4f" }}>
            <AlertTriangle size={10} />
            High risk
          </span>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
            {completedMs}/{totalMs} milestones · {openActions} open actions
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: hc }}>{msProgress}%</span>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: "var(--bg-overlay)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${msProgress}%`, background: hc, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}
