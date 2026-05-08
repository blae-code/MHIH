/**
 * Red River OS — Home
 *
 * The operating center of the MNBC Health & Wellness ministry environment.
 * Focused 3-zone layout: hero stats, active focus (priorities + deadlines),
 * and platform application launcher.
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

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, trend, note, accent = "#40c4ff" }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "#00e676" : trend === "down" ? "#ff4d4f" : "var(--text-muted)";
  return (
    <div
      className="metric-card flex flex-col gap-1"
      style={{ borderTop: `2px solid ${accent}` }}
    >
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
      <div className="flex items-end gap-2">
        <span style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
          {value}
        </span>
        {trend && (
          <TrendIcon size={14} style={{ color: trendColor, marginBottom: 2 }} />
        )}
      </div>
      {note && (
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{note}</div>
      )}
    </div>
  );
}

// ── App quick-launch card ──────────────────────────────────────────────────
function AppCard({ app }) {
  const isReady = app.status === APP_STATUS.ACTIVE;
  const isScaffold = app.status === APP_STATUS.SCAFFOLD;
  return (
    <Link
      to={createPageUrl(app.landingPage)}
      className="block rounded-xl p-4 transition-all group"
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid var(--border-subtle)`,
        textDecoration: "none",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = app.accent + "55";
        e.currentTarget.style.background = `linear-gradient(135deg, var(--bg-elevated) 0%, ${app.accent}08 100%)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.background = "var(--bg-elevated)";
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: app.accent + (isReady ? "cc" : "44") }} />

      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: app.accent + "18", border: `1px solid ${app.accent}33` }}
        >
          <AppIcon name={app.icon} size={16} style={{ color: app.accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              {app.shortName}
            </span>
            {isScaffold && (
              <span
                style={{
                  fontSize: 9, padding: "1px 5px", borderRadius: 3,
                  background: "var(--bg-overlay)", color: "var(--text-muted)",
                  fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
                }}
              >
                beta
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
            {app.description.slice(0, 80)}{app.description.length > 80 ? "…" : ""}
          </p>
        </div>
        <ChevronRight size={14} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

// ── Priority item ──────────────────────────────────────────────────────────
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
    "complete": "Complete",
  };
  const color = statusColors[status] ?? "var(--text-muted)";
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>{label}</div>
        {app && <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{app}</div>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {dueLabel && (
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{dueLabel}</span>
        )}
        <span
          style={{
            fontSize: 10, fontWeight: 600, color,
            background: color + "18", padding: "2px 7px",
            borderRadius: 4, border: `1px solid ${color}33`,
          }}
        >
          {statusLabels[status] ?? status}
        </span>
      </div>
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
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1400px] mx-auto px-6 py-6">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="section-label mb-1">MNBC Health &amp; Wellness</div>
              <h1
                className="mnbc-heading"
                style={{ fontSize: 28, color: "var(--text-primary)", marginBottom: 4 }}
              >
                {greeting}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{dateStr}</p>
            </div>
            <div
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg shrink-0"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#00e676", boxShadow: "0 0 4px #00e676" }}
              />
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>All systems operational</span>
            </div>
          </div>

          <div style={{ height: 2, background: "linear-gradient(90deg, #FEDD00, #40c4ff 40%, transparent 80%)", borderRadius: 2 }} />
        </div>

        {/* ── Zone 1: Stats ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Active Programs" value="12" trend="up" note="Q1 2025–26" accent="#40c4ff" />
          <StatCard label="Open Priorities" value="7" trend="up" note="Ministry-level" accent="#FEDD00" />
          <StatCard label="Overdue Items" value="2" trend="down" note="Requires attention" accent="#ff4d4f" />
          <StatCard label="Reports Due" value="4" trend={null} note="Next 30 days" accent="#ffab40" />
        </div>

        {/* ── Zone 2: Focus (Priorities + Deadlines) ──────────────────── */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-8">

          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="section-label">Active Focus</div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                  Ministry Priorities
                </h2>
              </div>
              <Link
                to={createPageUrl("PlanningKPI")}
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <div className="space-y-2">
              <PriorityItem
                label="Q1 Health Equity Report — HA Workplan Review"
                status="at-risk"
                app="Health Equity"
                dueLabel="Due Mar 28"
              />
              <PriorityItem
                label="Mental Health Strategy — Phase II Consultation"
                status="on-track"
                app="MHIH · Policy Lab"
                dueLabel="Due Apr 15"
              />
              <PriorityItem
                label="HIBC Data Sharing Agreement Renewal"
                status="overdue"
                app="Contracts & Reporting"
                dueLabel="Was Mar 1"
              />
              <PriorityItem
                label="Elders Advisory — Cultural Guidance Integration"
                status="on-track"
                app="Provincial Wellness"
                dueLabel="Due Apr 30"
              />
              <PriorityItem
                label="Diabetes Prevention KPI Review — Northern BC"
                status="on-track"
                app="MHIH · Dashboard"
                dueLabel="Due Apr 10"
              />
              <PriorityItem
                label="2025–26 Ministry Planning Cycle — Draft Submission"
                status="at-risk"
                app="Planning & KPIs"
                dueLabel="Due Apr 1"
              />
            </div>
          </section>

          <section
            className="rounded-xl p-4 self-start"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="section-label mb-3">Reporting Deadlines</div>
            <div className="space-y-2.5">
              {[
                { label: "Q3 HIBC Contribution Report", due: "Mar 31", urgency: "high" },
                { label: "Annual Health Equity Scan", due: "Apr 15", urgency: "medium" },
                { label: "Mental Health Strategy Update", due: "Apr 30", urgency: "medium" },
                { label: "FNHA Partnership Workplan", due: "May 15", urgency: "low" },
              ].map((item) => {
                const urgencyColor = item.urgency === "high" ? "#ff4d4f" : item.urgency === "medium" ? "#ffab40" : "var(--text-muted)";
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    <Calendar size={11} style={{ color: urgencyColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: urgencyColor }}>{item.due}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <Link
                to={createPageUrl("ContractsReporting")}
                className="flex items-center gap-1 text-xs"
                style={{ color: "#fb923c" }}
              >
                All deadlines <ArrowRight size={11} />
              </Link>
            </div>
          </section>
        </div>

        {/* ── Zone 3: Application launcher ────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="section-label">Platform</div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                Applications
              </h2>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {apps.filter(a => a.status === APP_STATUS.ACTIVE).length} active ·{" "}
              {apps.filter(a => a.status === APP_STATUS.SCAFFOLD).length} in development
            </span>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>

        {/* ── Footer identity ─────────────────────────────────────────── */}
        <div
          className="py-4 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ background: "#FEDD00" }}
            >
              <span style={{ fontSize: 8, fontWeight: 900, color: "#043673" }}>RR</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Red River OS · MNBC Health &amp; Wellness · Sovereign governance workspace
            </span>
          </div>
          <Link
            to={createPageUrl("Settings")}
            style={{ fontSize: 11, color: "var(--text-muted)" }}
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}