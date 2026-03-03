import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Database, LineChart, Brain, Settings, Users,
  Search, Bell, ChevronRight, Activity, AlertCircle, CheckCircle,
  Info, X, Zap, FileDown, Upload, BookOpen, Shield, HelpCircle,
  FolderOpen, BarChart3, ChevronLeft, SlidersHorizontal, ShieldCheck
} from "lucide-react";

export const AppContext = createContext({});
export const useApp = () => useContext(AppContext);

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", page: "Dashboard", section: "main" },
  { icon: Database, label: "Data Repository", page: "DataRepository", section: "main" },
  { icon: BarChart3, label: "Visualizations", page: "Visualizations", section: "main" },
  { icon: Brain, label: "AI Insights", page: "AIInsights", section: "main" },
  { icon: BookOpen, label: "Data Sources", page: "DataSources", section: "data" },
  { icon: FileDown, label: "Export", page: "Export", section: "data" },
  { icon: Users, label: "Team", page: "Team", adminOnly: true, section: "admin" },
  { icon: Shield, label: "Admin", page: "Admin", adminOnly: true, section: "admin" },
  { icon: Settings, label: "Settings", page: "Settings", section: "system" },
];

const COMMAND_ITEMS = [
  { label: "Go to Dashboard", page: "Dashboard", icon: LayoutDashboard },
  { label: "Open Data Repository", page: "DataRepository", icon: Database },
  { label: "Manage Data Sources", page: "DataSources", icon: FolderOpen },
  { label: "View Visualizations", page: "Visualizations", icon: LineChart },
  { label: "AI Insights & Analysis", page: "AIInsights", icon: Brain },
  { label: "Export Data", page: "Export", icon: FileDown },
  { label: "Team Management", page: "Team", icon: Users },
  { label: "Admin Panel", page: "Admin", icon: Shield },
  { label: "Settings", page: "Settings", icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [statusLogs, setStatusLogs] = useState([
    { type: "success", msg: "System initialized", time: new Date().toLocaleTimeString() }
  ]);
  const [contextPanel, setContextPanel] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const addLog = useCallback((type, msg) => {
    setStatusLogs(prev => [
      { type, msg, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 49)
    ]);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + P or Ctrl/Cmd + K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "p" || e.key === "k")) {
        e.preventDefault();
        setCmdOpen(v => !v);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isAdmin = user?.role === "admin";
  const filteredNav = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);
  const filteredCmds = COMMAND_ITEMS.filter(c =>
    c.label.toLowerCase().includes(cmdQuery.toLowerCase())
  );

  const sections = [
    { key: "main", label: "WORKSPACE" },
    { key: "data", label: "DATA" },
    ...(isAdmin ? [{ key: "admin", label: "ADMINISTRATION" }] : []),
    { key: "system", label: "SYSTEM" },
  ];

  const lastLog = statusLogs[0];
  const logColor = lastLog?.type === "error" ? "text-red-400"
    : lastLog?.type === "warning" ? "text-yellow-400"
    : lastLog?.type === "success" ? "text-green-400"
    : "text-blue-400";

  return (
    <AppContext.Provider value={{ user, addLog, setContextPanel, contextPanel }}>
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>

        {/* ── HEADER / COMMAND BAR ── */}
        <header className="flex items-center justify-between px-3 shrink-0 z-50 border-b"
          style={{ height: "var(--header-height)", background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          {/* Left: Logo + App name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--accent-primary)", color: "#000" }}>M</div>
              <span className="font-semibold text-xs tracking-wide whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                MHIP
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <ChevronRight size={12} />
              <span style={{ color: "var(--text-secondary)" }}>{currentPageName}</span>
            </div>
          </div>

          {/* Center: Command palette trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-colors"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", width: 260 }}>
            <Search size={12} />
            <span className="flex-1 text-left">Search or run command...</span>
            <span className="text-xs px-1 rounded" style={{ background: "var(--bg-overlay)", fontSize: 10 }}>⌘K</span>
          </button>

          {/* Right: Controls */}
          <div className="flex items-center gap-1">
            <button onClick={() => setCmdOpen(true)} className="md:hidden activity-icon">
              <Search size={15} />
            </button>
            <button className="activity-icon" title="Notifications">
              <Bell size={15} />
            </button>
            <div className="flex items-center gap-2 px-2 py-1 rounded-md ml-1"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--accent-muted)", color: "var(--accent-primary)" }}>
                {user?.full_name?.[0] || "?"}
              </div>
              <span className="text-xs hidden md:block" style={{ color: "var(--text-secondary)" }}>
                {user?.full_name?.split(" ")[0] || "Loading..."}
              </span>
              {isAdmin && (
                <span className="text-xs px-1 rounded" style={{ background: "var(--accent-muted)", color: "var(--accent-primary)", fontSize: 9 }}>
                  ADMIN
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── ACTIVITY BAR (icon strip) ── */}
          <div className="flex flex-col items-center py-2 gap-1 shrink-0 border-r z-40"
            style={{ width: 48, background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
            {filteredNav.map(item => (
              <Link key={item.page} to={createPageUrl(item.page)} title={item.label}>
                <div className={`activity-icon ${currentPageName === item.page ? "active" : ""}`}>
                  <item.icon size={18} />
                </div>
              </Link>
            ))}
            <div className="flex-1" />
            <button className="activity-icon" title="Toggle sidebar" onClick={() => setSidebarOpen(v => !v)}>
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          {/* ── LEFT SIDEBAR ── */}
          {sidebarOpen && (
            <aside className="flex flex-col shrink-0 border-r overflow-hidden"
              style={{ width: "var(--panel-left)", background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center justify-between px-3 py-2 border-b"
                style={{ borderColor: "var(--border-subtle)" }}>
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                  Navigation
                </span>
              </div>
              <nav className="flex-1 overflow-y-auto py-2 px-2">
                {sections.map(sec => {
                  const items = filteredNav.filter(n => n.section === sec.key);
                  if (!items.length) return null;
                  return (
                    <div key={sec.key} className="mb-4">
                      <div className="px-2 py-1 text-xs font-semibold tracking-widest uppercase mb-1"
                        style={{ color: "var(--text-muted)", fontSize: 10 }}>{sec.label}</div>
                      {items.map(item => (
                        <Link key={item.page} to={createPageUrl(item.page)}>
                          <div className={`nav-item ${currentPageName === item.page ? "active" : ""}`}>
                            <item.icon size={14} style={{ flexShrink: 0 }} />
                            <span className="nav-label truncate">{item.label}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </nav>
              {/* Sidebar footer — user info */}
              <div className="px-3 py-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "var(--accent-muted)", color: "var(--accent-primary)" }}>
                    {user?.full_name?.[0] || "?"}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {user?.full_name || "..."}
                    </div>
                    <div className="text-xs truncate" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                      {user?.role || "viewer"}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* ── MAIN WORKSPACE ── */}
          <main className="flex-1 overflow-auto relative" style={{ background: "var(--bg-base)" }}>
            {children}
          </main>

          {/* ── RIGHT PANEL (contextual) ── */}
          {rightPanelOpen && (
            <aside className="flex flex-col shrink-0 border-l overflow-hidden"
              style={{ width: "var(--panel-right)", background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center justify-between px-3 py-2 border-b"
                style={{ borderColor: "var(--border-subtle)" }}>
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                  {contextPanel?.title || "Tools & Options"}
                </span>
                <button onClick={() => setRightPanelOpen(false)} className="activity-icon" style={{ width: 24, height: 24 }}>
                  <X size={13} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {contextPanel?.content || <RightPanelDefault user={user} addLog={addLog} />}
              </div>
            </aside>
          )}
          {!rightPanelOpen && (
            <button onClick={() => setRightPanelOpen(true)}
              className="shrink-0 flex items-center justify-center border-l"
              style={{ width: 24, background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
              title="Open Tools panel">
              <SlidersHorizontal size={13} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </div>

        {/* ── FOOTER / STATUS BAR ── */}
        <footer className="flex items-center px-3 gap-4 shrink-0 border-t overflow-hidden"
          style={{ height: "var(--footer-height)", background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {lastLog?.type === "error" ? <AlertCircle size={11} className="text-red-400 shrink-0" />
              : lastLog?.type === "success" ? <CheckCircle size={11} className="text-green-400 shrink-0" />
              : <Info size={11} className="text-blue-400 shrink-0" />}
            <span className={`text-xs truncate ${logColor}`}>{lastLog?.msg}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {new Date().toLocaleDateString("en-CA")}
            </span>
            <div className="flex items-center gap-1">
              <span className="status-dot active" />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>BC Métis Health Intelligence Platform</span>
            </div>
          </div>
        </footer>

        {/* ── COMMAND PALETTE ── */}
        {cmdOpen && (
          <div className="cmd-overlay" onClick={() => setCmdOpen(false)}>
            <div className="w-full max-w-xl rounded-xl overflow-hidden shadow-2xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <Search size={15} style={{ color: "var(--text-muted)" }} />
                <input
                  autoFocus
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--text-primary)" }}
                  placeholder="Search or run a command..."
                  value={cmdQuery}
                  onChange={e => setCmdQuery(e.target.value)}
                />
                <kbd className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-overlay)", color: "var(--text-muted)" }}>ESC</kbd>
              </div>
              <div className="max-h-80 overflow-y-auto py-1">
                {filteredCmds.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>No commands found</div>
                )}
                {filteredCmds.map(cmd => (
                  <Link key={cmd.page} to={createPageUrl(cmd.page)} onClick={() => { setCmdOpen(false); setCmdQuery(""); }}>
                    <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-opacity-50"
                      style={{ color: "var(--text-primary)" }}
                      onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                      <cmd.icon size={14} style={{ color: "var(--accent-primary)" }} />
                      <span className="text-sm">{cmd.label}</span>
                      <ChevronRight size={12} className="ml-auto" style={{ color: "var(--text-muted)" }} />
                    </div>
                  </Link>
                ))}
              </div>
              <div className="px-4 py-2 border-t flex items-center gap-4" style={{ borderColor: "var(--border-subtle)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>↑↓ navigate</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>↵ select</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>ESC close</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}

function RightPanelDefault({ user, addLog }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Quick Actions</div>
        <div className="space-y-1">
          {[
            { icon: Zap, label: "Generate AI Insight", page: "AIInsights" },
            { icon: Upload, label: "Import Data", page: "DataRepository" },
            { icon: BarChart3, label: "New Visualization", page: "Visualizations" },
            { icon: FileDown, label: "Export Report", page: "Export" },
          ].map(({ icon: Icon, label, page }) => (
            <Link key={page} to={createPageUrl(page)}>
              <div className="nav-item">
                <Icon size={13} style={{ color: "var(--accent-primary)" }} />
                <span>{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Session</div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span style={{ color: "var(--text-muted)" }}>User</span>
            <span style={{ color: "var(--text-primary)" }}>{user?.full_name?.split(" ")[0] || "—"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: "var(--text-muted)" }}>Role</span>
            <span style={{ color: "var(--accent-primary)", textTransform: "capitalize" }}>{user?.role || "—"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: "var(--text-muted)" }}>Date</span>
            <span style={{ color: "var(--text-primary)" }}>{new Date().toLocaleDateString("en-CA")}</span>
          </div>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Help</div>
        <div className="space-y-1">
          <div className="nav-item">
            <HelpCircle size={13} style={{ color: "var(--text-muted)" }} />
            <span>Documentation</span>
          </div>
        </div>
      </div>
    </div>
  );
}