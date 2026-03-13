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
    return localStorage.getItem("rros_active_app") ?? "mhih";
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
      { type, msg, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const switchApp = useCallback((appId) => {
    setActiveAppId(appId);
    setAppSwitcherOpen(false);
  }, []);

  const activeApp = getApp(activeAppId) ?? getApp("mhih");

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

    // Shared evidence state
    latestForgeQuery,
    setLatestForgeQuery,
    evidenceProjectionMode,
    updateEvidenceProjectionMode,
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
