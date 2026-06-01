/**
 * Red River OS — Application Shell
 *
 * The persistent shell wrapping all application modules. Provides:
 *   - OS header bar (identity, global search, app switcher, user menu)
 *   - Left sidebar (OS-level navigation + active-app navigation)
 *   - App context (addLog, contextPanel) preserved for backward compatibility
 *   - Notification, feedback, and command-palette systems
 *   - Status footer bar
 *
 * AppContext is exported for backward compatibility with existing pages that
 * call `useApp()` to access `addLog` and `setContextPanel`.
 */

import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Database, Brain, Settings, Users,
  Search, Bell, ChevronRight, ChevronDown, X,
  FileDown, BookOpen, Shield, BarChart3,
  SlidersHorizontal, ShieldCheck, Bot,
  MapPin, TrendingUp, Wrench, BellRing, Workflow,
  PanelLeftClose, PanelLeftOpen, Sparkles,
  LogOut, User, Activity, FlaskConical, ClipboardCheck,
  BrainCircuit, MapPinned, Siren, BookMarked, Link2,
  ListOrdered, GitCompare, FileText, MessageSquare,
  Command, Building2, Target, HeartPulse, Scale,
  HeartHandshake, Leaf, FileSignature, Camera,
  Layers3, ChevronLeft, MoreHorizontal, Grid3x3,
} from "lucide-react";
import NotificationCenter from "./components/notifications/NotificationCenter";
import NotificationPreferences from "./components/notifications/NotificationPreferences";
import FeedbackModal from "./components/feedback/FeedbackModal";
import CommandPalette from "./components/search/CommandPalette";
import PatchNotesModal from "./components/changelog/PatchNotesModal";
import FloatingFeedbackButton from "./components/feedback/FloatingFeedbackButton";
import PWAStatus from "./components/pwa/PWAStatus";
import AppMenu from "./components/shell/AppMenu";
import OSHeader from "./components/shell/OSHeader";
import UserPreferencesPanel from "./components/shell/UserPreferencesPanel";
import { PlatformProvider, usePlatform } from "./platform/platformContext";
import { APP_REGISTRY, APP_STATUS, getApp, getApps, getAppForPage } from "./platform/appRegistry";
import { isAdmin as checkAdmin, getRoleLabel } from "./platform/permissions";

// ── AppContext — backward-compat for existing pages ────────────────────────
export const AppContext = createContext({});
export const useApp = () => useContext(AppContext);

// ── Icon resolver ──────────────────────────────────────────────────────────
const ICON_MAP = {
  LayoutDashboard, Database, Brain, Settings, Users, Search, Bell,
  FileDown, BookOpen, Shield, BarChart3, SlidersHorizontal, ShieldCheck, Bot,
  MapPin, TrendingUp, Wrench, BellRing, Workflow, Sparkles, LogOut, User,
  Activity, FlaskConical, ClipboardCheck, BrainCircuit, MapPinned, Siren,
  BookMarked, Link2, ListOrdered, GitCompare, FileText, MessageSquare,
  Command, Building2, Target, HeartPulse, Scale, HeartHandshake, Leaf,
  FileSignature, Camera, Layers3, ChevronLeft,
};

function Icon({ name, size = 14, ...rest }) {
  const Comp = ICON_MAP[name];
  if (!Comp) return null;
  return <Comp size={size} {...rest} />;
}

// ── App accent color pills ─────────────────────────────────────────────────
const STATUS_LABEL = {
  [APP_STATUS.ACTIVE]: null,
  [APP_STATUS.SCAFFOLD]: "beta",
  [APP_STATUS.PLANNED]: "soon",
};

// ── App Switcher overlay ───────────────────────────────────────────────────
function AppSwitcher({ onClose, onSelect, activeAppId }) {
  const apps = getApps();
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-2xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="section-label">Red River OS</div>
            <h2 style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 700 }}>
              Applications
            </h2>
          </div>
          <button
            onClick={onClose}
            className="activity-icon"
            style={{ width: 32, height: 32 }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {apps.map((app) => {
            const isActive = app.id === activeAppId;
            const statusBadge = STATUS_LABEL[app.status];
            return (
              <button
                key={app.id}
                onClick={() => onSelect(app)}
                className="text-left rounded-xl p-4 transition-all"
                style={{
                  background: isActive
                    ? `rgba(${hexToRgb(app.accent)},0.08)`
                    : "var(--bg-overlay)",
                  border: `1px solid ${isActive ? app.accent + "44" : "var(--border-subtle)"}`,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: app.accent + "18", border: `1px solid ${app.accent}33` }}
                  >
                    <Icon name={app.icon} size={15} style={{ color: app.accent }} />
                  </div>
                  {statusBadge && (
                    <span
                      className="text-xs rounded px-1.5 py-0.5 font-semibold uppercase"
                      style={{ background: "var(--bg-hover)", color: "var(--text-muted)", fontSize: 9 }}
                    >
                      {statusBadge}
                    </span>
                  )}
                </div>
                <div
                  className="font-semibold text-sm mb-1"
                  style={{ color: isActive ? app.accent : "var(--text-primary)" }}
                >
                  {app.shortName}
                </div>
                <div
                  className="text-xs leading-snug"
                  style={{ color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                >
                  {app.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : "64,196,255";
}

// ── Sidebar nav section ────────────────────────────────────────────────────
function NavSection({ section, items, collapsed, onToggle, currentPage, accent }) {
  return (
    <div className="mb-2">
      {section && (
        <button
          className="w-full flex items-center gap-1.5 px-3 py-1 mb-1 rounded transition-opacity"
          onClick={onToggle}
          style={{ cursor: "pointer", opacity: 0.7 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          <span
            className="flex-1 text-left"
            style={{
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            {section}
          </span>
          <ChevronDown
            size={9}
            style={{
              color: "var(--text-muted)",
              transform: collapsed ? "rotate(-90deg)" : "none",
              transition: "transform 0.15s",
              opacity: 0.6,
            }}
          />
        </button>
      )}
      {!collapsed &&
        items.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <Link
              key={`${item.page}-${item.label}`}
              to={createPageUrl(item.page)}
              className={`sidebar-nav-item ${isActive ? "sidebar-nav-item-active" : ""}`}
              style={isActive ? {
                color: "var(--text-primary)",
                fontWeight: 600,
              } : {}}
            >
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    bottom: "20%",
                    width: 2.5,
                    borderRadius: "0 2px 2px 0",
                    background: accent,
                    boxShadow: `0 0 8px ${accent}88`,
                  }}
                />
              )}
              <Icon name={item.icon} size={13} style={{ color: isActive ? accent : "var(--text-muted)", flexShrink: 0 }} />
              <span style={{ color: isActive ? "var(--text-primary)" : undefined }}>
                {item.label}
              </span>
            </Link>
          );
        })}
    </div>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────
export default function Layout({ children, currentPageName }) {
  return (
    <PlatformProvider>
      <LayoutInner currentPageName={currentPageName}>
        {children}
      </LayoutInner>
    </PlatformProvider>
  );
}

function LayoutInner({ children, currentPageName }) {
  const platform = usePlatform();
  const location = useLocation();
  const navigate = useNavigate();

  // ── User state (preserved from original layout) ──────────────────────
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Panel / modal state ──────────────────────────────────────────────
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);
  const [notifPrefsOpen, setNotifPrefsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [patchNotesOpen, setPatchNotesOpen] = useState(false);
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const [contextPanel, setContextPanel] = useState(null);

  // ── Sidebar collapsed sections ───────────────────────────────────────
  const [collapsedSections, setCollapsedSections] = useState({});

  // ── Sidebar app dropdown ─────────────────────────────────────────────
  const [sidebarAppMenuOpen, setSidebarAppMenuOpen] = useState(false);
  const sidebarAppBtnRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch((err) => {
      console.warn("Layout: failed to load current user", err?.message ?? err);
    });
  }, []);

  // Refresh unread notification count every 30 s
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const n = await base44.entities.Notification.filter(
          { recipient_email: user.email, read: false }
        );
        setUnreadCount(n.length);
      } catch { /* silent */ }
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [user]);

  // ── Backward-compat addLog ────────────────────────────────────────────
  const addLog = useCallback((type, msg) => {
    platform.addLog(type, msg);
  }, [platform]);

  // ── Derived state ─────────────────────────────────────────────────────
  const adminUser = user?.role === "admin";
  const activeApp = platform.activeApp;
  const accent = activeApp?.accent ?? "#FEDD00";

  // Build nav sections for the active app
  const navSections = activeApp?.navItems ?? [];
  const adminNavItems = activeApp?.adminNavItems ?? [];

  // OS-level nav items (always shown above app nav)
  const osApp = getApp("os-home");
  const osNavItems = osApp?.navItems ?? [];

  const lastLog = platform.statusLogs[0];
  const logColor =
    lastLog?.type === "error" ? "#ff4d4f" :
    lastLog?.type === "warning" ? "#faad14" :
    lastLog?.type === "success" ? "#52c41a" :
    "#40c4ff";

  return (
    <AppContext.Provider value={{ user, addLog, setContextPanel, contextPanel }}>
      {/* Theme CSS variables */}
      <style>{`
        :root {
          --background: 215 90% 4% !important;
          --foreground: 214 100% 97% !important;
          --card: 215 80% 7% !important;
          --card-foreground: 214 100% 97% !important;
          --popover: 215 80% 7% !important;
          --popover-foreground: 214 100% 97% !important;
          --primary: 52 100% 50% !important;
          --primary-foreground: 215 90% 4% !important;
          --secondary: 214 60% 13% !important;
          --secondary-foreground: 214 100% 97% !important;
          --muted: 214 60% 13% !important;
          --muted-foreground: 214 30% 55% !important;
          --accent: 52 100% 50% !important;
          --accent-foreground: 215 90% 4% !important;
          --border: 214 50% 19% !important;
          --input: 214 50% 19% !important;
          --ring: 52 100% 50% !important;
          --radius: 8px;
        }
        body { background-color: #03080f !important; color: #f0f6ff !important; }
        .sidebar-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 5px 10px 5px 14px; border-radius: 6px; margin: 1px 0;
          cursor: pointer; transition: background 0.12s ease, color 0.12s ease, box-shadow 0.15s ease;
          font-size: 12.5px; font-weight: 500;
          color: var(--text-secondary); position: relative; overflow: hidden;
          text-decoration: none; line-height: 1.3;
        }
        .sidebar-nav-item:hover {
          background: rgba(255,255,255,0.035);
          color: var(--text-primary);
        }
        .sidebar-nav-item-active {
          background: linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%) !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.04),
            inset 0 -1px 0 rgba(0,0,0,0.25),
            0 1px 2px rgba(0,0,0,0.2);
        }
      `}</style>

      <div
        className="fixed inset-0 flex flex-col"
        style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        {/* ── OS Header Bar ─────────────────────────────────────────────── */}
        <OSHeader
          user={user}
          activeApp={activeApp}
          accent={accent}
          currentPageName={currentPageName}
          sidebarOpen={platform.sidebarOpen}
          onToggleSidebar={platform.toggleSidebar}
          onOpenSearch={() => platform.setCommandPaletteOpen(true)}
          unreadCount={unreadCount}
          notifCenterOpen={notifCenterOpen}
          onToggleNotifications={() => setNotifCenterOpen(v => !v)}
          onOpenUserPanel={() => setUserPanelOpen(true)}
          showBreadcrumb={platform.showBreadcrumbInHeader}
        />

        {/* ── Body: sidebar + main ─────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">
          {/* ── Left Sidebar ─────────────────────────────────────────── */}
          {platform.sidebarOpen && (
            <aside
              className="flex flex-col shrink-0 overflow-hidden relative"
              style={{
                width: "var(--panel-left)",
                background: "var(--bg-surface)",
                borderRight: "1px solid var(--border-subtle)",
                boxShadow: "inset -1px 0 0 rgba(0,0,0,0.4), 4px 0 16px rgba(0,0,0,0.45), 8px 0 32px rgba(0,0,0,0.25)",
                zIndex: 20,
              }}
            >
              {/* Ambient accent glow — faint app-color radial bleed from top */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, height: 160,
                  background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${accent}14 0%, transparent 70%)`,
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
              {/* Specular top-edge highlight */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, height: 1,
                  background: "var(--highlight-edge)",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
              {/* Nav scroll area */}
              <nav className="flex-1 overflow-y-auto py-2 px-2 relative" style={{ scrollbarWidth: "thin", zIndex: 2 }}>
                {/* OS-level nav items — Home & Ministry Overview, independent of active app */}
                {osNavItems.map((item, i) => {
                  if (Array.isArray(item.items)) {
                    return item.items.map((sub) => {
                      const isActive = currentPageName === sub.page;
                      return (
                        <Link
                          key={sub.page}
                          to={createPageUrl(sub.page)}
                          className={`sidebar-nav-item ${isActive ? "sidebar-nav-item-active" : ""}`}
                          style={isActive ? {
                            color: "var(--text-primary)",
                            fontWeight: 600,
                          } : {}}
                        >
                          {isActive && (
                            <span style={{
                              position: "absolute", left: 0, top: "20%", bottom: "20%",
                              width: 2.5, borderRadius: "0 2px 2px 0",
                              background: "#FEDD00", boxShadow: "0 0 8px #FEDD0088",
                            }} />
                          )}
                          <Icon name={sub.icon} size={13} style={{ color: isActive ? "#FEDD00" : "var(--text-muted)", flexShrink: 0 }} />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    });
                  }
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page ?? i}
                      to={createPageUrl(item.page)}
                      className={`sidebar-nav-item ${isActive ? "sidebar-nav-item-active" : ""}`}
                      style={isActive ? { color: "var(--text-primary)", fontWeight: 600 } : {}}
                    >
                      <Icon name={item.icon} size={13} style={{ color: isActive ? "#FEDD00" : "var(--text-muted)", flexShrink: 0 }} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* App switcher — sits below OS nav so Home & Ministry Overview
                    visually remain outside any specific application context. */}
                {navSections.length > 0 && (
                  <>
                    <div style={{ height: 1, background: "var(--border-subtle)", margin: "10px 4px 8px" }} />
                    <div
                      className="px-3 mb-1"
                      style={{
                        fontSize: 9.5, fontWeight: 600, letterSpacing: "0.09em",
                        textTransform: "uppercase", color: "var(--text-muted)", opacity: 0.7,
                      }}
                    >
                      Application
                    </div>
                    <div className="relative shrink-0 px-1 mb-2" ref={sidebarAppBtnRef} style={{ zIndex: 25 }}>
                      <button
                        onClick={() => setSidebarAppMenuOpen(v => !v)}
                        className="flex items-center gap-2 px-2 py-1.5 transition-colors text-left w-full rounded-md"
                        style={{
                          background: sidebarAppMenuOpen ? "var(--bg-hover)" : "transparent",
                          border: `1px solid ${sidebarAppMenuOpen ? accent + "44" : "var(--border-subtle)"}`,
                        }}
                        title="Switch app"
                        onMouseEnter={(e) => {
                          if (!sidebarAppMenuOpen) e.currentTarget.style.background = "var(--bg-hover)";
                        }}
                        onMouseLeave={(e) => {
                          if (!sidebarAppMenuOpen) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                          style={{ background: accent + "18", border: `1px solid ${accent}33` }}
                        >
                          <Icon name={activeApp?.icon ?? "Command"} size={11} style={{ color: accent }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            style={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              lineHeight: 1.2,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {activeApp?.shortName ?? "Red River OS"}
                          </div>
                        </div>
                        <ChevronDown
                          size={11}
                          style={{
                            color: "var(--text-muted)",
                            opacity: 0.6,
                            transform: sidebarAppMenuOpen ? "rotate(180deg)" : "none",
                            transition: "transform 0.15s",
                          }}
                        />
                      </button>
                      {sidebarAppMenuOpen && (
                        <AppMenu
                          anchorRef={sidebarAppBtnRef}
                          align="left"
                          onClose={() => setSidebarAppMenuOpen(false)}
                        />
                      )}
                    </div>
                  </>
                )}

                {/* Active app nav sections */}
                {navSections.map((section) => {
                  if (Array.isArray(section.items)) {
                    // Sectioned nav
                    const sectionKey = section.section;
                    const collapsed = collapsedSections[sectionKey];
                    return (
                      <NavSection
                        key={sectionKey}
                        section={sectionKey}
                        items={section.items}
                        collapsed={collapsed}
                        onToggle={() => setCollapsedSections(p => ({ ...p, [sectionKey]: !p[sectionKey] }))}
                        currentPage={currentPageName}
                        accent={accent}
                      />
                    );
                  } else {
                    // Flat nav item
                    const isActive = currentPageName === section.page;
                    return (
                      <Link
                        key={section.page}
                        to={createPageUrl(section.page)}
                        className={`sidebar-nav-item ${isActive ? "sidebar-nav-item-active" : ""}`}
                        style={isActive ? { color: "var(--text-primary)", fontWeight: 600 } : {}}
                      >
                        <Icon name={section.icon} size={13} style={{ color: isActive ? accent : "var(--text-muted)", flexShrink: 0 }} />
                        <span>{section.label}</span>
                      </Link>
                    );
                  }
                })}

                {/* Admin section — muted accent so it doesn't compete with app color */}
                {adminUser && adminNavItems.length > 0 && (
                  <>
                    <div style={{ height: 1, background: "var(--border-subtle)", margin: "10px 4px 10px" }} />
                    <NavSection
                      section="Administration"
                      items={adminNavItems}
                      collapsed={collapsedSections["admin"]}
                      onToggle={() => setCollapsedSections(p => ({ ...p, admin: !p.admin }))}
                      currentPage={currentPageName}
                      accent="#8bafd4"
                    />
                  </>
                )}
              </nav>

            </aside>
          )}

          {/* ── Main content area ─────────────────────────────────────── */}
          <main
            className="flex-1 min-w-0 overflow-hidden flex flex-col relative"
            style={{
              background: "var(--bg-base)",
              boxShadow: "var(--shadow-inset-canvas)",
            }}
          >
            {/* Content */}
            <div className="flex-1 overflow-auto">
              {children}
            </div>
            {/* Status footer — third horizontal band */}
            <div
              className="shrink-0 flex items-center gap-2 px-3"
              style={{
                height: "var(--footer-height)",
                background: "var(--bg-surface)",
                borderTop: "1px solid var(--border-subtle)",
                fontSize: 10,
                color: "var(--text-muted)",
                zIndex: 5,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: logColor, boxShadow: `0 0 6px ${logColor}` }}
              />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lastLog?.msg ?? "Ready"}
              </span>
              <span style={{ opacity: 0.7 }}>
                {activeApp?.shortName ?? "Red River OS"}
              </span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span style={{ opacity: 0.7 }}>
                {user?.full_name ?? user?.email ?? "—"}
              </span>
            </div>
          </main>

          {/* ── Context panel (right) ─────────────────────────────────── */}
          {contextPanel && (
            <aside
              className="shrink-0 overflow-auto"
              style={{
                width: "var(--panel-right)",
                background: "var(--bg-surface)",
                borderLeft: "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {contextPanel.title ?? "Context"}
                </span>
                <button className="activity-icon" style={{ width: 24, height: 24 }} onClick={() => setContextPanel(null)}>
                  <X size={12} />
                </button>
              </div>
              <div className="p-3">{contextPanel.content}</div>
            </aside>
          )}
        </div>
      </div>

      {/* ── App Switcher overlay (kept for power users / deep-link) ───── */}
      {platform.appSwitcherOpen && (
        <AppSwitcher
          activeAppId={platform.activeAppId}
          onClose={() => platform.setAppSwitcherOpen(false)}
          onSelect={(app) => {
            platform.switchApp(app.id);
            navigate(createPageUrl(app.landingPage));
          }}
        />
      )}

      {/* ── Command palette ────────────────────────────────────────────── */}
      {platform.commandPaletteOpen && (
        <CommandPalette
          isOpen
          currentPageName={currentPageName}
          onClose={() => platform.setCommandPaletteOpen(false)}
        />
      )}

      {/* ── Notification center ────────────────────────────────────────── */}
      {notifCenterOpen && (
        <NotificationCenter
          user={user}
          onClose={() => setNotifCenterOpen(false)}
          onOpenPrefs={() => { setNotifCenterOpen(false); setNotifPrefsOpen(true); }}
        />
      )}

      {/* ── Notification preferences ───────────────────────────────────── */}
      {notifPrefsOpen && (
        <NotificationPreferences
          user={user}
          onClose={() => setNotifPrefsOpen(false)}
        />
      )}

      {/* ── User preferences panel ─────────────────────────────────────── */}
      {userPanelOpen && (
        <UserPreferencesPanel
          user={user}
          onClose={() => setUserPanelOpen(false)}
          onOpenFeedback={() => setFeedbackOpen(true)}
          onOpenNotificationPrefs={() => setNotifPrefsOpen(true)}
          onLogout={() => base44.auth.logout(window.location.href)}
        />
      )}

      {/* ── Feedback ───────────────────────────────────────────────────── */}
      {feedbackOpen && (
        <FeedbackModal user={user} onClose={() => setFeedbackOpen(false)} />
      )}
      <FloatingFeedbackButton onClick={() => setFeedbackOpen(true)} />

      {/* ── Patch notes ────────────────────────────────────────────────── */}
      {patchNotesOpen && (
        <PatchNotesModal onClose={() => setPatchNotesOpen(false)} />
      )}

      {/* ── PWA install prompt, update toast, offline banner ───────────── */}
      <PWAStatus />
    </AppContext.Provider>
  );
}