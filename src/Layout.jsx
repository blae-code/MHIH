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
import NotificationCenter from "../components/notifications/NotificationCenter";
import NotificationPreferences from "../components/notifications/NotificationPreferences";
import FeedbackModal from "../components/feedback/FeedbackModal";
import { MessageSquare as FeedbackIcon } from "lucide-react";

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
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);
  const [notifPrefsOpen, setNotifPrefsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const cmdInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Load unread notification count
  useEffect(() => {
    if (!user) return;
    const loadUnreadCount = async () => {
      try {
        const notifications = await base44.entities.Notification.filter(
          { recipient_email: user.email, read: false }
        );
        setUnreadCount(notifications.length);
      } catch (error) {
        console.error('Failed to load unread count:', error);
      }
    };
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  const addLog = useCallback((type, msg) => {
    setStatusLogs(prev => [
      { type, msg, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 49)
    ]);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && (e.key === "p" || e.key === "k")) {
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
          className="flex items-center justify-between px-5 shrink-0 z-50 relative overflow-hidden"
          style={{
            height: "var(--header-height)",
            background: "linear-gradient(90deg, #0a1220 0%, #0f1829 25%, #0d1f2a 50%, #0a1523 75%, #0a1220 100%)",
            borderBottom: "1px solid var(--border-default)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(254,221,0,0.15), 0 0 20px rgba(64,196,255,0.08)"
          }}>
          {/* Dynamic accent bar top */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #FEDD00 0%, #40c4ff 33%, #2ed573 66%, #FEDD00 100%)",
            backgroundSize: "200% 100%",
            animation: "gradientShift 8s ease-in-out infinite"
          }} />
          
          <style>{`
            @keyframes gradientShift {
              0%, 100% { background-position: 0% center; }
              50% { background-position: 100% center; }
            }
          `}</style>

          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0" style={{ minWidth: sidebarOpen ? "var(--panel-left)" : "auto" }}>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="relative group">
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "radial-gradient(circle at top-left, rgba(254,221,0,0.3), rgba(64,196,255,0.1))",
                    filter: "blur(16px)"
                  }} />
                <div className="relative w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm group-hover:scale-110 transition-transform duration-300"
                  style={{
                    background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 50%, #e6c000 100%)",
                    color: "#04245a",
                    boxShadow: "0 0 16px rgba(254,221,0,0.5), 0 4px 12px rgba(254,221,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.2)",
                    border: "1.5px solid rgba(255,255,255,0.2)"
                  }}>
                  M
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'Sofia Sans Extra Condensed', 'Aptos Narrow', sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: "0.1em", color: "var(--text-primary)", lineHeight: 1, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                  MHIP
                </div>
                <div style={{ fontSize: 8.5, color: "var(--text-muted)", letterSpacing: "0.08em", lineHeight: 1, marginTop: 2, fontWeight: 600 }}>
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
          <div className="flex-1 flex items-center justify-center gap-3 mx-6">
            {/* Breadcrumb pill */}
            {currentSection && (
              <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-full text-xs backdrop-blur-md transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${currentSection.color}12 0%, ${currentSection.color}08 100%)`,
                  border: `1.5px solid ${currentSection.color}44`,
                  boxShadow: `0 4px 16px ${currentSection.color}15, inset 0 1px 0 ${currentSection.color}22`
                }}>
                <span style={{ color: currentSection.color, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{currentSection.label}</span>
                <ChevronRight size={9} style={{ color: currentSection.color, opacity: 0.7 }} />
                <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 11 }}>{currentPageName?.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            )}

            {/* Command search */}
            <button
              onClick={() => { setCmdOpen(true); setTimeout(() => cmdInputRef.current?.focus(), 50); }}
              className="header-search-btn hidden md:flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all group"
              style={{
                background: "linear-gradient(135deg, rgba(64,196,255,0.08) 0%, rgba(254,221,0,0.05) 100%)",
                border: "1px solid rgba(64,196,255,0.3)",
                color: "var(--text-secondary)",
                width: 260,
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(64,196,255,0.08), inset 0 1px 0 rgba(64,196,255,0.15)"
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(64,196,255,0.15) 0%, rgba(254,221,0,0.1) 100%)";
                e.currentTarget.style.borderColor = "rgba(64,196,255,0.6)";
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(64,196,255,0.2), inset 0 1px 0 rgba(64,196,255,0.25)";
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(64,196,255,0.08) 0%, rgba(254,221,0,0.05) 100%)";
                e.currentTarget.style.borderColor = "rgba(64,196,255,0.3)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(64,196,255,0.08), inset 0 1px 0 rgba(64,196,255,0.15)";
              }}>
              <Search size={13} style={{ color: "#40c4ff", flexShrink: 0, opacity: 0.9 }} />
              <span className="flex-1 text-left opacity-80">Search workspace...</span>
              <kbd style={{ background: "rgba(64,196,255,0.15)", color: "#40c4ff", fontSize: 8, padding: "3px 7px", borderRadius: 3, border: "1px solid rgba(64,196,255,0.4)", fontFamily: "monospace", flexShrink: 0, fontWeight: 600, letterSpacing: "0.05em" }}>⌘K</kbd>
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFeedbackOpen(true)}
              className="activity-icon" 
              title="Send Feedback">
              <FeedbackIcon size={15} />
            </button>
            <button onClick={() => setCmdOpen(true)} className="md:hidden activity-icon" title="Search">
              <Search size={15} />
            </button>

            <button 
              onClick={() => setNotifCenterOpen(true)}
              className="activity-icon relative group" 
              title="Notifications">
              <Bell size={15} style={{ transition: "all 0.3s", color: unreadCount > 0 ? "#ff6b6b" : "inherit" }} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold animate-pulse" 
                  style={{ background: "linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%)", color: "white", fontSize: 9, boxShadow: "0 0 12px rgba(255,107,107,0.5)" }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setRightPanelOpen(v => !v)}
              className="activity-icon transition-all group"
              title={rightPanelOpen ? "Collapse tools panel" : "Expand tools panel"}
              style={{ color: rightPanelOpen ? "#40c4ff" : "inherit" }}
            >
              <SlidersHorizontal size={15} style={{ transition: "all 0.3s" }} />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ml-2 group hover:scale-105"
                style={{
                  background: userMenuOpen ? "linear-gradient(135deg, rgba(254,221,0,0.12) 0%, rgba(64,196,255,0.08) 100%)" : "linear-gradient(135deg, rgba(254,221,0,0.04) 0%, rgba(64,196,255,0.04) 100%)",
                  border: `1.5px solid ${userMenuOpen ? "rgba(254,221,0,0.4)" : "rgba(64,196,255,0.2)"}`,
                  cursor: "pointer",
                  boxShadow: userMenuOpen ? `0 0 16px rgba(254,221,0,0.15), inset 0 1px 0 rgba(254,221,0,0.2)` : "0 0 8px rgba(64,196,255,0.08)"
                }}
                onMouseOver={e => {
                  if (!userMenuOpen) {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(254,221,0,0.1) 0%, rgba(64,196,255,0.08) 100%)";
                    e.currentTarget.style.borderColor = "rgba(64,196,255,0.4)";
                  }
                }}
                onMouseOut={e => {
                  if (!userMenuOpen) {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(254,221,0,0.04) 0%, rgba(64,196,255,0.04) 100%)";
                    e.currentTarget.style.borderColor = "rgba(64,196,255,0.2)";
                  }
                }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 group-hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, rgba(254,221,0,0.25) 0%, rgba(64,196,255,0.15) 100%)", color: "var(--mnbc-yellow)", border: "1.5px solid rgba(254,221,0,0.3)", boxShadow: "0 0 12px rgba(254,221,0,0.2)" }}>
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
                    <div className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseOut={e => e.currentTarget.style.background = "transparent"}
                      onClick={() => { setNotifPrefsOpen(true); setUserMenuOpen(false); }}>
                      <Bell size={12} />
                      Notification Prefs
                    </div>
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
              background: "linear-gradient(to bottom, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
              borderRight: sidebarOpen ? "1px solid var(--border-default)" : "none",
              boxShadow: sidebarOpen ? "2px 0 12px rgba(0,0,0,0.3)" : "none"
            }}
          >
              {/* Nav — file-tree style */}
              <nav className="flex-1 overflow-y-auto py-2 px-2 flex flex-col">
                {visibleSections.map(sec => {
                  const collapsed = collapsedSections[sec.key];
                  return (
                    <div key={sec.key} className="mb-0.5">
                      {/* Folder row */}
                      <div
                        className="sidebar-section-toggle"
                        onClick={() => toggleSection(sec.key)}
                        style={{ padding: "3px 6px", gap: 5 }}
                      >
                        {/* Folder icon */}
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: sec.color }}>
                          {collapsed
                            ? <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2H6l1.5 1.5H13.5A1.5 1.5 0 0 1 15 5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5V3.5z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1"/>
                            : <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2H6l1.5 1.5H13.5A1.5 1.5 0 0 1 15 5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5V3.5z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1"/>
                          }
                        </svg>
                        <span style={{ fontSize: 11, fontWeight: 600, color: collapsed ? "var(--text-secondary)" : "var(--text-primary)", flex: 1, letterSpacing: "0.01em" }}>{sec.label}</span>
                        <ChevronRight
                          size={10}
                          style={{
                            color: "var(--text-muted)",
                            transform: collapsed ? "rotate(0deg)" : "rotate(90deg)",
                            transition: "transform 0.15s",
                            opacity: 0.4,
                            flexShrink: 0
                          }}
                        />
                      </div>

                      {/* File items with tree lines */}
                      {!collapsed && (
                        <div className="relative ml-3 mt-0.5" style={{ paddingLeft: 12 }}>
                          {/* Vertical tree line */}
                          <div className="absolute top-0 bottom-2 left-0" style={{ width: 1, background: `${sec.color}30` }} />

                          {sec.items.map((item, idx) => {
                            const isLast = idx === sec.items.length - 1;
                            const isActive = currentPageName === item.page;
                            return (
                              <div key={item.page} className="relative" style={{ marginBottom: 1 }}>
                                {/* Horizontal connector */}
                                <div className="absolute top-1/2 -translate-y-1/2" style={{ left: -12, width: 10, height: 1, background: `${sec.color}30` }} />
                                {/* Cap the vertical line at last item */}
                                {isLast && <div className="absolute" style={{ left: -13, top: "50%", bottom: 0, width: 3, background: "var(--bg-surface)" }} />}

                                <Link to={createPageUrl(item.page)} title={item.tooltip}>
                                  <div className={`sidebar-nav-item ${isActive ? "active" : ""}`} style={{ paddingLeft: 6, paddingRight: 6 }}>
                                    <item.icon
                                      size={12}
                                      className="nav-icon"
                                      style={{ color: isActive ? sec.color : undefined, flexShrink: 0 }}
                                    />
                                    <span className="truncate" style={{ fontSize: 12 }}>{item.label}</span>
                                  </div>
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Sidebar footer — user card */}
              <div className="mt-auto pt-3 border-t px-2 pb-2 shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="rounded-xl overflow-hidden relative" style={{
                  background: "linear-gradient(135deg, #05112a 0%, #081e3d 60%, #0d2a1a 100%)",
                  border: "1px solid rgba(254,221,0,0.14)",
                  boxShadow: "0 0 30px rgba(254,221,0,0.04) inset"
                }}>
                  {/* Decorative glow orb */}
                  <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(254,221,0,0.07)", filter: "blur(18px)", pointerEvents: "none" }} />
                  <div className="px-3 pt-3 pb-2.5 relative">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold"
                          style={{ background: "linear-gradient(135deg, rgba(254,221,0,0.2) 0%, rgba(254,221,0,0.08) 100%)", color: "var(--mnbc-yellow)", border: "1px solid rgba(254,221,0,0.3)", boxShadow: "0 0 12px rgba(254,221,0,0.15)" }}>
                          {user?.full_name?.[0] || "?"}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                          style={{ background: "var(--color-success)", borderColor: "#05112a", boxShadow: "0 0 6px rgba(0,230,118,0.6)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{user?.full_name || "Loading..."}</div>
                        {user?.role === "admin" ? (
                          <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: "rgba(254,221,0,0.1)", color: "var(--mnbc-yellow)", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>ADMIN</span>
                        ) : (
                          <span className="text-xs capitalize" style={{ color: "var(--text-muted)", fontSize: 10 }}>{user?.role || "viewer"}</span>
                        )}
                      </div>
                    </div>

                    {/* Live clock */}
                    <div className="flex items-end justify-between">
                      <div>
                        <LiveClock />
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                          {new Date().toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)" }}>
                        <span className="status-dot active pulse-live" style={{ width: 5, height: 5 }} />
                        <span style={{ fontSize: 9, color: "var(--color-success)", fontWeight: 700, letterSpacing: "0.06em" }}>LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* Greeting strip */}
                  <div className="px-3 py-1.5" style={{ background: "rgba(254,221,0,0.04)", borderTop: "1px solid rgba(254,221,0,0.08)" }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{user?.full_name?.split(" ")[0] || "there"}</span></span>
                  </div>
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
              background: "linear-gradient(to bottom, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
              borderLeft: rightPanelOpen ? "1px solid var(--border-default)" : "none",
              boxShadow: rightPanelOpen ? "-2px 0 12px rgba(0,0,0,0.3)" : "none"
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
            background: "linear-gradient(to top, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
            borderTop: "1px solid var(--border-default)",
            boxShadow: "0 -4px 16px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(254,221,0,0.05)"
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
          </div>
        </footer>

        {/* ══ COMMAND PALETTE ══ */}
        {/* Notification Center */}
        <NotificationCenter 
          isOpen={notifCenterOpen} 
          onClose={() => setNotifCenterOpen(false)}
          user={user}
        />

        {/* Notification Preferences */}
        <NotificationPreferences 
          isOpen={notifPrefsOpen}
          onClose={() => setNotifPrefsOpen(false)}
          user={user}
        />

        {/* Feedback Modal */}
        <FeedbackModal 
          isOpen={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          user={user}
          currentPage={currentPageName}
        />

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
                <kbd style={{ background: "rgba(254,221,0,0.08)", color: "var(--mnbc-yellow)", fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(254,221,0,0.25)", fontFamily: "monospace", flexShrink: 0 }}>ESC</kbd>
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
              <div className="px-4 py-2 flex items-center gap-4" style={{ borderTop: "1px solid var(--border-default)", background: "rgba(0,0,0,0.2)" }}>
                {[["↑↓", "navigate"], ["Enter", "open"], ["Esc", "close"]].map(([key, label]) => (
                  <span key={key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <kbd style={{ background: "rgba(254,221,0,0.08)", color: "var(--mnbc-yellow)", fontSize: 9, padding: "1px 5px", borderRadius: 3, border: "1px solid rgba(254,221,0,0.2)", fontFamily: "monospace" }}>{key}</kbd>
                    {label}
                  </span>
                ))}
                <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>{filteredCmds.length} result{filteredCmds.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}

function PanelSection({ title, icon: Icon, iconColor, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="sidebar-section-toggle w-full"
        style={{ padding: "4px 4px" }}
      >
        <Icon size={10} style={{ color: iconColor || "var(--text-muted)", flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", flex: 1, textAlign: "left" }}>{title}</span>
        <ChevronRight
          size={11}
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
            opacity: 0.5,
            flexShrink: 0
          }}
        />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

function MiniSparkline({ values, color }) {
  const w = 56, h = 22;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="2.5" fill={color} />
    </svg>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.04em" }}>
      {time.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
    </span>
  );
}

function RightPanelDefault({ user, isAdmin }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Simulated sparkline data (would be real metrics in production)
  const sparkData = {
    metrics: [42, 45, 43, 47, 51, 49, 53, 57, 54, 58],
    quality: [88, 85, 87, 90, 89, 92, 91, 94, 93, 96],
    sources: [8, 8, 9, 9, 10, 10, 11, 11, 12, 12],
  };

  return (
    <div className="space-y-3">

      {/* ── Live platform stats ── */}
      <PanelSection title="Platform Pulse" icon={Activity} iconColor="#00e676">
        <div className="space-y-1.5">
          {[
            { label: "Active Metrics", value: "58", delta: "+4", trend: sparkData.metrics, color: "#FEDD00" },
            { label: "Data Quality", value: "96%", delta: "+3%", trend: sparkData.quality, color: "#00e676" },
            { label: "Live Sources", value: "12", delta: "+1", trend: sparkData.sources, color: "#40c4ff" },
          ].map(({ label, value, delta, trend, color }) => (
            <div key={label} className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>{label}</div>
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 15, fontWeight: 700, color, lineHeight: 1, fontFamily: "monospace" }}>{value}</span>
                  <span style={{ fontSize: 9, color: "#00e676", fontWeight: 600 }}>{delta}</span>
                </div>
              </div>
              <MiniSparkline values={trend} color={color} />
            </div>
          ))}
        </div>
      </PanelSection>

      {/* ── Quick Actions ── */}
      <PanelSection title="Quick Actions" icon={Zap} iconColor="var(--mnbc-yellow)">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { icon: Sparkles, label: "AI Insight", page: "AIInsights", color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
            { icon: Upload, label: "Import", page: "DataRepository", color: "#40c4ff", bg: "rgba(64,196,255,0.08)" },
            { icon: BarChart3, label: "Visualize", page: "Visualizations", color: "#00e676", bg: "rgba(0,230,118,0.08)" },
            { icon: FileDown, label: "Export", page: "Export", color: "#ffab40", bg: "rgba(255,171,64,0.08)" },
          ].map(({ icon: Icon, label, page, color, bg }) => (
            <Link key={page} to={createPageUrl(page)}>
              <div className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg cursor-pointer transition-all"
                style={{ background: bg, border: `1px solid ${color}22`, textAlign: "center" }}
                onMouseOver={e => { e.currentTarget.style.borderColor = `${color}55`; e.currentTarget.style.background = `${color}14`; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = `${color}22`; e.currentTarget.style.background = bg; }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </PanelSection>

      {/* ── Session ── */}
      <PanelSection title="Session" icon={Activity} iconColor="var(--color-success)" defaultOpen={false}>
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
          {[
            { label: "Status", value: "Online", dot: "#00e676" },
            { label: "Role", value: user?.role || "—", dot: "var(--mnbc-yellow)" },
            { label: "Version", value: "MHIP v2.0", dot: "#40c4ff" },
          ].map(({ label, value, dot }, i) => (
            <div key={label} className="flex items-center justify-between px-2.5 py-2"
              style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none", background: "var(--bg-overlay)" }}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-primary)", fontWeight: 500, textTransform: "capitalize" }}>{value}</span>
            </div>
          ))}
        </div>
      </PanelSection>

      {/* ── Resources ── */}
      <PanelSection title="Resources" icon={HelpCircle} defaultOpen={false}>
        <div className="px-2.5 py-2 rounded-lg text-xs" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          BC Métis Health Intelligence Platform — powered by MNBC and AI-driven analytics.
        </div>
      </PanelSection>
    </div>
  );
}