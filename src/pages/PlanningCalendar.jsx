/**
 * PlanningCalendar — Timeline view of milestones, action items, and report deadlines
 * Pure CSS grid calendar — no external calendar library
 */

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { getAllMilestones, getAllActionItems, getOpenReportCycles } from "@/lib/planningData";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_COLORS = {
  milestone:  "#40c4ff",
  action:     "#f59e0b",
  report:     "#ff4d4f",
};

const EVENT_LABELS = {
  milestone: "Milestone",
  action:    "Action Item",
  report:    "Report Deadline",
};

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isoToDate(str) {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export default function PlanningCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [typeFilter, setTypeFilter] = useState("all");

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  // Build all calendar events
  const allEvents = useMemo(() => {
    const events = [];

    getAllMilestones().forEach((ms) => {
      const d = isoToDate(ms.dueDate);
      if (d && ms.status !== "complete" && ms.status !== "deferred") {
        events.push({ type: "milestone", date: d, title: ms.title, owner: ms.owner, sub: ms.initiativeTitle, id: ms.id });
      }
    });

    getAllActionItems().forEach((ai) => {
      const d = isoToDate(ai.dueDate);
      if (d && ai.status !== "complete") {
        events.push({ type: "action", date: d, title: ai.title, owner: ai.owner, sub: ai.initiativeTitle, id: ai.id });
      }
    });

    getOpenReportCycles().forEach((rc) => {
      const d = isoToDate(rc.dueDate);
      if (d) {
        events.push({ type: "report", date: d, title: rc.title, owner: "Reporting Team", sub: rc.period, id: rc.id });
      }
    });

    return events;
  }, []);

  // Calendar grid days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(year, month, 1 - startOffset + i);
    return d;
  });

  const filteredEvents = typeFilter === "all" ? allEvents : allEvents.filter((e) => e.type === typeFilter);

  function eventsForDay(day) {
    return filteredEvents.filter((e) => sameDay(e.date, day));
  }

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1100px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-5">
          <div className="section-label mb-1">Planning & KPIs</div>
          <h1 className="mnbc-heading" style={{ fontSize: 22, color: "var(--text-primary)", marginBottom: 4 }}>
            Planning Calendar
          </h1>
          <div style={{ height: 2, background: "linear-gradient(90deg, #f59e0b, transparent 70%)", borderRadius: 2, marginTop: 8 }} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <ChevronLeft size={14} style={{ color: "var(--text-muted)" }} />
            </button>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", minWidth: 160, textAlign: "center" }}>
              {MONTH_NAMES[month]} {year}
            </div>
            <button onClick={nextMonth} className="p-1.5 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
            </button>
            <button
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
              className="px-3 py-1 rounded text-xs font-semibold"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", marginLeft: 4 }}
            >
              Today
            </button>
          </div>

          {/* Type filter */}
          <div className="flex gap-1">
            {["all", "milestone", "action", "report"].map((f) => {
              const color = f === "all" ? "#f59e0b" : EVENT_COLORS[f];
              return (
                <button key={f} onClick={() => setTypeFilter(f)}
                  className="px-3 py-1 rounded text-xs font-semibold"
                  style={{
                    background: typeFilter === f ? color + "18" : "var(--bg-elevated)",
                    color: typeFilter === f ? color : "var(--text-muted)",
                    border: typeFilter === f ? `1px solid ${color}33` : "1px solid var(--border-subtle)",
                  }}>
                  {f === "all" ? "All" : EVENT_LABELS[f]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "var(--bg-overlay)", borderBottom: "1px solid var(--border-subtle)" }}>
            {DAY_NAMES.map((d) => (
              <div key={d} style={{ padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", textAlign: "center" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {cells.map((day, i) => {
              const inMonth = day.getMonth() === month;
              const isToday = sameDay(day, today);
              const dayEvents = eventsForDay(day);
              const isLast = i === cells.length - 1;
              const isBottomRow = i >= cells.length - 7;
              const isRightCol = (i + 1) % 7 === 0;

              return (
                <div
                  key={i}
                  style={{
                    minHeight: 90,
                    padding: "6px 8px",
                    borderRight: isRightCol ? "none" : "1px solid var(--border-subtle)",
                    borderBottom: isBottomRow ? "none" : "1px solid var(--border-subtle)",
                    background: isToday ? "rgba(245,158,11,0.05)" : inMonth ? "var(--bg-elevated)" : "var(--bg-base)",
                    opacity: inMonth ? 1 : 0.4,
                  }}
                >
                  <div style={{
                    fontSize: 12, fontWeight: isToday ? 800 : 500,
                    color: isToday ? "#f59e0b" : inMonth ? "var(--text-secondary)" : "var(--text-muted)",
                    marginBottom: 4,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: isToday ? 22 : "auto",
                    height: isToday ? 22 : "auto",
                    borderRadius: isToday ? "50%" : 0,
                    background: isToday ? "rgba(245,158,11,0.15)" : "transparent",
                  }}>
                    {day.getDate()}
                  </div>

                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        title={`${evt.title}\n${evt.sub}\n${evt.owner}`}
                        style={{
                          fontSize: 9, fontWeight: 600,
                          color: EVENT_COLORS[evt.type],
                          background: EVENT_COLORS[evt.type] + "18",
                          border: `1px solid ${EVENT_COLORS[evt.type]}33`,
                          borderRadius: 3,
                          padding: "1px 4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          cursor: "default",
                        }}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: 9, color: "var(--text-muted)", paddingLeft: 4 }}>+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Legend:</span>
          {Object.entries(EVENT_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: EVENT_COLORS[type] }} />
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
