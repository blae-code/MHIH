import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Search, X, Database, BarChart3, Brain, BookOpen, FileText,
  ChevronRight, Clock, Sparkles, LayoutDashboard, TrendingUp,
  Shield, Users, Settings, Bot, Workflow, BellRing, FlaskConical,
  AlertCircle, ShieldCheck, FileDown, Wrench, MapPin, Upload,
  Activity, ClipboardCheck, BrainCircuit, GitCompare, Link2,
  Siren, MapPinned, BookMarked, ListOrdered, FolderOpen
} from "lucide-react";

const NAV_COMMANDS = [
  { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard, section: "Workspace", desc: "Platform overview & KPIs" },
  { label: "Data Repository", page: "DataRepository", icon: Database, section: "Workspace", desc: "Browse all health metrics" },
  { label: "Visualizations", page: "Visualizations", icon: BarChart3, section: "Workspace", desc: "Charts & trend views" },
  { label: "AI Insights", page: "AIInsights", icon: Brain, section: "Workspace", desc: "AI-generated analysis" },
  { label: "AI Analyst", page: "DataAnalyst", icon: Sparkles, section: "Workspace", desc: "Ask questions about data" },
  { label: "Policy Lab", page: "PolicyLab", icon: FlaskConical, section: "Policy", desc: "Policy scenario simulation" },
  { label: "Recommendations", page: "Recommendations", icon: ListOrdered, section: "Policy", desc: "Ranked policy recommendations" },
  { label: "Watchlists", page: "Watchlists", icon: BellRing, section: "Policy", desc: "Mission thresholds & breach monitoring" },
  { label: "Interventions", page: "Interventions", icon: Activity, section: "Policy", desc: "Intervention registry & outcomes" },
  { label: "Approvals Inbox", page: "ApprovalsInbox", icon: ClipboardCheck, section: "Policy", desc: "Human approvals for sensitive outputs" },
  { label: "Backtesting", page: "Backtesting", icon: BrainCircuit, section: "Policy", desc: "Forecast error & drift monitoring" },
  { label: "Conflict Workbench", page: "ConflictWorkbench", icon: GitCompare, section: "Policy", desc: "Reconcile conflicting sources" },
  { label: "Evidence Explorer", page: "EvidenceExplorer", icon: Link2, section: "Policy", desc: "Trace claims to evidence" },
  { label: "Alerts Center", page: "AlertsCenter", icon: Siren, section: "Policy", desc: "Sentinel & source conflict alerts" },
  { label: "Geo Equity Map", page: "GeoEquityMap", icon: MapPinned, section: "Policy", desc: "Regional disparity hotspots" },
  { label: "Knowledge Admin", page: "KnowledgeAdmin", icon: BookMarked, section: "Policy", desc: "Policy knowledge management" },
  { label: "Hansard Intel", page: "HansardIntel", icon: FileText, section: "Policy", desc: "BC/Federal Hansard intelligence" },
  { label: "Data Sources", page: "DataSources", icon: BookOpen, section: "Data", desc: "Manage external connections" },
  { label: "My Data Sources", page: "MyDataSources", icon: FolderOpen, section: "Data", desc: "Your personal imports" },
  { label: "Data Quality", page: "DataQuality", icon: ShieldCheck, section: "Data", desc: "Review flags & quality issues" },
  { label: "AI Agents", page: "AgentCenter", icon: Bot, section: "Data", desc: "Automated agent tasks" },
  { label: "Export", page: "Export", icon: FileDown, section: "Data", desc: "Download CSV or PDF" },
  { label: "Predictive Analytics", page: "PredictiveAnalytics", icon: TrendingUp, section: "Analytics", desc: "Forecasts & modelling" },
  { label: "Geo Map", page: "GeoMap", icon: MapPin, section: "Analytics", desc: "Regional health map" },
  { label: "Alerts", page: "Alerts", icon: BellRing, section: "Analytics", desc: "Threshold notifications" },
  { label: "Data Prep", page: "DataPrep", icon: Wrench, section: "Analytics", desc: "Clean & transform data" },
  { label: "Workflows", page: "Workflows", icon: Workflow, section: "Analytics", desc: "Automated pipelines" },
  { label: "Governance", page: "DataGovernance", icon: Shield, section: "Analytics", desc: "Audit logs & policies" },
  { label: "Reports", page: "Reports", icon: FileText, section: "Analytics", desc: "Custom report builder" },
  { label: "Team", page: "Team", icon: Users, section: "Admin", desc: "Manage team & roles" },
  { label: "Admin", page: "Admin", icon: Shield, section: "Admin", desc: "System administration" },
  { label: "Settings", page: "Settings", icon: Settings, section: "System", desc: "App preferences" },
];

const SECTION_COLORS = {
  Workspace: "#FEDD00",
  Policy: "#f472b6",
  Data: "#40c4ff",
  Analytics: "#00e676",
  Admin: "#ffab40",
  System: "#8b8fa8",
  Results: "#a78bfa",
};

// Highlight matching text
function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const idx = text?.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1 || !text) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(254,221,0,0.3)", color: "var(--mnbc-yellow)", borderRadius: 2, padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function CommandPalette({ isOpen, onClose, currentPageName }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataResults, setDataResults] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setDataResults([]);
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Live data search (debounced)
  const searchData = useCallback(async (q) => {
    if (!q || q.length < 2) { setDataResults([]); setLoading(false); return; }
    setLoading(true);
    const ql = q.toLowerCase();
    try {
      const [metrics, reports, sources] = await Promise.all([
        base44.entities.HealthMetric.list("-year", 200).catch(() => []),
        base44.entities.Report.list("-created_date", 30).catch(() => []),
        base44.entities.DataSource.list("-updated_date", 50).catch(() => []),
      ]);

      const results = [];

      metrics.filter(m =>
        m.name?.toLowerCase().includes(ql) ||
        m.category?.toLowerCase().includes(ql) ||
        m.region?.toLowerCase().includes(ql)
      ).slice(0, 4).forEach(m => results.push({
        type: "metric",
        label: m.name,
        desc: `${m.category?.replace(/_/g, " ")} · ${m.region} · ${m.year}`,
        meta: m.value != null ? `${Number(m.value).toLocaleString()} ${m.unit || ""}`.trim() : null,
        page: "DataRepository",
        icon: Database,
      }));

      reports.filter(r => r.title?.toLowerCase().includes(ql)).slice(0, 3).forEach(r => results.push({
        type: "report",
        label: r.title,
        desc: `${r.status} report · ${r.type}`,
        meta: r.generated_at ? new Date(r.generated_at).toLocaleDateString("en-CA") : null,
        page: "Reports",
        icon: FileText,
      }));

      sources.filter(s =>
        s.name?.toLowerCase().includes(ql) ||
        s.description?.toLowerCase().includes(ql)
      ).slice(0, 3).forEach(s => results.push({
        type: "source",
        label: s.name,
        desc: `${s.type?.replace(/_/g, " ")} · ${s.status}`,
        meta: s.category?.replace(/_/g, " ") || null,
        page: "DataSources",
        icon: BookOpen,
      }));

      setDataResults(results);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query) { setDataResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => searchData(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchData]);

  // Filter nav commands
  const navResults = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return NAV_COMMANDS.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.desc.toLowerCase().includes(q) ||
      c.section.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  const allResults = useMemo(() => [
    ...navResults.map(r => ({ ...r, resultType: "nav" })),
    ...dataResults.map(r => ({ ...r, resultType: "data" })),
  ], [navResults, dataResults]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  // Scroll active into view
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allResults.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    if (e.key === "Escape") { onClose(); }
    if (e.key === "Enter" && allResults[activeIndex]) {
      window.location.href = createPageUrl(allResults[activeIndex].page);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Recent pages (just show quick-nav grid when no query)
  const recentPages = NAV_COMMANDS.slice(0, 10);

  const typeColor = { metric: "#FEDD00", report: "#00e676", source: "#40c4ff", nav: "#FEDD00" };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center"
      style={{ background: "rgba(3,8,15,0.75)", backdropFilter: "blur(4px)", paddingTop: 60 }}
      onClick={onClose}
    >
      <style>{`
        @keyframes cmdSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .cmd-palette-enter { animation: cmdSlideIn 0.18s cubic-bezier(0.22,1,0.36,1) both; }
        .cmd-row:hover { background: rgba(255,255,255,0.035) !important; }
        .cmd-row-active { background: rgba(254,221,0,0.07) !important; border-left: 2px solid #FEDD00 !important; }
      `}</style>

      <div
        className="cmd-palette-enter w-full max-w-xl flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0b1624 0%, #09131e 100%)",
          border: "1px solid rgba(254,221,0,0.2)",
          boxShadow: "0 0 0 1px rgba(64,196,255,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 60px rgba(254,221,0,0.04)",
          maxHeight: "72vh",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Input ── */}
        <div className="flex items-center gap-3 px-4 py-3.5 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(254,221,0,0.15) 0%, rgba(254,221,0,0.05) 100%)", border: "1px solid rgba(254,221,0,0.2)" }}>
            <Search size={15} style={{ color: "#FEDD00" }} />
          </div>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none"
            style={{ color: "var(--text-primary)", fontSize: 15, letterSpacing: "0.01em" }}
            placeholder="Search pages, metrics, reports..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {loading && (
            <div className="w-4 h-4 rounded-full border-2 animate-spin shrink-0"
              style={{ borderColor: "rgba(254,221,0,0.15)", borderTopColor: "#FEDD00" }} />
          )}
          {query && !loading && (
            <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="flex items-center justify-center w-5 h-5 rounded-full transition-all"
              style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)" }}>
              <X size={10} />
            </button>
          )}
          <kbd style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", fontSize: 10, padding: "3px 7px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)", fontFamily: "monospace", flexShrink: 0, letterSpacing: "0.05em" }}>ESC</kbd>
        </div>

        {/* ── Body ── */}
        <div ref={listRef} className="overflow-y-auto flex-1">

          {/* No query — show quick nav grid */}
          {!query && (
            <div className="p-3">
              <div className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1"
                style={{ color: "var(--text-muted)", letterSpacing: "0.12em" }}>Quick Navigation</div>
              <div className="grid grid-cols-2 gap-1">
                {recentPages.map((p) => {
                  const color = SECTION_COLORS[p.section] || "#40c4ff";
                  return (
                    <Link key={p.page} to={createPageUrl(p.page)} onClick={onClose}>
                      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all cursor-pointer"
                        style={{ border: "1px solid transparent" }}
                        onMouseOver={e => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.borderColor = `${color}25`; }}
                        onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                          <p.icon size={12} style={{ color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{p.label}</div>
                          <div className="text-xs truncate" style={{ color: "var(--text-muted)", fontSize: 10 }}>{p.section}</div>
                        </div>
                        {currentPageName === p.page && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#FEDD00" }} />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* No results */}
          {query && !loading && allResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <AlertCircle size={26} style={{ color: "var(--text-muted)", opacity: 0.3 }} />
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>No results for <span style={{ color: "var(--text-secondary)" }}>"{query}"</span></div>
            </div>
          )}

          {/* Results */}
          {query && allResults.length > 0 && (() => {
            let globalIdx = 0;

            // Group nav results
            const navItems = allResults.filter(r => r.resultType === "nav");
            const dataItems = allResults.filter(r => r.resultType === "data");

            return (
              <>
                {navItems.length > 0 && (
                  <div className="pt-2 pb-1">
                    <div className="flex items-center gap-2 px-4 py-1">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#FEDD00", opacity: 0.7, letterSpacing: "0.1em" }}>Pages</span>
                      <div className="flex-1 h-px" style={{ background: "rgba(254,221,0,0.1)" }} />
                    </div>
                    {navItems.map((r) => {
                      const idx = globalIdx++;
                      const isActive = idx === activeIndex;
                      const color = SECTION_COLORS[r.section] || "#FEDD00";
                      return (
                        <Link key={r.page} to={createPageUrl(r.page)} onClick={onClose}>
                          <div
                            data-idx={idx}
                            className={`cmd-row flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all ${isActive ? "cmd-row-active" : ""}`}
                            style={{ borderLeft: "2px solid transparent" }}
                            onMouseEnter={() => setActiveIndex(idx)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: isActive ? `${color}18` : "rgba(255,255,255,0.04)", border: `1px solid ${isActive ? `${color}40` : "rgba(255,255,255,0.06)"}`, transition: "all 0.12s" }}>
                              <r.icon size={14} style={{ color: isActive ? color : "var(--text-muted)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium leading-tight" style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                                <Highlight text={r.label} query={query} />
                              </div>
                              <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{r.desc}</div>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full shrink-0 hidden sm:block"
                              style={{ background: `${color}12`, color, border: `1px solid ${color}25`, fontSize: 10 }}>
                              {r.section}
                            </span>
                            <ChevronRight size={12} style={{ color: "var(--text-muted)", opacity: isActive ? 0.8 : 0, transition: "opacity 0.12s", flexShrink: 0 }} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {dataItems.length > 0 && (
                  <div className="pt-1 pb-2">
                    <div className="flex items-center gap-2 px-4 py-1">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#40c4ff", opacity: 0.7, letterSpacing: "0.1em" }}>Data</span>
                      <div className="flex-1 h-px" style={{ background: "rgba(64,196,255,0.1)" }} />
                    </div>
                    {dataItems.map((r) => {
                      const idx = globalIdx++;
                      const isActive = idx === activeIndex;
                      const color = typeColor[r.type] || "#40c4ff";
                      return (
                        <Link key={`${r.type}-${r.label}`} to={createPageUrl(r.page)} onClick={onClose}>
                          <div
                            data-idx={idx}
                            className={`cmd-row flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all ${isActive ? "cmd-row-active" : ""}`}
                            style={{ borderLeft: "2px solid transparent" }}
                            onMouseEnter={() => setActiveIndex(idx)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: isActive ? `${color}18` : "rgba(255,255,255,0.04)", border: `1px solid ${isActive ? `${color}40` : "rgba(255,255,255,0.06)"}`, transition: "all 0.12s" }}>
                              <r.icon size={14} style={{ color: isActive ? color : "var(--text-muted)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium leading-tight" style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                                <Highlight text={r.label} query={query} />
                              </div>
                              <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{r.desc}</div>
                            </div>
                            {r.meta && (
                              <span className="text-xs shrink-0 hidden sm:block"
                                style={{ color, fontFamily: "monospace", fontSize: 11 }}>
                                {r.meta}
                              </span>
                            )}
                            <ChevronRight size={12} style={{ color: "var(--text-muted)", opacity: isActive ? 0.8 : 0, transition: "opacity 0.12s", flexShrink: 0 }} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-2.5 flex items-center gap-4 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.25)" }}>
          {[["↑↓", "navigate"], ["↵", "open"], ["Esc", "close"]].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <kbd style={{ background: "rgba(254,221,0,0.07)", color: "rgba(254,221,0,0.7)", fontSize: 9, padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(254,221,0,0.18)", fontFamily: "monospace" }}>{key}</kbd>
              {label}
            </span>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {loading && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Searching...</span>}
            {!loading && query && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {allResults.length} result{allResults.length !== 1 ? "s" : ""}
              </span>
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded"
              style={{ background: "rgba(254,221,0,0.06)", border: "1px solid rgba(254,221,0,0.12)" }}>
              <kbd style={{ fontSize: 9, color: "rgba(254,221,0,0.6)", fontFamily: "monospace" }}>⌘K</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}