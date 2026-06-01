/**
 * OSHeader — refined top bar for Red River OS.
 *
 * Responsibilities:
 *   - Brand identity (logo + OS wordmark) with subtle accent treatment
 *   - Sidebar collapse/expand toggle (kept near the rail it controls)
 *   - App switcher (lightweight dropdown via <AppMenu/>)
 *   - Contextual breadcrumb showing App › Page
 *   - Global search trigger (opens command palette)
 *   - Action cluster: notifications, user menu
 *
 * All app navigation logic stays in Layout — this is presentation + plumbing only.
 */

import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Search, Bell, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
  LayoutDashboard, Database, Brain, Users, FileDown, BookOpen, Shield,
  BarChart3, SlidersHorizontal, ShieldCheck, Bot, MapPin, TrendingUp,
  Wrench, BellRing, Workflow, Sparkles, Activity, FlaskConical,
  ClipboardCheck, BrainCircuit, MapPinned, Siren, BookMarked, Link2,
  ListOrdered, GitCompare, FileText, Command, Building2, Target,
  HeartPulse, Scale, HeartHandshake, Leaf, FileSignature, Camera, Layers3,
} from "lucide-react";
import AppMenu from "./AppMenu";

const ICON_MAP = {
  LayoutDashboard, Database, Brain, Users, Search, Bell,
  FileDown, BookOpen, Shield, BarChart3, SlidersHorizontal, ShieldCheck, Bot,
  MapPin, TrendingUp, Wrench, BellRing, Workflow, Sparkles,
  Activity, FlaskConical, ClipboardCheck, BrainCircuit, MapPinned, Siren,
  BookMarked, Link2, ListOrdered, GitCompare, FileText,
  Command, Building2, Target, HeartPulse, Scale, HeartHandshake, Leaf,
  FileSignature, Camera, Layers3,
};

function Icon({ name, size = 14, ...rest }) {
  const Comp = ICON_MAP[name];
  if (!Comp) return null;
  return <Comp size={size} {...rest} />;
}

// Humanize a PascalCase page name → "Pascal Case"
function humanizePageName(pageName) {
  if (!pageName) return "";
  return pageName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function OSHeader({
  user,
  activeApp,
  accent,
  currentPageName,
  sidebarOpen,
  onToggleSidebar,
  onOpenSearch,
  unreadCount,
  notifCenterOpen,
  onToggleNotifications,
  onOpenUserPanel,
  showBreadcrumb = true,
}) {
  // ── Local UI state ─────────────────────────────────────────────────
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const appBtnRef = useRef(null);

  // ── Breadcrumb data ────────────────────────────────────────────────
  const pageLabel = humanizePageName(currentPageName);
  const isAtAppLanding = activeApp && currentPageName === activeApp.landingPage;
  const showBreadcrumbPage = showBreadcrumb && pageLabel && !isAtAppLanding;

  return (
    <header
      className="flex items-center shrink-0 relative os-header"
      style={{
        height: "var(--header-height)",
        background: "linear-gradient(180deg, #0f1b2e 0%, var(--bg-surface) 100%)",
        borderBottom: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-header)",
        zIndex: 30,
      }}
    >
      <style>{`
        .os-header-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 28px;
          padding: 0 8px;
          border-radius: 6px;
          color: var(--text-secondary);
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
          cursor: pointer;
          background: transparent;
          border: 1px solid transparent;
          position: relative;
        }
        .os-header-btn:hover {
          background: rgba(255,255,255,0.04);
          color: var(--text-primary);
        }
        .os-header-btn.active {
          background: rgba(254,221,0,0.08);
          color: #FEDD00;
        }
        .os-icon-btn {
          width: 28px;
          padding: 0;
        }
        .os-search-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 28px;
          padding: 0 8px 0 10px;
          border-radius: 6px;
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          font-size: 12px;
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
          cursor: text;
          min-width: 220px;
          max-width: 360px;
          flex: 1;
        }
        .os-search-trigger:hover {
          background: rgba(255,255,255,0.045);
          border-color: var(--border-default);
        }
        .os-search-trigger:focus-visible {
          outline: none;
          border-color: rgba(254,221,0,0.5);
          box-shadow: 0 0 0 2px rgba(254,221,0,0.12);
        }
        .os-kbd {
          font-size: 9.5px;
          line-height: 1;
          color: var(--text-secondary);
          background: rgba(255,255,255,0.05);
          padding: 3px 5px;
          border-radius: 3px;
          border: 1px solid var(--border-subtle);
          font-family: 'Sofia Sans', sans-serif;
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .os-divider {
          width: 1px;
          height: 20px;
          background: linear-gradient(180deg, transparent, var(--border-subtle), transparent);
          margin: 0 8px;
        }
        .os-brand-mark {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: linear-gradient(135deg, #FEDD00 0%, #ffe933 100%);
          color: #043673;
          font-weight: 900;
          font-size: 10px;
          letter-spacing: -0.02em;
          box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset, 0 1px 2px rgba(0,0,0,0.4);
        }
        .os-brand-mark::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 6px;
          box-shadow: 0 0 0 1px rgba(254,221,0,0.25);
          pointer-events: none;
        }
        .os-crumb-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 26px;
          padding: 0 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          transition: background 0.12s ease, color 0.12s ease;
          text-decoration: none;
        }
        .os-crumb-link:hover {
          background: rgba(255,255,255,0.04);
          color: var(--text-primary);
        }
        .notif-pulse {
          position: absolute;
          top: 3px;
          right: 3px;
          min-width: 14px;
          height: 14px;
          padding: 0 3px;
          background: #ff1744;
          font-size: 8.5px;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1.5px solid var(--bg-surface);
          box-shadow: 0 0 8px rgba(255,23,68,0.4);
        }
      `}</style>

      {/* Specular top-edge highlight */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, height: 1,
          background: "var(--highlight-edge-strong)",
          pointerEvents: "none",
        }}
      />

      {/* ── LEFT: Brand + sidebar toggle ───────────────────────────── */}
      <div className="flex items-center gap-2 pl-3 shrink-0">
        <Link to={createPageUrl("RedRiverOSHome")} className="flex items-center gap-2.5 group" title="Red River OS — Home">
          <div className="os-brand-mark">RR</div>
          <div className="hidden md:flex flex-col items-start leading-none">
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: "var(--text-primary)",
                fontFamily: "'Sofia Sans Extra Condensed', sans-serif",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              Red River
            </span>
            <span
              style={{
                fontSize: 8.5,
                fontWeight: 700,
                color: "#FEDD00",
                fontFamily: "'Sofia Sans Extra Condensed', sans-serif",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginTop: 1,
              }}
            >
              Operating System
            </span>
          </div>
        </Link>

        <button
          onClick={onToggleSidebar}
          className="os-header-btn os-icon-btn ml-1"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </button>
      </div>

      <div className="os-divider" />

      {/* ── CENTER-LEFT: App switcher + breadcrumb ─────────────────── */}
      <div className="flex items-center gap-1 min-w-0">
        {/* App switcher trigger */}
        <div className="relative shrink-0" ref={appBtnRef}>
          <button
            onClick={() => setAppMenuOpen(v => !v)}
            className="flex items-center gap-2 px-2.5 rounded-md transition-all"
            style={{
              height: 28,
              background: appMenuOpen ? `${accent}14` : `${accent}0a`,
              border: `1px solid ${appMenuOpen ? `${accent}55` : `${accent}30`}`,
              fontSize: 12,
              fontWeight: 600,
              color: accent,
            }}
            title="Switch app"
          >
            <span
              className="inline-flex items-center justify-center rounded"
              style={{
                width: 18, height: 18,
                background: `${accent}1f`,
                border: `1px solid ${accent}40`,
              }}
            >
              <Icon name={activeApp?.icon ?? "Command"} size={11} style={{ color: accent }} />
            </span>
            <span className="hidden sm:inline">{activeApp?.shortName ?? "Apps"}</span>
            <ChevronDown
              size={10}
              style={{
                color: accent,
                opacity: 0.7,
                transform: appMenuOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
              }}
            />
          </button>
          {appMenuOpen && (
            <AppMenu
              anchorRef={appBtnRef}
              align="left"
              onClose={() => setAppMenuOpen(false)}
            />
          )}
        </div>

        {/* Breadcrumb: › page-name (only when not on app landing) */}
        {showBreadcrumbPage && (
          <div className="hidden md:flex items-center gap-1 min-w-0">
            <ChevronRight size={12} style={{ color: "var(--text-muted)", opacity: 0.5, flexShrink: 0 }} />
            <span
              className="truncate"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-primary)",
                maxWidth: 220,
              }}
              title={pageLabel}
            >
              {pageLabel}
            </span>
          </div>
        )}
      </div>

      {/* ── CENTER: Search (flex spacer pushes it center-ish) ────────── */}
      <div className="flex-1 flex justify-center px-3 min-w-0">
        <button
          className="os-search-trigger"
          onClick={onOpenSearch}
          title="Search or jump to anything (Ctrl+K)"
        >
          <Search size={12} style={{ flexShrink: 0 }} />
          <span className="hidden sm:inline flex-1 text-left truncate">
            Search metrics, pages, reports…
          </span>
          <span className="hidden sm:inline os-kbd">Ctrl K</span>
        </button>
      </div>

      {/* ── RIGHT: Action cluster ──────────────────────────────────── */}
      <div className="flex items-center gap-0.5 pr-3 shrink-0">
        {/* Notifications */}
        <button
          className={`os-header-btn os-icon-btn ${notifCenterOpen ? "active" : ""}`}
          onClick={onToggleNotifications}
          title="Notifications"
        >
          <Bell size={14} />
          {unreadCount > 0 && (
            <span className="notif-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="os-divider" style={{ margin: "0 4px" }} />

        {/* User panel trigger — opens slide-in preferences */}
        <button
          className="os-header-btn"
          onClick={onOpenUserPanel}
          title="Workspace & preferences"
          style={{ paddingLeft: 4, paddingRight: 10, gap: 8 }}
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              style={{
                width: 22, height: 22,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid var(--border-subtle)",
              }}
            />
          ) : (
            <span
              className="inline-flex items-center justify-center rounded-full"
              style={{
                width: 22, height: 22,
                background: "linear-gradient(135deg, #2a456a 0%, #1a2e48 100%)",
                color: "#FEDD00",
                fontSize: 10,
                fontWeight: 700,
                border: "1px solid var(--border-default)",
              }}
            >
              {(user?.full_name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
            </span>
          )}
          <span
            className="hidden lg:inline truncate"
            style={{ fontSize: 12, fontWeight: 600, maxWidth: 120 }}
          >
            {user?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Account"}
          </span>
        </button>
      </div>
    </header>
  );
}