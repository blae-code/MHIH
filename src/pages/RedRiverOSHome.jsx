/**
 * Red River OS — Home (Cockpit)
 *
 * Live single-screen cockpit: real platform stats, active priorities and
 * deadlines from policy requests, a live activity ticker, quick-resume
 * chips, and the app launcher — with staggered entrance animations.
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { APP_STATUS, getApps } from "@/platform/appRegistry";
import ZoneHeader from "@/components/shell/ZoneHeader";
import HomeStatCard from "@/components/home/HomeStatCard";
import AppLauncherCard from "@/components/home/AppLauncherCard";
import PriorityRow from "@/components/home/PriorityRow";
import ActivityTicker from "@/components/home/ActivityTicker";
import QuickResume from "@/components/home/QuickResume";
import useHomeData, { formatCountdown } from "@/components/home/useHomeData";
import {
  Calendar, Activity, AlertTriangle, FileClock, Layers, Sparkles, Inbox,
} from "lucide-react";

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  }),
};

function EmptyState({ icon: Icon, text, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-1.5" style={{ color: "var(--text-muted)" }}>
      <Icon size={20} style={{ opacity: 0.4 }} />
      <span style={{ fontSize: 11 }}>{text}</span>
      {hint && <span style={{ fontSize: 9.5, opacity: 0.7 }}>{hint}</span>}
    </div>
  );
}

export default function RedRiverOSHome() {
  const { user } = useAuth();
  const apps = getApps();
  const [time, setTime] = useState(new Date());
  const data = useHomeData();

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

  const dateStr = time.toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric" });
  const timeStr = time.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });

  const overdueCount = data.priorities.filter((p) => p.status === "overdue").length;
  const atRiskCount = data.priorities.filter((p) => p.status === "at-risk").length;

  const activeCount = apps.filter(a => a.status === APP_STATUS.ACTIVE).length;
  const scaffoldCount = apps.filter(a => a.status === APP_STATUS.SCAFFOLD).length;
  const firstName = user?.full_name ? user.full_name.split(" ")[0] : "";

  return (
    <div className="h-full flex flex-col overflow-hidden relative" style={{ background: "var(--bg-base)" }}>
      {/* Ambient page glow */}
      <div aria-hidden style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 260,
        background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(254,221,0,0.05) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div aria-hidden style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
        background: "radial-gradient(ellipse 50% 100% at 50% 100%, rgba(64,196,255,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
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
          border: 1px solid var(--border-default);
          background: #0a1220;
          padding: 12px;
          transition: border-color 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 16px rgba(0,0,0,0.35);
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .home-widget-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1.5px;
          background: linear-gradient(90deg, rgba(254,221,0,0.7) 0%, rgba(64,196,255,0.45) 55%, transparent 100%);
          pointer-events: none;
        }
        .home-widget-card:hover {
          border-color: rgba(254,221,0,0.35);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 0 24px rgba(254,221,0,0.06), 0 8px 24px rgba(0,0,0,0.4);
        }
        .home-priority-row {
          transition: background 0.15s, border-color 0.15s, transform 0.15s;
        }
        .home-priority-row:hover {
          background: var(--bg-hover) !important;
          transform: translateX(2px);
        }
        .zone-header-link:hover {
          color: var(--mnbc-yellow) !important;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
      `}</style>

      <div className="flex-1 min-h-0 flex flex-col px-4 py-3 gap-2.5 relative" style={{ zIndex: 1 }}>

        {/* ── Hero header ────────────────────────────────────────────── */}
        <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="show"
          className="shrink-0 rounded-lg overflow-hidden" style={{
            background: "linear-gradient(to bottom, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(254,221,0,0.08)",
          }}>
          <div className="px-4 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 pulse-dot"
                style={{ background: "var(--color-success)", boxShadow: "0 0 8px rgba(0,230,118,0.5)" }}
                title="All systems nominal"
              />
              <div className="min-w-0">
                <h1 className="mnbc-heading truncate"
                  style={{ fontSize: 18, color: "var(--text-primary)", lineHeight: 1.1, margin: 0 }}
                  title={user?.full_name ?? "Welcome"}>
                  {greeting}{firstName ? `, ${firstName}` : ""}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="dashboard-section-label" style={{ margin: 0 }}>
                    MNBC Health &amp; Wellness · Red River OS
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden md:block min-w-0 flex-1 px-4">
              <QuickResume />
            </div>
            <div className="shrink-0 flex flex-col items-end gap-0.5">
              <span style={{ fontSize: 11.5, color: "var(--text-secondary)", whiteSpace: "nowrap", fontWeight: 600 }}>
                {dateStr}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {timeStr} · Vancouver
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Live activity ticker ───────────────────────────────────── */}
        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="show" className="shrink-0">
          <ActivityTicker />
        </motion.div>

        {/* ── Stat strip — live counts ───────────────────────────────── */}
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="show" className="shrink-0">
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="dashboard-section-label" style={{ marginBottom: 0 }}>Platform Status</div>
            <span style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.75 }}>
              live data · hover any card for detail
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <HomeStatCard
              label="Health Metrics" value={data.metricsCount.toLocaleString()} loading={data.loading}
              icon={Layers} color="#40c4ff" bgColor="rgba(64,196,255,0.08)"
              desc="Records in the data repository"
              tooltip="Total health metric records currently stored in the Data & Evidence repository."
            />
            <HomeStatCard
              label="Open Requests" value={data.openRequests} loading={data.loading}
              icon={Activity} color="#FEDD00" bgColor="rgba(254,221,0,0.08)"
              desc="Policy requests in progress"
              tooltip="Policy assistance requests that are not yet completed, closed, or rejected."
            />
            <HomeStatCard
              label="Open Alerts" value={data.openAlerts} loading={data.loading}
              icon={AlertTriangle} color="#ff4d4f" bgColor="rgba(255,77,79,0.08)"
              desc="Sentinel signals awaiting review"
              tooltip="Alert events with status 'open' raised by sentinel scans and data-quality pipelines."
            />
            <HomeStatCard
              label="Due 30d" value={data.dueSoon} loading={data.loading}
              icon={FileClock} color="#ffab40" bgColor="rgba(255,171,64,0.08)"
              desc="Deliverables due this month"
              tooltip="Open policy requests with a required completion date in the next 30 days."
            />
          </div>
        </motion.div>

        {/* ── Row 2: 2-column cockpit grid ──────────────────────────── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">

          {/* ── Left: Priorities + Deadlines stack ────────────────── */}
          <div className="min-h-0 flex flex-col gap-3">

            {/* Priorities — live policy requests */}
            <motion.section custom={3} variants={sectionVariants} initial="hidden" animate="show"
              className="home-widget-card" style={{ flex: "1 1 60%" }}>
              <ZoneHeader
                label="Active Focus"
                title="Ministry Priorities"
                linkTo="PolicyRequestTable"
                count={`${data.priorities.length} items`}
                hint={overdueCount > 0
                  ? `${overdueCount} overdue · ${atRiskCount} at risk`
                  : atRiskCount > 0 ? `${atRiskCount} at risk` : "all on track"}
              />
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 relative z-10">
                {data.loading ? (
                  [...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 36, borderRadius: 6 }} />)
                ) : data.priorities.length === 0 ? (
                  <EmptyState icon={Inbox} text="No open priorities" hint="Submitted policy requests appear here" />
                ) : (
                  data.priorities.map((p) => <PriorityRow key={p.id} {...p} />)
                )}
              </div>
            </motion.section>

            {/* Deadlines — live due dates */}
            <motion.section custom={4} variants={sectionVariants} initial="hidden" animate="show"
              className="home-widget-card" style={{ flex: "1 1 40%" }}>
              <ZoneHeader
                label="Upcoming"
                title="Reporting Deadlines"
                linkTo="PolicyRequestTable"
                linkLabel="All"
                count={`${data.deadlines.length} ahead`}
                hint="from open requests"
              />
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 relative z-10">
                {data.loading ? (
                  [...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: 30, borderRadius: 6 }} />)
                ) : data.deadlines.length === 0 ? (
                  <EmptyState icon={Calendar} text="No dated deliverables" hint="Requests with completion dates appear here" />
                ) : (
                  data.deadlines.map((item) => {
                    const urgencyColor =
                      item.urgency === "high" ? "#ff4d4f" :
                      item.urgency === "medium" ? "#ffab40" : "#40c4ff";
                    const countdown = formatCountdown(item.days);
                    return (
                      <div
                        key={item.id}
                        className="home-priority-row flex items-center gap-2 px-2.5 py-1.5 rounded-md"
                        title={`${item.label} · due ${item.due}${countdown ? ` · ${countdown}` : ""}`}
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
                        {countdown && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, color: urgencyColor,
                            background: urgencyColor + "18", padding: "1.5px 5px",
                            borderRadius: 3, border: `1px solid ${urgencyColor}33`,
                            whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums",
                          }}>
                            {countdown}
                          </span>
                        )}
                        <span style={{ fontSize: 11, fontWeight: 700, color: urgencyColor, whiteSpace: "nowrap", minWidth: 42, textAlign: "right" }}>
                          {item.due}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.section>
          </div>

          {/* ── Right: Applications grid ─────────────────────────── */}
          <motion.section custom={5} variants={sectionVariants} initial="hidden" animate="show"
            className="home-widget-card">
            <ZoneHeader
              label="Platform"
              title="Applications"
              count={`${activeCount} active${scaffoldCount > 0 ? ` · ${scaffoldCount} beta` : ""}`}
              hint="click to launch"
            />
            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 xl:grid-cols-2 gap-1.5 pr-1 content-start relative z-10">
              {apps.map((app) => (
                <AppLauncherCard key={app.id} app={app} />
              ))}
            </div>
            <div className="shrink-0 mt-2 pt-2 relative z-10 flex items-center gap-1.5"
              style={{ borderTop: "1px solid var(--border-subtle)", fontSize: 10, color: "var(--text-muted)" }}>
              <Sparkles size={10} style={{ color: "var(--mnbc-yellow)", opacity: 0.7 }} />
              <span>Press <kbd style={{
                background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
                borderRadius: 3, padding: "1px 5px", fontFamily: "ui-monospace, monospace", fontSize: 9.5,
              }}>⌘K</kbd> to search across all apps</span>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}