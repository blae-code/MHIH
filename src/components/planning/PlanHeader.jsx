/**
 * PlanHeader — standard page header for a Plan workspace
 * Props: plan (Plan), goals (StrategicGoal[]), onBack
 */

import React from "react";
import { ChevronLeft, Calendar, User } from "lucide-react";
import GoalChip from "./GoalChip";
import { GOALS } from "@/lib/planningData";

const TYPE_LABELS = {
  "strategic": "Strategic Plan",
  "operational": "Operational Workplan",
  "workplan": "Workplan",
  "action-plan": "Action Plan",
};

const STATUS_CONFIG = {
  "draft":        { color: "#ffab40", label: "Draft" },
  "approved":     { color: "#00e676", label: "Approved" },
  "active":       { color: "#40c4ff", label: "Active" },
  "under-review": { color: "#f59e0b", label: "Under Review" },
  "closed":       { color: "var(--text-muted)", label: "Closed" },
};

export default function PlanHeader({ plan, onBack }) {
  if (!plan) return null;
  const statusCfg = STATUS_CONFIG[plan.status] ?? { color: "#888", label: plan.status };
  const linkedGoals = (plan.goalIds ?? []).map((id) => GOALS.find((g) => g.id === id)).filter(Boolean);

  return (
    <div className="mb-4">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 mb-3 text-xs"
          style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ChevronLeft size={13} /> Back to Plans
        </button>
      )}

      <div
        className="rounded-xl p-4"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderTop: "3px solid #f59e0b",
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                style={{
                  fontSize: 10, fontWeight: 600,
                  background: "rgba(245,158,11,0.12)", color: "#f59e0b",
                  border: "1px solid rgba(245,158,11,0.25)",
                  padding: "1px 7px", borderRadius: 4,
                }}
              >
                {TYPE_LABELS[plan.type] ?? plan.type}
              </span>
              <span
                style={{
                  fontSize: 10, fontWeight: 600,
                  color: statusCfg.color,
                  background: statusCfg.color + "18",
                  border: `1px solid ${statusCfg.color}33`,
                  padding: "1px 7px", borderRadius: 4,
                }}
              >
                {statusCfg.label}
              </span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              {plan.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {plan.cycle}
          </span>
          <span className="flex items-center gap-1">
            <User size={11} />
            {plan.owner}
          </span>
          {plan.department && (
            <span style={{ color: "var(--text-secondary)" }}>{plan.department}</span>
          )}
          {linkedGoals.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {linkedGoals.map((g) => <GoalChip key={g.id} goal={g} size="xs" />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
