import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Database, LineChart, Brain, Settings, Users,
  Search, Bell, ChevronRight, Activity, AlertCircle, CheckCircle,
  Info, X, Zap, FileDown, Upload, BookOpen, Shield, HelpCircle,
  FolderOpen, BarChart3, ChevronLeft, SlidersHorizontal, ShieldCheck, Bot,
  MapPin, TrendingUp, Wrench, BellRing, Workflow, PanelLeftClose,
  PanelLeftOpen, Sparkles, LogOut, User, Circle
} from "lucide-react";

export const AppContext = createContext({});
export const useApp = () => useContext(AppContext);

const NAV_SECTIONS = [
  {
    key: "main", label: "Workspace", color: "#FEDD00",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", page: "Dashboard", tooltip: "Platform overview & KPIs" },
      { icon: Database, label: "Data Repository", page: "DataRepository", tooltip: "Browse all health metrics" },
      { icon: BarChart3, label: "Visualizations", page: "Visualizations", tooltip: "Charts, maps & trend views" },
      { icon: Brain, label: "AI Insights", page: "AIInsights", tooltip: "AI-generated health analysis" },
      { icon: Sparkles, label: "AI Analyst", page: "DataAnalyst", tooltip: "Ask questions about your data" },
    ]
  },
  {
    key: "data", label: "Data", color: "#40c4ff",
    items: [
      { icon: BookOpen, label: "Data Sources", page: "DataSources", tooltip: "Manage external data connections" },
      { icon: Database, label: "My Sources", page: "MyDataSources", tooltip: "Your personal data imports" },
      { icon: ShieldCheck, label: "Data Quality", page: "DataQuality", tooltip: "Review flags & quality issues" },
      { icon: Bot, label: "AI Agents", page: "AgentCenter", tooltip: "Automated agent tasks & runs" },
      { icon: FileDown, label: "Export", page: "Export", tooltip: "Download data as CSV or PDF" },
    ]
  },
  {
    key: "analytics", label: "Analytics", color: "#00e676",
    items: [
      { icon: TrendingUp, label: "Predictive", page: "PredictiveAnalytics", tooltip: "Forecasts & trend modelling" },
      { icon: MapPin, label: "Geo Map", page: "GeoMap", tooltip: "Regional health data map" },
      { icon: BellRing, label: "Alerts", page: "Alerts", tooltip: "Threshold alerts & notifications" },
      { icon: Wrench, label: "Data Prep", page: "DataPrep", tooltip: "Clean & transform data" },
      { icon: Workflow, label: "Workflows", page: "Workflows", tooltip: "Automated data pipelines" },
      { icon: Shield, label: "Governance", page: "DataGovernance", tooltip: "Audit logs & data policies" },
    ]
  },
  {
    key: "admin", label: "Administration", color: "#ffab40", adminOnly: true,
    items: [
      { icon: Users, label: "Team", page: "Team", tooltip: "Manage team members & roles" },
      { icon: Shield, label: "Admin", page: "Admin", tooltip: "System administration panel" },
    ]
  },
  {
    key: "system", label: "System", color: "#8b8fa8",
    items: [
      { icon: Settings, label: "Settings", page: "Settings", tooltip: "App preferences & configuration" },
    ]
  },
];

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items.map(i => ({ ...i, section: s.key })));

const COMMAND_ITEMS = [
  { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard, desc: "Platform overview & KPIs" },
  { label: "Data Repository", page: "DataRepository", icon: Database, desc: "Browse all health metrics" },
  { label: "Data Sources", page: "DataSources", icon: FolderOpen, desc: "Manage external connections" },
  { label: "My Data Sources", page: "MyDataSources", icon: Database, desc: "Your personal imports" },
  { label: "Data Quality", page: "DataQuality", icon: ShieldCheck, desc: "Review flags & issues" },
  { label: "AI Agents", page: "AgentCenter", icon: Bot, desc: "Automated agent tasks" },
  { label: "Visualizations", page: "Visualizations", icon: LineChart, desc: "Charts & trend views" },
  { label: "AI Insights", page: "AIInsights", icon: Brain, desc: "AI-generated analysis" },
  { label: "AI Analyst", page: "DataAnalyst", icon: Sparkles, desc: "Ask questions about data" },
  { label: "Predictive Analytics", page: "PredictiveAnalytics", icon: TrendingUp, desc: "Forecasts & modelling" },
  { label: "Geo Map", page: "GeoMap", icon: MapPin, desc: "Regional health map" },
  { label: "Alerts", page: "Alerts", icon: BellRing, desc: "Threshold notifications" },
  { label: "Data Prep", page: "DataPrep", icon: Wrench, desc: "Clean & transform data" },
  { label: "Workflows", page: "Workflows", icon: Workflow, desc: "Automated pipelines" },
  { label: "Data Governance", page: "DataGovernance", icon: Shield, desc: "Audit logs & policies" },
  { label: "Export Data", page: "Export", icon: FileDown, desc: "Download CSV or PDF" },
  { label: "Team Management", page: "Team", icon: Users, desc: "Manage team & roles" },
  { label: "Admin Panel", page: "Admin", icon: Shield, desc: "System administration" },
  { label: "Settings", page: "Settings", icon: Settings, desc: "App preferences" },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [cmdIndex, setCmdIndex] = useState(0);
  const [statusLogs, setStatusLogs] = useState([
    { type: "success", msg: "System initialized", time: new Date().toLocaleTimeString() }
  ]);
  const [contextPanel, setContextPanel] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const cmdInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const addLog = useCallback((type, msg) => {
    setStatusLogs(prev => [
      { type, msg, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 49)
    ]);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "p" || e.key === "k")) {
        e.preventDefault();
        setCmdOpen(v => !v);
        setCmdQuery("");
        setCmdIndex(0);
      }
      if (e.key === "Escape") { setCmdOpen(false); setUserMenuOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isAdmin = user?.role === "admin";
  const visibleSections = NAV_SECTIONS.filter(s => !s.adminOnly || isAdmin);

  const filteredCmds = COMMAND_ITEMS.filter(c =>
    c.label.toLowerCase().includes(cmdQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(cmdQuery.toLowerCase())
  );

  // Keyboard nav for command palette
  const handleCmdKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCmdIndex(i => Math.min(i + 1, filteredCmds.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCmdIndex(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && filteredCmds[cmdIndex]) {
      window.location.href = createPageUrl(filteredCmds[cmdIndex].page);
      setCmdOpen(false);
    }
  };

  useEffect(() => { setCmdIndex(0); }, [cmdQuery]);

  const lastLog = statusLogs[0];
  const logColor = lastLog?.type === "error" ? "#ff4d4f"
    : lastLog?.type === "warning" ? "#faad14"
    : lastLog?.type === "success" ? "#52c41a"
    : "#40c4ff";

  const currentSection = visibleSections.find(s => s.items.some(i => i.page === currentPageName));

  const toggleSection = (key) => setCollapsedSections(p => ({ ...p, [key]: !p[key] }));

  return (
    <AppContext.Provider value={{ user, addLog, setContextPanel, contextPanel }}>
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
        }
        body { background-color: #03080f !important; color: #f0f6ff !important; }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 5px 10px 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--text-secondary);
          position: relative;
          overflow: hidden;
        }
        .sidebar-nav-item:hover {
          background: rgba(255,255,255,0.04);
          color: var(--text-primary);
        }
        .sidebar-nav-item.active {
          background: rgba(254,221,0,0.07);
          color: #f0f6ff;
          font-weight: 600;
        }
        .sidebar-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 2.5px;
          border-radius: 0 2px 2px 0;
          background: var(--mnbc-yellow);
          box-shadow: 0 0 8px rgba(254,221,0,0.5);
        }
        .sidebar-nav-item .nav-icon {
          opacity: 0.6;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .sidebar-nav-item:hover .nav-icon,
        .sidebar-nav-item.active .nav-icon {
          opacity: 1;
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
          background: var(--bg-overlay);
        }
        .quick-action-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--border-default);
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .pulse-live { animation: pulse-dot 2s ease-in-out infinite; }

        .cmd-item-hover:hover { background: var(--bg-hover) !important; }
        .cmd-item-selected { background: var(--bg-hover) !important; }

        .sidebar-section-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          cursor: pointer;
          user-select: none;
          border-radius: 4px;
          transition: background 0.12s;
        }
        .sidebar-section-toggle:hover { background: rgba(255,255,255,0.03); }

        .right-panel-widget {
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-elevated);
          padding: 12px;
          transition: border-color 0.2s;
        }
        .right-panel-widget:hover { border-color: var(--border-default); }

        .panel-drawer {
          transition: width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease;
          overflow: hidden;
        }
        .panel-drawer.closed {
          width: 0 !important;
          opacity: 0;
          pointer-events: none;
        }
        .panel-drawer.open {
          opacity: 1;
        }

        .header-search-btn {
          transition: all 0.15s;
        }
        .header-search-btn:hover {
          background: var(--bg-overlay) !important;
          border-color: var(--border-default) !important;
        }
      `}</style>

      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>

        {/* ══ HEADER ══ */}
        <header
          className="flex items-center justify-between px-4 shrink-0 z-50"
          style={{
            height: "var(--header-height)",
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-subtle)",
            boxShadow: "0 1px 12px rgba(0,0,0,0.4)"
          }}
        >
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0" style={{ minWidth: sidebarOpen ? "var(--panel-left)" : "auto" }}>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="relative">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-sm"
                  style={{
                    background: "linear-gradient(135deg, #FEDD00 0%, #e6c000 100%)",
                    color: "#04245a",
                    boxShadow: "0 2px 8px rgba(254,221,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3)"
                  }}>
                  M
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'Sofia Sans Extra Condensed', 'Aptos Narrow', sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "0.08em", color: "var(--text-primary)", lineHeight: 1 }}>
                  MHIP
                </div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.06em", lineHeight: 1, marginTop: 2 }}>
                  HEALTH INTELLIGENCE
                </div>
              </div>
            </div>

            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="activity-icon shrink-0"
              style={{ width: 28, height: 28, marginLeft: 4 }}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            </button>
          </div>

          {/* Breadcrumb + Search center */}
          <div className="flex-1 flex items-center justify-center gap-3 mx-4">
            {/* Breadcrumb pill */}
            {currentSection && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                <span style={{ color: currentSection.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{currentSection.label}</span>
                <ChevronRight size={10} style={{ opacity: 0.5 }} />
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{currentPageName?.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            )}

            {/* Command search */}
            <button
              onClick={() => { setCmdOpen(true); setTimeout(() => cmdInputRef.current?.focus(), 50); }}
              className="header-search-btn hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                width: 220
              }}>
              <Search size={12} style={{ opacity: 0.6 }} />
              <span className="flex-1 text-left">Quick search...</span>
              <div className="flex items-center gap-0.5">
                <kbd style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", fontSize: 9, padding: "1px 5px", borderRadius: 3, border: "1px solid var(--border-default)", fontFamily: "monospace" }}>Ctrl+K</kbd>
              </div>
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCmdOpen(true)} className="md:hidden activity-icon" title="Search">
              <Search size={15} />
            </button>

            <button className="activity-icon relative" title="Notifications">
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-error)" }} />
            </button>

            <button
              onClick={() => setRightPanelOpen(v => !v)}
              className="activity-icon"
              title={rightPanelOpen ? "Collapse tools panel" : "Expand tools panel"}
            >
              <SlidersHorizontal size={15} />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ml-1"
                style={{
                  background: userMenuOpen ? "var(--bg-overlay)" : "var(--bg-elevated)",
                  border: `1px solid ${userMenuOpen ? "var(--border-default)" : "var(--border-subtle)"}`,
                  cursor: "pointer"
                }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(254,221,0,0.15)", color: "var(--mnbc-yellow)", border: "1px solid rgba(254,221,0,0.25)" }}>
                  {user?.full_name?.[0] || "?"}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                    {user?.full_name?.split(" ")[0] || "Loading"}
                  </div>
                  {isAdmin && (
                    <div className="text-xs leading-tight" style={{ color: "var(--mnbc-yellow)", fontSize: 9, letterSpacing: "0.05em" }}>ADMIN</div>
                  )}
                </div>
                <ChevronRight size={11} style={{ color: "var(--text-muted)", transform: userMenuOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden z-50 min-w-44"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                  <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{user?.full_name || "User"}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>{user?.email || ""}</div>
                  </div>
                  <div className="py-1">
                    <Link to={createPageUrl("Settings")} onClick={() => setUserMenuOpen(false)}>
                      <div className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                        <Settings size={12} />
                        Settings
                      </div>
                    </Link>
                    <div className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-colors"
                      style={{ color: "var(--color-error)" }}
                      onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseOut={e => e.currentTarget.style.background = "transparent"}
                      onClick={() => base44.auth.logout()}>
                      <LogOut size={12} />
                      Sign out
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ══ BODY ══ */}
        <div className="flex flex-1 overflow-hidden" onClick={() => userMenuOpen && setUserMenuOpen(false)}>

          {/* ══ LEFT SIDEBAR ══ */}
          <aside
            className={`panel-drawer flex flex-col shrink-0 ${sidebarOpen ? "open" : "closed"}`}
            style={{
              width: sidebarOpen ? "var(--panel-left)" : 0,
              background: "var(--bg-surface)",
              borderRight: sidebarOpen ? "1px solid var(--border-subtle)" : "none",
            }}
          >
              {/* Nav */}
              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {visibleSections.map(sec => {
                  const collapsed = collapsedSections[sec.key];
                  return (
                    <div key={sec.key} className="mb-1">
                      {/* Section header */}
                      <div
                        className="sidebar-section-toggle"
                        onClick={() => toggleSection(sec.key)}
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sec.color, boxShadow: `0 0 4px ${sec.color}80` }} />
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", flex: 1 }}>{sec.label}</span>
                        <ChevronRight
                          size={11}
                          style={{
                            color: "var(--text-muted)",
                            transform: collapsed ? "rotate(0deg)" : "rotate(90deg)",
                            transition: "transform 0.15s",
                            opacity: 0.5
                          }}
                        />
                      </div>

                      {/* Items */}
                      {!collapsed && (
                        <div className="mt-0.5 space-y-0.5 pl-1">
                          {sec.items.map(item => (
                            <Link key={item.page} to={createPageUrl(item.page)} title={item.tooltip}>
                              <div className={`sidebar-nav-item ${currentPageName === item.page ? "active" : ""}`}>
                                <item.icon size={13} className="nav-icon" style={{ color: currentPageName === item.page ? sec.color : undefined }} />
                                <span className="truncate">{item.label}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Sidebar footer */}
              <div className="px-3 py-3 shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="relative shrink-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "rgba(254,221,0,0.12)", color: "var(--mnbc-yellow)", border: "1px solid rgba(254,221,0,0.2)" }}>
                      {user?.full_name?.[0] || "?"}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border" style={{ background: "var(--color-success)", borderColor: "var(--bg-surface)" }} />
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user?.full_name || "..."}</div>
                    <div className="text-xs truncate" style={{ color: "var(--text-muted)", fontSize: 10, textTransform: "capitalize" }}>{user?.role || "viewer"}</div>
                  </div>
                  <Link to={createPageUrl("Settings")} title="Settings">
                    <div className="activity-icon shrink-0" style={{ width: 26, height: 26 }}>
                      <Settings size={13} />
                    </div>
                  </Link>
                </div>
              </div>
            </aside>

          {/* ══ MAIN ══ */}
          <main className="flex-1 overflow-auto relative" style={{ background: "var(--bg-base)" }}>
            {children}
          </main>

          {/* ══ RIGHT PANEL ══ */}
          <aside
            className={`panel-drawer flex flex-col shrink-0 ${rightPanelOpen ? "open" : "closed"}`}
            style={{
              width: rightPanelOpen ? "var(--panel-right)" : 0,
              background: "var(--bg-surface)",
              borderLeft: rightPanelOpen ? "1px solid var(--border-subtle)" : "none",
            }}
          >
              {/* Panel header */}
              <div className="flex items-center justify-between px-3 py-2 shrink-0"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "rgba(254,221,0,0.1)" }}>
                    <Zap size={10} style={{ color: "var(--mnbc-yellow)" }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    {contextPanel?.title || "Tools"}
                  </span>
                </div>
                <button
                  onClick={() => setRightPanelOpen(false)}
                  className="activity-icon"
                  style={{ width: 22, height: 22 }}
                  title="Collapse panel"
                >
                  <ChevronRight size={12} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {contextPanel?.content || <RightPanelDefault user={user} addLog={addLog} isAdmin={isAdmin} />}
              </div>
            </aside>
        </div>

        {/* ══ STATUS BAR ══ */}
        <footer
          className="flex items-center px-4 gap-4 shrink-0 overflow-hidden"
          style={{
            height: "var(--footer-height)",
            background: "var(--bg-surface)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {/* Log message */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Circle size={6} className="shrink-0 pulse-live" style={{ color: logColor, fill: logColor }} />
            <span className="truncate" style={{ fontSize: 11, color: logColor, opacity: 0.9 }} title={lastLog?.msg}>{lastLog?.msg}</span>
            {lastLog?.time && (
              <span className="shrink-0 ml-1" style={{ color: "var(--text-muted)", fontSize: 10 }}>{lastLog.time}</span>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
              {new Date().toLocaleDateString("en-CA")}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.15)" }}>
              <span className="status-dot active pulse-live" />
              <span style={{ color: "var(--color-success)", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em" }}>LIVE</span>
            </div>
          </div>
        </footer>

        {/* ══ COMMAND PALETTE ══ */}
        {cmdOpen && (
          <div
            className="cmd-overlay"
            onClick={() => setCmdOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{
                background: "#0d1929",
                border: "1px solid var(--border-emphasis)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(254,221,0,0.15)"
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border-default)" }}>
                <Search size={16} style={{ color: "var(--mnbc-yellow)", flexShrink: 0 }} />
                <input
                  ref={cmdInputRef}
                  autoFocus
                  className="flex-1 bg-transparent outline-none"
                  style={{ color: "var(--text-primary)", fontSize: 14 }}
                  placeholder="Search pages and commands..."
                  value={cmdQuery}
                  onChange={e => setCmdQuery(e.target.value)}
                  onKeyDown={handleCmdKey}
                />
                {cmdQuery && (
                  <button onClick={() => setCmdQuery("")} className="activity-icon" style={{ width: 20, height: 20 }}>
                    <X size={12} />
                  </button>
                )}
                <kbd style={{ background: "var(--bg-overlay)", color: "var(--text-muted)", fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid var(--border-default)", fontFamily: "monospace", flexShrink: 0 }}>ESC</kbd>
              </div>

              {/* Results */}
              <div className="py-1.5 max-h-80 overflow-y-auto">
                {filteredCmds.length === 0 ? (
                  <div className="px-4 py-8 text-center" style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    No results for "{cmdQuery}"
                  </div>
                ) : (
                  filteredCmds.map((cmd, i) => (
                    <Link
                      key={cmd.page}
                      to={createPageUrl(cmd.page)}
                      onClick={() => { setCmdOpen(false); setCmdQuery(""); }}
                    >
                      <div
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${i === cmdIndex ? "cmd-item-selected" : "cmd-item-hover"}`}
                        style={{ transition: "background 0.1s" }}
                        onMouseEnter={() => setCmdIndex(i)}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: i === cmdIndex ? "rgba(254,221,0,0.12)" : "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                          <cmd.icon size={13} style={{ color: i === cmdIndex ? "var(--mnbc-yellow)" : "var(--text-secondary)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>{cmd.label}</div>
                          <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{cmd.desc}</div>
                        </div>
                        <ChevronRight size={12} style={{ color: "var(--text-muted)", opacity: i === cmdIndex ? 1 : 0, transition: "opacity 0.1s" }} />
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 flex items-center gap-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}><kbd style={{ fontFamily: "monospace" }}>↑↓</kbd> navigate</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}><kbd style={{ fontFamily: "monospace" }}>↵</kbd> open</span>
                <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>{filteredCmds.length} results</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}

function RightPanelDefault({ user, isAdmin }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-3">
      {/* User greeting card */}
      <div className="right-panel-widget" style={{ background: "linear-gradient(135deg, rgba(254,221,0,0.07) 0%, rgba(4,54,115,0.15) 100%)", borderColor: "rgba(254,221,0,0.12)" }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "rgba(254,221,0,0.15)", color: "var(--mnbc-yellow)", border: "1px solid rgba(254,221,0,0.25)" }}>
            {user?.full_name?.[0] || "?"}
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{greeting}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)", fontSize: 10 }}>{user?.full_name?.split(" ")[0] || "User"}</div>
          </div>
        </div>
        <div className="text-xs" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {now.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Zap size={10} style={{ color: "var(--mnbc-yellow)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Quick Actions</span>
        </div>
        <div className="space-y-1.5">
          {[
            { icon: Sparkles, label: "Generate AI Insight", page: "AIInsights", color: "#a78bfa" },
            { icon: Upload, label: "Import Data", page: "DataRepository", color: "#40c4ff" },
            { icon: BarChart3, label: "New Visualization", page: "Visualizations", color: "#00e676" },
            { icon: FileDown, label: "Export Report", page: "Export", color: "#ffab40" },
          ].map(({ icon: Icon, label, page, color }) => (
            <Link key={page} to={createPageUrl(page)}>
              <div className="quick-action-btn">
                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                  <Icon size={12} style={{ color }} />
                </div>
                <span className="flex-1">{label}</span>
                <ChevronRight size={11} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Session info */}
      <div className="right-panel-widget">
        <div className="flex items-center gap-1.5 mb-3">
          <Activity size={10} style={{ color: "var(--color-success)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Session</span>
        </div>
        <div className="space-y-2">
          {[
            { label: "Status", value: "Online", valueColor: "var(--color-success)" },
            { label: "Role", value: user?.role || "—", valueColor: "var(--accent-primary)" },
            { label: "Version", value: "MHIP v2.0", valueColor: "var(--text-primary)" },
          ].map(({ label, value, valueColor }) => (
            <div key={label} className="flex items-center justify-between">
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
              <span style={{ fontSize: 11, color: valueColor, fontWeight: 500, textTransform: "capitalize" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Help */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <HelpCircle size={10} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Resources</span>
        </div>
        <div className="right-panel-widget" style={{ padding: 10 }}>
          <div className="text-xs" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            BC Métis Health Intelligence Platform — powered by MNBC and AI-driven analytics.
          </div>
        </div>
      </div>
    </div>
  );
}