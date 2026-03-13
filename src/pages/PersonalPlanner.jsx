/**
 * Personal Planner — Red River OS
 *
 * Individual work planning workspace for ministry staff.
 * Organise personal tasks, weekly priorities, goals aligned
 * to strategic themes, and focus areas — all within the
 * Red River OS environment.
 *
 * Status: active
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  CheckSquare, Calendar, Target, Layers, Plus, Circle,
  CheckCircle2, Clock, AlertTriangle, ChevronRight,
  Flag, Star, ArrowRight, BookOpen, Edit3, Trash2,
  StickyNote, Sunrise, CalendarDays, Milestone,
} from "lucide-react";

// ── Demo data ──────────────────────────────────────────────────────────────

const TODAY_TASKS = [
  { id: 1, text: "Review Q3 mental health metrics summary", priority: "high", done: false, tag: "MHIH Analytics" },
  { id: 2, text: "Respond to Health Canada data request", priority: "high", done: false, tag: "Contracts" },
  { id: 3, text: "Draft policy brief outline — diabetes prevention", priority: "medium", done: true, tag: "Policy" },
  { id: 4, text: "Team standup — Planning & Evaluation", priority: "low", done: true, tag: "Meeting" },
  { id: 5, text: "Update evidence snapshot for Board deck", priority: "medium", done: false, tag: "Evidence" },
  { id: 6, text: "Review Interior Health workplan feedback", priority: "medium", done: false, tag: "Health Equity" },
];

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const WEEKLY_TASKS = {
  Monday: [
    { id: 10, text: "Team planning session — program outcomes", done: false, tag: "Meeting" },
    { id: 11, text: "Pull chronic disease data from MHIH dashboard", done: false, tag: "MHIH Analytics" },
  ],
  Tuesday: [
    { id: 12, text: "Review Q3 KPI narrative draft", done: false, tag: "Planning" },
    { id: 13, text: "Coordinate with BC MoH on training rollout dates", done: false, tag: "Health Equity" },
  ],
  Wednesday: [
    { id: 14, text: "Mental Health Strategy — consultation summary", done: false, tag: "Policy" },
    { id: 15, text: "Check deliverables for FNHA agreement renewal", done: false, tag: "Contracts" },
  ],
  Thursday: [
    { id: 16, text: "Director briefing — data sovereignty progress", done: false, tag: "Meeting" },
    { id: 17, text: "Run backtesting on diabetes intervention metrics", done: false, tag: "MHIH Analytics" },
  ],
  Friday: [
    { id: 18, text: "Weekly wrap-up: update action item statuses", done: false, tag: "Planning" },
    { id: 19, text: "Prepare notes for executive review session", done: false, tag: "Meeting" },
  ],
};

const PERSONAL_GOALS = [
  {
    id: 1,
    title: "Master MHIH evidence snapshot workflow",
    description: "Build proficiency creating and exporting evidence snapshots for policy briefs and board decks.",
    theme: "Health & Wellness",
    themeColor: "#40c4ff",
    progress: 65,
    due: "Apr 30",
    status: "on-track",
  },
  {
    id: 2,
    title: "Complete data sovereignty training module",
    description: "Finish the OCAP® principles training and apply learnings to our data sharing agreements review.",
    theme: "Self-Determination",
    themeColor: "#f472b6",
    progress: 40,
    due: "May 15",
    status: "on-track",
  },
  {
    id: 3,
    title: "Lead one health equity workplan review",
    description: "Take ownership of a Health Authority workplan review — from intake to recommendations.",
    theme: "Health & Wellness",
    themeColor: "#40c4ff",
    progress: 20,
    due: "Jun 30",
    status: "at-risk",
  },
  {
    id: 4,
    title: "Build KPI dashboard literacy",
    description: "Understand and be able to explain every KPI in the Planning module to team and directors.",
    theme: "Health & Wellness",
    themeColor: "#40c4ff",
    progress: 80,
    due: "Mar 31",
    status: "on-track",
  },
];

const FOCUS_AREAS = [
  {
    id: 1,
    title: "Mental Health & Wellness Programming",
    description: "Supporting the expansion of culturally grounded mental health services across BC regions.",
    icon: "🌿",
    color: "#34d399",
    items: [
      { label: "Strategy consultation summary", link: "PolicyLab" },
      { label: "Service interaction metrics", link: "MetricCatalog" },
      { label: "Mental health KPI trends", link: "Dashboard" },
    ],
  },
  {
    id: 2,
    title: "Data Governance & Sovereignty",
    description: "Advancing Métis-owned data sharing agreements and governance frameworks with health authorities.",
    icon: "🔑",
    color: "#a78bfa",
    items: [
      { label: "Data sovereignty KPI", link: "PlanningKPI" },
      { label: "Data sharing agreements", link: "ContractsReporting" },
      { label: "MHIH data governance", link: "DataGovernance" },
    ],
  },
  {
    id: 3,
    title: "Chronic Disease Prevention",
    description: "Tracking and supporting initiatives to reduce preventable chronic disease in Métis communities.",
    icon: "🩺",
    color: "#fb923c",
    items: [
      { label: "Chronic disease metrics", link: "MetricCatalog" },
      { label: "Predictive analytics", link: "PredictiveAnalytics" },
      { label: "PHAC diabetes agreement", link: "ContractsReporting" },
    ],
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────

const PRIORITY_COLORS = {
  high: "#ff4d4f",
  medium: "#ffab40",
  low: "#40c4ff",
};

const STATUS_COLORS = {
  "on-track": "#00e676",
  "at-risk": "#ffab40",
  overdue: "#ff4d4f",
};

function TaskItem({ task, onToggle }) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl transition-all"
      style={{
        background: task.done ? "transparent" : "var(--bg-elevated)",
        border: `1px solid ${task.done ? "transparent" : "var(--border-subtle)"}`,
        opacity: task.done ? 0.5 : 1,
      }}
    >
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 shrink-0 transition-colors"
        style={{ color: task.done ? "#00e676" : "var(--text-muted)" }}
      >
        {task.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: task.done ? "var(--text-muted)" : "var(--text-primary)",
            textDecoration: task.done ? "line-through" : "none",
          }}
        >
          {task.text}
        </div>
        {task.tag && (
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{task.tag}</div>
        )}
      </div>
      {task.priority && !task.done && (
        <div
          className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
          style={{ background: PRIORITY_COLORS[task.priority] }}
          title={`${task.priority} priority`}
        />
      )}
    </div>
  );
}

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

// ── Page ───────────────────────────────────────────────────────────────────

export default function PersonalPlanner() {
  const [activeTab, setActiveTab] = useState("today");
  const [todayTasks, setTodayTasks] = useState(TODAY_TASKS);
  const [weeklyTasks, setWeeklyTasks] = useState(WEEKLY_TASKS);
  const [newTaskText, setNewTaskText] = useState("");
  const [activeWeekDay, setActiveWeekDay] = useState("Monday");

  const doneCount = todayTasks.filter((t) => t.done).length;
  const totalCount = todayTasks.length;
  const overdueGoals = PERSONAL_GOALS.filter((g) => g.status === "at-risk" || g.status === "overdue").length;

  function toggleTodayTask(id) {
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function addTodayTask() {
    const text = newTaskText.trim();
    if (!text) return;
    setTodayTasks((prev) => [
      { id: Date.now(), text, priority: "medium", done: false, tag: "" },
      ...prev,
    ]);
    setNewTaskText("");
  }

  function toggleWeekTask(day, id) {
    setWeeklyTasks((prev) => ({
      ...prev,
      [day]: prev[day].map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }

  const tabs = [
    { key: "today", label: "My Day", icon: <Sunrise size={13} /> },
    { key: "week", label: "This Week", icon: <CalendarDays size={13} /> },
    { key: "goals", label: "My Goals", icon: <Target size={13} /> },
    { key: "focus", label: "Focus Areas", icon: <Layers size={13} /> },
  ];

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1100px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="section-label mb-1">Red River OS · Personal Planner</div>
              <h1
                className="mnbc-heading"
                style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 4 }}
              >
                Personal Planner
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Your personal workspace — daily tasks, weekly plan, goals, and focus areas.
              </p>
            </div>
            <div
              className="shrink-0 text-xs font-semibold px-2 py-1 rounded"
              style={{
                background: "rgba(99,102,241,0.1)",
                color: "#818cf8",
                border: "1px solid rgba(99,102,241,0.25)",
              }}
            >
              My Workspace
            </div>
          </div>
          <div
            style={{
              height: 2,
              background: "linear-gradient(90deg, #818cf8, transparent 70%)",
              borderRadius: 2,
              marginTop: 12,
            }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: "Today's Tasks",
              value: `${doneCount}/${totalCount}`,
              color: "#818cf8",
              sub: doneCount === totalCount && totalCount > 0 ? "All done!" : `${totalCount - doneCount} remaining`,
            },
            {
              label: "This Week",
              value: String(Object.values(WEEKLY_TASKS).flat().length),
              color: "#40c4ff",
              sub: "tasks planned",
            },
            {
              label: "Active Goals",
              value: String(PERSONAL_GOALS.length),
              color: "#00e676",
              sub: `${overdueGoals} need attention`,
            },
            {
              label: "Focus Areas",
              value: String(FOCUS_AREAS.length),
              color: "#fb923c",
              sub: "active streams",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderTop: `2px solid ${s.color}`,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 1 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 mb-6 p-1 rounded-lg"
          style={{
            background: "var(--bg-elevated)",
            width: "fit-content",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab.key ? "rgba(129,140,248,0.1)" : "transparent",
                color: activeTab === tab.key ? "#818cf8" : "var(--text-muted)",
                border:
                  activeTab === tab.key
                    ? "1px solid rgba(129,140,248,0.25)"
                    : "1px solid transparent",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── My Day ── */}
        {activeTab === "today" && (
          <div>
            {/* Date */}
            <div
              className="flex items-center gap-2 mb-4"
              style={{ fontSize: 12, color: "var(--text-muted)" }}
            >
              <Calendar size={13} />
              <span>
                {new Date().toLocaleDateString("en-CA", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Quick add */}
            <div
              className="flex gap-2 mb-5"
              onKeyDown={(e) => e.key === "Enter" && addTodayTask()}
            >
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a task for today…"
                className="flex-1 rounded-lg px-4 py-2 text-sm outline-none transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                }}
              />
              <button
                onClick={addTodayTask}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: "rgba(129,140,248,0.1)",
                  color: "#818cf8",
                  border: "1px solid rgba(129,140,248,0.25)",
                }}
              >
                <Plus size={13} /> Add
              </button>
            </div>

            {/* Priority legend */}
            <div className="flex items-center gap-4 mb-3" style={{ fontSize: 10, color: "var(--text-muted)" }}>
              {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
                <div key={p} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                  {p}
                </div>
              ))}
            </div>

            {/* Task list */}
            <div className="space-y-1.5">
              {todayTasks.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleTodayTask} />
              ))}
            </div>

            {/* Progress */}
            {totalCount > 0 && (
              <div className="mt-5 rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Day progress</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8" }}>
                    {Math.round((doneCount / totalCount) * 100)}%
                  </span>
                </div>
                <ProgressBar value={(doneCount / totalCount) * 100} color="#818cf8" />
              </div>
            )}
          </div>
        )}

        {/* ── This Week ── */}
        {activeTab === "week" && (
          <div>
            {/* Day selector */}
            <div className="flex gap-1 mb-5 flex-wrap">
              {WEEK_DAYS.map((day) => {
                const done = weeklyTasks[day]?.filter((t) => t.done).length ?? 0;
                const total = weeklyTasks[day]?.length ?? 0;
                const isActive = activeWeekDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveWeekDay(day)}
                    className="flex flex-col items-start px-4 py-2.5 rounded-xl transition-all"
                    style={{
                      background: isActive ? "rgba(129,140,248,0.1)" : "var(--bg-elevated)",
                      border: isActive
                        ? "1px solid rgba(129,140,248,0.3)"
                        : "1px solid var(--border-subtle)",
                      minWidth: 90,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isActive ? "#818cf8" : "var(--text-secondary)",
                      }}
                    >
                      {day}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      {done}/{total} done
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tasks for selected day */}
            <div
              className="rounded-xl p-4 mb-3"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderTop: "2px solid #818cf8" }}
            >
              <div
                className="flex items-center justify-between mb-3"
                style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}
              >
                <span>{activeWeekDay}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {weeklyTasks[activeWeekDay]?.length ?? 0} tasks
                </span>
              </div>
              <div className="space-y-1.5">
                {(weeklyTasks[activeWeekDay] ?? []).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={(id) => toggleWeekTask(activeWeekDay, id)}
                  />
                ))}
              </div>
              {(!weeklyTasks[activeWeekDay] || weeklyTasks[activeWeekDay].length === 0) && (
                <div
                  className="text-center py-6"
                  style={{ fontSize: 13, color: "var(--text-muted)" }}
                >
                  No tasks planned for {activeWeekDay}.
                </div>
              )}
            </div>

            {/* Week summary */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              {WEEK_DAYS.map((day) => {
                const done = weeklyTasks[day]?.filter((t) => t.done).length ?? 0;
                const total = weeklyTasks[day]?.length ?? 0;
                const pct = total > 0 ? (done / total) * 100 : 0;
                return (
                  <div key={day} className="text-center">
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>
                      {day.slice(0, 3)}
                    </div>
                    <ProgressBar value={pct} color="#818cf8" />
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                      {done}/{total}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── My Goals ── */}
        {activeTab === "goals" && (
          <div className="space-y-4">
            {PERSONAL_GOALS.map((goal) => {
              const statusColor = STATUS_COLORS[goal.status] ?? "var(--text-muted)";
              return (
                <div
                  key={goal.id}
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderLeft: `3px solid ${goal.themeColor}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          marginBottom: 4,
                        }}
                      >
                        {goal.title}
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 580 }}>
                        {goal.description}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: statusColor,
                          background: statusColor + "18",
                          border: `1px solid ${statusColor}33`,
                          padding: "2px 7px",
                          borderRadius: 4,
                        }}
                      >
                        {goal.status.replace("-", " ")}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Due {goal.due}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{
                        background: goal.themeColor + "18",
                        color: goal.themeColor,
                        border: `1px solid ${goal.themeColor}33`,
                        fontSize: 10,
                      }}
                    >
                      {goal.theme}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Progress</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: goal.themeColor }}>
                          {goal.progress}%
                        </span>
                      </div>
                      <ProgressBar value={goal.progress} color={goal.themeColor} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Focus Areas ── */}
        {activeTab === "focus" && (
          <div className="space-y-4">
            {FOCUS_AREAS.map((area) => (
              <div
                key={area.id}
                className="rounded-xl p-4"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  borderTop: `2px solid ${area.color}`,
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="text-xl shrink-0 w-9 h-9 flex items-center justify-center rounded-lg"
                    style={{ background: area.color + "18", fontSize: 18 }}
                  >
                    {area.icon}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {area.title}
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{area.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {area.items.map((item) => (
                    <Link
                      key={item.label}
                      to={createPageUrl(item.link)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: area.color + "12",
                        color: area.color,
                        border: `1px solid ${area.color}28`,
                      }}
                    >
                      {item.label}
                      <ArrowRight size={10} />
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Quick links */}
            <div
              className="rounded-xl p-4 mt-2"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Quick Navigation
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "MHIH Dashboard", page: "Dashboard" },
                  { label: "Planning & KPIs", page: "PlanningKPI" },
                  { label: "Policy Lab", page: "PolicyLab" },
                  { label: "Evidence Snapshots", page: "EvidenceSnapshots" },
                  { label: "Metric Catalog", page: "MetricCatalog" },
                  { label: "Contracts & Reporting", page: "ContractsReporting" },
                ].map((lnk) => (
                  <Link
                    key={lnk.label}
                    to={createPageUrl(lnk.page)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: "var(--bg-overlay)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {lnk.label}
                    <ChevronRight size={10} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
