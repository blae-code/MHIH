/**
 * Red River OS — Home (Cockpit)
 *
 * Single-screen cockpit: stats, priorities, deadlines, and app launcher all
 * visible without scrolling. Visual language matches the Dashboard page —
 * gradient stat cards with accent strips, framed widget cards with subtle
 * accent glow, and dashboard-section-label headings.
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
  Activity, AlertTriangle, FileClock, Layers,
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

// ── Gradient stat card (matches Dashboard stat cards) ──────────────────────
function StatCard({ label, value, desc, icon: Icon, color, bgColor, trend }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;
  return (
    <div
      className="home-stat-card relative overflow-hidden group"
      style={{
        background: `linear-gradient(135deg, ${bgColor} 0%, var(--bg-elevated) 100%)`,
        border: `1.5px solid ${color}33`,
        borderRadius: 10,
        padding: 12,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 12px rgba(0,0,0,0.35)",
      }}
    >
      {/* Accent strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
      }} />
      <div className="flex items-start justify-between mb-2 relative z-10">
        <span style={{
          fontSize: 9, fontWeight: 600, color: "var(--text-secondary)",
          textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.1,
        }}>
          {label}
        </span>
        <div className="p-1.5 rounded-md shrink-0 transition-all group-hover:scale-110"
          style={{ background: bgColor, boxShadow: `0 0 8px ${color}22` }}>
          <Icon size={12} style={{ color, strokeWidth: 2.5 }} />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 mb-1 relative z-10">
        <span style={{
          fontSize: 26, fontWeight: 900, color, lineHeight: 1,
          textShadow: `0 2px 8px ${color}18`,
        }}>
          {value}
        </span>
        {TrendIcon && <TrendIcon size={12} style={{ color }} />}
      </div>
      <div style={{ fontSize: 10.5, color: "var(--text-secondary)", lineHeight: 1.35 }} className="relative z-10">
        {desc}
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
        e.currentTarget.style.boxShadow = `0 0 16px ${app.accent}14`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "var(--bg-elevated)";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.borderLeftColor = app.accent + (isReady ? "cc" : "55");
        e.currentTarget.style.boxShadow = "none";
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
          <span className="truncate" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
            {app.shortName}
          </span>
          {isScaffold && (
            <span style={{
              fontSize: 8, padding: "0 4px", borderRadius: 2,
              background: "var(--bg-overlay)", color: "var(--text-muted)",
              fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
              flexShrink: 0,
            }}>
              beta
            </span>
          )}
        </div>
        <p className="truncate" style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.3 }}>
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
      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all"
      style={{
        background: "var(--bg-overlay)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `2px solid ${color}88`,
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <div className="flex-1 min-w-0">
        <div className="truncate" style={{ fontSize: 11.5, color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.3 }}>
          {label}
        </div>
        {app && (
          <div className="truncate" style={{ fontSize: 9.5, color: "var(--text-muted)", lineHeight: 1.2 }}>
            {app}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {dueLabel && (
          <span style={{ fontSize: 9.5, color: "var(--text-muted)" }}>{dueLabel}</span>
        )}
        <span style={{
          fontSize: 9, fontWeight: 700, color,
          background: color + "18", padding: "1.5px 5px",
          borderRadius: 3, border: `1px solid ${color}33`,
          textTransform: "uppercase", letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        }}>
          {statusLabels[status] ?? status}
        </span>
      </div>
    </div>
  );
}

// ── Zone heading (matches Dashboard's section header pattern) ──────────────
function ZoneHeader({ label, title, linkTo, linkLabel = "View all", count }) {
  return (
    <div className="flex items-center justify-between mb-2 shrink-0">
      <div className="flex items-baseline gap-2 min-w-0">
        <div className="dashboard-section-label" style={{ margin: 0 }}>{label}</div>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h2>
        {count != null && (
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>· {count}</span>
        )}
      </div>
      {linkTo && (
        <Link
          to={createPageUrl(linkTo)}
          className="flex items-center gap-1 transition-colors"
          style={{ fontSize: 10.5, color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--mnbc-yellow)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
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
      <style>{`
        .home-stat-card {
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        .home-stat-card:hover {
          transform: translateY(-1px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.45) !important;
        }
        .home-widget-card {
          border-radius: 10px;
          border: 1.5px solid;
          border-image: linear-gradient(135deg, rgba(254,221,0,0.4) 0%, rgba(64,196,255,0.3) 50%, rgba(254,221,0,0.2) 100%) 1;
          background: #0a1220;
          padding: 12px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(254,221,0,0.08), 0 0 20px rgba(254,221,0,0.05);
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .home-widget-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(254,221,0,0.02) 0%, transparent 100%);
          pointer-events: none;
        }
        .home-widget-card:hover {
          border-image: linear-gradient(135deg, rgba(254,221,0,0.6) 0%, rgba(64,196,255,0.5) 50%, rgba(254,221,0,0.4) 100%) 1;
          box-shadow: inset 0 1px 0 rgba(254,221,0,0.15), 0 0 32px rgba(254,221,0,0.10), 0 8px 24px rgba(0,0,0,0.4);
        }
      `}</style>

      <div className="flex-1 min-h-0 flex flex-col px-4 py-3 gap-3">

        {/* ── Hero header — slim greeting strip ──────────────────────── */}
        <div className="shrink-0 rounded-lg overflow-hidden" style={{
          background: "linear-gradient(to bottom, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(254,221,0,0.08)",
        }}>
          <div className="px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{
                background: "var(--color-success)",
                boxShadow: "0 0 8px rgba(0,230,118,0.5)",
              }} />
              <div className="min-w-0">
                <h1 className="mnbc-heading truncate" style={{
                  fontSize: 18, color: "var(--text-primary)", lineHeight: 1.1, margin: 0,
                }}>
                  {greeting}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
                </h1>
                <div className="dashboard-section-label" style={{ margin: 0, marginTop: 2 }}>
                  MNBC Health &amp; Wellness · Red River OS
                </div>
              </div>
            </div>
            <span className="shrink-0" style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              {dateStr}
            </span>
          </div>
        </div>

        {/* ── Stat strip — gradient cards matching Dashboard ─────────── */}
        <div className="shrink-0">
          <div className="dashboard-section-label">Platform Status</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <StatCard
              label="Active Programs" value="12" trend="up"
              icon={Layers} color="#40c4ff" bgColor="rgba(64,196,255,0.08)"
              desc="Programs in flight across MNBC"
            />
            <StatCard
              label="Open Priorities" value="7" trend="up"
              icon={Activity} color="#FEDD00" bgColor="rgba(254,221,0,0.08)"
              desc="Ministry priorities being actioned"
            />
            <StatCard
              label="Overdue" value="2" trend="down"
              icon={AlertTriangle} color="#ff4d4f" bgColor="rgba(255,77,79,0.08)"
              desc="Items past their target date"
            />
            <StatCard
              label="Reports Due 30d" value="4"
              icon={FileClock} color="#ffab40" bgColor="rgba(255,171,64,0.08)"
              desc="Deliverables coming up this month"
            />
          </div>
        </div>

        {/* ── Row 2: 2-column cockpit grid ──────────────────────────── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">

          {/* ── Left: Priorities + Deadlines stack ────────────────── */}
          <div className="min-h-0 flex flex-col gap-3">

            {/* Priorities */}
            <section className="home-widget-card" style={{ flex: "1 1 60%" }}>
              <ZoneHeader
                label="Active Focus"
                title="Ministry Priorities"
                linkTo="PlanningKPI"
                count={`${priorities.length} items`}
              />
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 relative z-10">
                {priorities.map((p, i) => <PriorityItem key={i} {...p} />)}
              </div>
            </section>

            {/* Deadlines */}
            <section className="home-widget-card" style={{ flex: "1 1 40%" }}>
              <ZoneHeader
                label="Upcoming"
                title="Reporting Deadlines"
                linkTo="ContractsReporting"
                linkLabel="All"
              />
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 relative z-10">
                {deadlines.map((item) => {
                  const urgencyColor =
                    item.urgency === "high" ? "#ff4d4f" :
                    item.urgency === "medium" ? "#ffab40" :
                    "var(--text-muted)";
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md"
                      style={{
                        background: "var(--bg-overlay)",
                        border: "1px solid var(--border-subtle)",
                        borderLeft: `2px solid ${urgencyColor}88`,
                      }}
                    >
                      <Calendar size={11} style={{ color: urgencyColor, flexShrink: 0 }} />
                      <span className="flex-1 truncate" style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
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
          <section className="home-widget-card">
            <ZoneHeader
              label="Platform"
              title="Applications"
              count={`${activeCount} active`}
            />
            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 xl:grid-cols-2 gap-1.5 pr-1 content-start relative z-10">
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