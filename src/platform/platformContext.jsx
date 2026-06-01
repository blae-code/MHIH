/**
 * Red River OS — Platform Context
 *
 * Platform-level state management: active app, navigation, notifications,
 * and audit log access. Consumed by the OS shell and app modules.
 *
 * Distinguished from AuthContext (auth/user) and AppContext (legacy layout
 * concerns). Over time, AppContext from Layout.jsx should migrate here.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getApp, getAppForPage } from "./appRegistry";
import { resolvePageName } from "./routes";

const PlatformContext = createContext(null);

export function PlatformProvider({ children }) {
  const location = useLocation();

  // ── Active app state ─────────────────────────────────────────────────
  const [activeAppId, setActiveAppId] = useState(() => {
    const stored = localStorage.getItem("rros_active_app");
    // Migrate legacy id "mhih" → "data-evidence" after the 2026-06 restructure
    if (stored === "mhih") return "data-evidence";
    return stored ?? "data-evidence";
  });

  // ── Command palette ──────────────────────────────────────────────────
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // ── Sidebar state ────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("rros_sidebar_open");
    return stored === null ? true : stored === "true";
  });

  // ── App switcher ─────────────────────────────────────────────────────
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);

  // ── Status / activity log (surface to footer bar) ────────────────────
  const [statusLogs, setStatusLogs] = useState([
    { type: "success", msg: "Red River OS initialised", time: new Date().toLocaleTimeString() },
  ]);

  // ── Breadcrumb ───────────────────────────────────────────────────────
  const [breadcrumb, setBreadcrumb] = useState([]);

  // ── Shared evidence state (MetricForge → EvidenceSnapshots) ──────────
  // latestQuery is set whenever MetricForgePanel completes a run; it persists
  // across page navigation so EvidenceSnapshots can reference it regardless
  // of where in the app it is rendered.
  const [latestForgeQuery, setLatestForgeQuery] = useState(null);
  const [evidenceProjectionMode, setEvidenceProjectionMode] = useState(() => {
    try {
      const stored = localStorage.getItem("rr_projection_mode");
      if (stored === "internal" || stored === "projected") return stored;
    } catch {}
    return "projected";
  });

  const updateEvidenceProjectionMode = useCallback((mode) => {
    setEvidenceProjectionMode(mode);
    try {
      localStorage.setItem("rr_projection_mode", mode);
    } catch {}
  }, []);

  // ── User preferences (persisted) ─────────────────────────────────────
  const [uiDensity, setUiDensity] = useState(() => {
    const stored = localStorage.getItem("rros_ui_density");
    return stored === "compact" || stored === "comfortable" ? stored : "comfortable";
  });
  const [accentIntensity, setAccentIntensity] = useState(() => {
    const stored = localStorage.getItem("rros_accent_intensity");
    return stored === "muted" || stored === "vivid" ? stored : "vivid";
  });
  const [showBreadcrumbInHeader, setShowBreadcrumbInHeader] = useState(() => {
    const stored = localStorage.getItem("rros_show_breadcrumb");
    return stored === null ? true : stored === "true";
  });
  const [recentPages, setRecentPages] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("rros_recent_pages") || "[]");
      return Array.isArray(stored) ? stored.slice(0, 8) : [];
    } catch { return []; }
  });

  // Persist preferences + apply density to document root
  useEffect(() => {
    localStorage.setItem("rros_ui_density", uiDensity);
    document.documentElement.setAttribute("data-density", uiDensity);
  }, [uiDensity]);
  useEffect(() => {
    localStorage.setItem("rros_accent_intensity", accentIntensity);
    document.documentElement.setAttribute("data-accent-intensity", accentIntensity);
  }, [accentIntensity]);
  useEffect(() => {
    localStorage.setItem("rros_show_breadcrumb", String(showBreadcrumbInHeader));
  }, [showBreadcrumbInHeader]);
  useEffect(() => {
    localStorage.setItem("rros_recent_pages", JSON.stringify(recentPages));
  }, [recentPages]);

  // Track recent pages as user navigates
  useEffect(() => {
    const pageName = resolvePageName(location.pathname);
    if (!pageName || pageName === "RedRiverOSHome") return;
    setRecentPages((prev) => {
      const filtered = prev.filter((p) => p.page !== pageName);
      return [{ page: pageName, path: location.pathname, ts: Date.now() }, ...filtered].slice(0, 8);
    });
  }, [location.pathname]);

  const clearRecentPages = useCallback(() => setRecentPages([]), []);

  // Derive active app from current route when it changes
  useEffect(() => {
    const pageName = resolvePageName(location.pathname);
    if (!pageName) return;
    const app = getAppForPage(pageName);
    if (app && !app.isOsLevel && app.id !== activeAppId) {
      setActiveAppId(app.id);
    }
  }, [location.pathname]);

  // Persist sidebar preference
  useEffect(() => {
    localStorage.setItem("rros_sidebar_open", String(sidebarOpen));
  }, [sidebarOpen]);

  // Persist active app
  useEffect(() => {
    localStorage.setItem("rros_active_app", activeAppId);
  }, [activeAppId]);

  // ── Keyboard shortcut: ⌘K / Ctrl+K opens command palette ────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────
  const addLog = useCallback((type, msg) => {
    setStatusLogs((prev) => [
      { type, msg, time: new Date().toLocaleTimeString(), timestamp: Date.now() },
      ...prev.slice(0, 199),
    ]);
  }, []);

  const clearLogs = useCallback(() => {
    setStatusLogs([{ type: "info", msg: "Log cleared", time: new Date().toLocaleTimeString(), timestamp: Date.now() }]);
  }, []);

  const switchApp = useCallback((appId) => {
    setActiveAppId(appId);
    setAppSwitcherOpen(false);
  }, []);

  const activeApp = getApp(activeAppId) ?? getApp("data-evidence");

  const value = {
    // App state
    activeAppId,
    activeApp,
    switchApp,

    // App switcher
    appSwitcherOpen,
    setAppSwitcherOpen,

    // Sidebar
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar: () => setSidebarOpen((v) => !v),

    // Command palette
    commandPaletteOpen,
    setCommandPaletteOpen,

    // Breadcrumb
    breadcrumb,
    setBreadcrumb,

    // Activity log
    statusLogs,
    addLog,
    clearLogs,

    // Shared evidence state
    latestForgeQuery,
    setLatestForgeQuery,
    evidenceProjectionMode,
    updateEvidenceProjectionMode,

    // User preferences
    uiDensity,
    setUiDensity,
    accentIntensity,
    setAccentIntensity,
    showBreadcrumbInHeader,
    setShowBreadcrumbInHeader,
    recentPages,
    clearRecentPages,
  };

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return ctx;
}