/**
 * Red River OS — Home (Cockpit)
 *
 * Single-screen cockpit: stats, priorities, deadlines, and app launcher all
 * visible without scrolling. Built on a fixed-height grid so each zone has
 * its own internal scroll if content overflows.
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { APP_STATUS, getApps } from "@/platform/appRegistry";
import {
  Calendar, ArrowRight, TrendingUp, TrendingDown, Minus,
  ChevronRight, HeartPulse, Scale, HeartHandshake, Leaf,
  FileSignature, FlaskConical, Target, Building2, BarChart3,
} from "lucide-react";

// ── Icon mapping for apps ──────────────────────────────────────────────────
const APP_ICONS = {
  HeartPulse, Scale, HeartHandshake, Leaf, FileSignature,
  FlaskConical, Target, Building2, BarChart3,
};
function AppIcon({ name, ...rest }) {
  const Icon = APP_ICONS[name];
  return Icon ? <Icon {...rest} /> : <BarChart3 {...rest} />;
}

// ── Compact stat pill (horizontal) ─────────────────────────────────────────
function StatPill({ label, value, trend, accent = "#40c4ff" }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "#00e676" : trend === "down" ? "#ff4d4f" : "var(--text-muted)";
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `2px solid ${accent}`,
        minWidth: 0,
      }}
    >
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontSize: 9,
            color: "var(--text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            lineHeight: 1,
            marginBottom: 3,
          }}
        >
          {label}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span style={{ fontSize: 19, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
            {value}
          </span>
          {trend && <TrendIcon size={11} style={{ color: trendColor }} />}
        </div>
      </div>
    </div>
  );
}

// ── Compact app card (single-row) ──────────────────────────────────────────
function AppCard({ app }) {
  const isReady = app.status === APP_STATUS.ACTIVE;
  const isScaffold = app.status === APP_STATUS.SCAFFOLD;
  return (
    <Link
      to={createPageUrl(app.landingPage)}
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all group"
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid var(--border-subtle)`,
        borderLeft: `2px solid ${app.accent}${isReady ? "cc" : "55"}`,
        textDecoration: "none",
        minWidth: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `linear-gradient(135deg, var(--bg-elevated) 0%, ${app.accent}10 100%)`;
        e.currentTarget.style.borderColor = app.accent + "55";
        e.currentTarget.style.borderLeftColor = app.accent;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "var(--bg-elevated)";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.borderLeftColor = app.accent + (isReady ? "cc" : "55");
      }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ background: app.accent + "18", border: `1px solid ${app.accent}33` }}
      >
        <AppIcon name={app.icon} size={13} style={{ color: app.accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className="truncate"
            style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}
          >
            {app.shortName}
          </span>
          {isScaffold && (
            <span
              style={{
                fontSize: 8, padding: "0 4px", borderRadius: 2,
                background: "var(--bg-overlay)", color: "var(--text-muted)",
                fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                flexShrink: 0,
              }}
            >
              beta
            </span>
          )}
        </div>
        <p
          className="truncate"
          style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.3 }}
        >
          {app.description}
        </p>
      </div>
      <ChevronRight
        size={12}
        style={{ color: "var(--text-muted)", flexShrink: 0 }}
        className="group-hover:translate-x-0.5 transition-transform"
      />
    </Link>
  );
}

// ── Compact priority row ───────────────────────────────────────────────────
function PriorityItem({ label, status, app, dueLabel }) {
  const statusColors = {
    "on-track": "#00e676",
    "at-risk": "#ffab40",
    "overdue": "#ff4d4f",
    "complete": "#40c4ff",
  };
  const statusLabels = {
    "on-track": "On Track",
    "at-risk": "At Risk",
    "overdue": "Overdue",
    "complete": "Done",
  };
  const color = statusColors[status] ?? "var(--text-muted)";
  return (
    <div
      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 4px ${color}` }}
      />
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{ fontSize: 11.5, color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.3 }}
        >
          {label}
        </div>
        {app && (
          <div
            className="truncate"
            style={{ fontSize: 9.5, color: "var(--text-muted)", lineHeight: 1.2 }}
          >
            {app}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {dueLabel && (
          <span style={{ fontSize: 9.5, color: "var(--text-muted)" }}>{dueLabel}</span>
        )}
        <span
          style={{
            fontSize: 9, fontWeight: 700, color,
            background: color + "18", padding: "1.5px 5px",
            borderRadius: 3, border: `1px solid ${color}33`,
            textTransform: "uppercase", letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {statusLabels[status] ?? status}
        </span>
      </div>
    </div>
  );
}

// ── Zone heading ───────────────────────────────────────────────────────────
function ZoneHeader({ label, title, linkTo, linkLabel = "View all", count }) {
  return (
    <div className="flex items-center justify-between mb-2 shrink-0">
      <div className="flex items-baseline gap-2 min-w-0">
        <div className="section-label" style={{ fontSize: 9 }}>{label}</div>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h2>
        {count != null && (
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>· {count}</span>
        )}
      </div>
      {linkTo && (
        <Link
          to={createPageUrl(linkTo)}
          className="flex items-center gap-1"
          style={{ fontSize: 10.5, color: "var(--text-muted)" }}
        >
          {linkLabel} <ArrowRight size={10} />
        </Link>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function RedRiverOSHome() {
  const { user } = useAuth();
  const apps = getApps();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const greeting = (() => {
    const h = time.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const dateStr = time.toLocaleDateString("en-CA", {
    weekday: "short", month: "short", day: "numeric",
  });

  const priorities = [
    { label: "Q1 Health Equity Report — HA Workplan Review", status: "at-risk", app: "Health Equity", dueLabel: "Mar 28" },
    { label: "Mental Health Strategy — Phase II Consultation", status: "on-track", app: "MHIH · Policy Lab", dueLabel: "Apr 15" },
    { label: "HIBC Data Sharing Agreement Renewal", status: "overdue", app: "Contracts & Reporting", dueLabel: "Mar 1" },
    { label: "Elders Advisory — Cultural Guidance Integration", status: "on-track", app: "Provincial Wellness", dueLabel: "Apr 30" },
    { label: "Diabetes Prevention KPI Review — Northern BC", status: "on-track", app: "MHIH · Dashboard", dueLabel: "Apr 10" },
    { label: "2025–26 Ministry Planning Cycle — Draft Submission", status: "at-risk", app: "Planning & KPIs", dueLabel: "Apr 1" },
  ];

  const deadlines = [
    { label: "Q3 HIBC Contribution Report", due: "Mar 31", urgency: "high" },
    { label: "Annual Health Equity Scan", due: "Apr 15", urgency: "medium" },
    { label: "Mental Health Strategy Update", due: "Apr 30", urgency: "medium" },
    { label: "FNHA Partnership Workplan", due: "May 15", urgency: "low" },
  ];

  const activeCount = apps.filter(a => a.status === APP_STATUS.ACTIVE).length;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <div className="flex-1 min-h-0 flex flex-col px-5 py-4 gap-3">

        {/* ── Row 1: Header + stats inline ──────────────────────────── */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="min-w-0 shrink-0">
            <div className="flex items-center gap-2">
              <h1
                className="mnbc-heading truncate"
                style={{ fontSize: 20, color: "var(--text-primary)", lineHeight: 1.1 }}
              >
                {greeting}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
              </h1>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>· {dateStr}</span>
            </div>
            <div className="section-label" style={{ fontSize: 9, marginTop: 2 }}>
              MNBC Health &amp; Wellness · Red River OS
            </div>
          </div>
          <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatPill label="Active Programs" value="12" trend="up" accent="#40c4ff" />
            <StatPill label="Open Priorities" value="7" trend="up" accent="#FEDD00" />
            <StatPill label="Overdue" value="2" trend="down" accent="#ff4d4f" />
            <StatPill label="Reports Due 30d" value="4" accent="#ffab40" />
          </div>
        </div>

        {/* ── Row 2: 2-column cockpit grid ──────────────────────────── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">

          {/* ── Left: Priorities + Deadlines stack ────────────────── */}
          <div className="min-h-0 flex flex-col gap-3">

            {/* Priorities */}
            <section
              className="min-h-0 flex flex-col rounded-lg p-3"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", flex: "1 1 60%" }}
            >
              <ZoneHeader
                label="Active Focus"
                title="Ministry Priorities"
                linkTo="PlanningKPI"
                count={`${priorities.length} items`}
              />
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
                {priorities.map((p, i) => <PriorityItem key={i} {...p} />)}
              </div>
            </section>

            {/* Deadlines */}
            <section
              className="min-h-0 flex flex-col rounded-lg p-3"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", flex: "1 1 40%" }}
            >
              <ZoneHeader
                label="Upcoming"
                title="Reporting Deadlines"
                linkTo="ContractsReporting"
                linkLabel="All"
              />
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
                {deadlines.map((item) => {
                  const urgencyColor =
                    item.urgency === "high" ? "#ff4d4f" :
                    item.urgency === "medium" ? "#ffab40" :
                    "var(--text-muted)";
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                    >
                      <Calendar size={11} style={{ color: urgencyColor, flexShrink: 0 }} />
                      <span
                        className="flex-1 truncate"
                        style={{ fontSize: 11.5, color: "var(--text-secondary)" }}
                      >
                        {item.label}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: urgencyColor, whiteSpace: "nowrap" }}>
                        {item.due}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ── Right: Applications grid ─────────────────────────── */}
          <section
            className="min-h-0 flex flex-col rounded-lg p-3"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <ZoneHeader
              label="Platform"
              title="Applications"
              count={`${activeCount} active`}
            />
            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 xl:grid-cols-2 gap-1.5 pr-1 content-start">
              {apps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}