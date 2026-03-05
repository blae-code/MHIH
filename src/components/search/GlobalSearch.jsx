import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Search, X, Database, BarChart3, Brain, BookOpen, FileText,
  ChevronRight, Activity, Clock, Sparkles, LayoutDashboard,
  TrendingUp, Shield, Users, Settings, Bot, Workflow, BellRing,
  FlaskConical, AlertCircle, ArrowRight, Tag, SlidersHorizontal, MessageSquare
} from "lucide-react";

// Static page navigation items
const PAGES = [
  { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard, desc: "Platform overview & KPIs" },
  { label: "Data Repository", page: "DataRepository", icon: Database, desc: "Browse all health metrics" },
  { label: "Red River OS", page: "RedRiverOS", icon: MessageSquare, desc: "Module shell for Red River OS analytics" },
  { label: "Metric Catalog", page: "MetricCatalog", icon: Database, desc: "Dataset manifests and metric definitions" },
  { label: "Metric Forge", page: "MetricForge", icon: SlidersHorizontal, desc: "Projection-safe metric query workspace" },
  { label: "Evidence Snapshots", page: "EvidenceSnapshots", icon: FileText, desc: "Deterministic evidence snapshot exports" },
  { label: "Visualizations", page: "Visualizations", icon: BarChart3, desc: "Charts & trend views" },
  { label: "AI Insights", page: "AIInsights", icon: Brain, desc: "AI-generated analysis" },
  { label: "AI Analyst", page: "DataAnalyst", icon: Sparkles, desc: "Ask questions about data" },
  { label: "Data Sources", page: "DataSources", icon: BookOpen, desc: "Manage external connections" },
  { label: "Data Quality", page: "DataQuality", icon: Shield, desc: "Review flags & issues" },
  { label: "AI Agents", page: "AgentCenter", icon: Bot, desc: "Automated agent tasks" },
  { label: "Reports", page: "Reports", icon: FileText, desc: "Custom report builder" },
  { label: "Predictive Analytics", page: "PredictiveAnalytics", icon: TrendingUp, desc: "Forecasts & modelling" },
  { label: "Policy Lab", page: "PolicyLab", icon: FlaskConical, desc: "Policy scenario simulation" },
  { label: "Alerts", page: "Alerts", icon: BellRing, desc: "Threshold notifications" },
  { label: "Workflows", page: "Workflows", icon: Workflow, desc: "Automated pipelines" },
  { label: "Governance", page: "DataGovernance", icon: Shield, desc: "Audit logs & policies" },
  { label: "Team", page: "Team", icon: Users, desc: "Manage team & roles" },
  { label: "Settings", page: "Settings", icon: Settings, desc: "App preferences" },
];

const RESULT_TYPE_META = {
  page: { color: "#40c4ff", label: "Page" },
  metric: { color: "#FEDD00", label: "Metric" },
  report: { color: "#00e676", label: "Report" },
  source: { color: "#a78bfa", label: "Data Source" },
  insight: { color: "#ff6b6b", label: "AI Insight" },
};

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataResults, setDataResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mhip_recent_searches") || "[]"); } catch { return []; }
  });
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const searchTimeout = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setQuery("");
      setDataResults([]);
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Debounced data search
  const searchData = useCallback(async (q) => {
    if (!q || q.length < 2) { setDataResults([]); setLoading(false); return; }
    setLoading(true);
    const ql = q.toLowerCase();
    try {
      const [metrics, reports, sources, insights] = await Promise.all([
        base44.entities.HealthMetric.list("-year", 200).catch(() => []),
        base44.entities.Report.list("-created_date", 50).catch(() => []),
        base44.entities.DataSource.list("-updated_date", 100).catch(() => []),
        base44.entities.AIInsight.list("-created_date", 50).catch(() => []),
      ]);

      const results = [];

      metrics.filter(m =>
        m.name?.toLowerCase().includes(ql) ||
        m.category?.toLowerCase().includes(ql) ||
        m.description?.toLowerCase().includes(ql) ||
        m.region?.toLowerCase().includes(ql)
      ).slice(0, 5).forEach(m => results.push({
        type: "metric",
        id: m.id,
        label: m.name,
        desc: `${m.category?.replace(/_/g, " ")} · ${m.region} · ${m.year} · ${m.value != null ? Number(m.value).toLocaleString() : "—"} ${m.unit || ""}`,
        page: "DataRepository",
        icon: Database,
        badge: m.category?.replace(/_/g, " "),
      }));

      reports.filter(r =>
        r.title?.toLowerCase().includes(ql) ||
        r.description?.toLowerCase().includes(ql)
      ).slice(0, 4).forEach(r => results.push({
        type: "report",
        id: r.id,
        label: r.title,
        desc: `${r.status} · ${r.type} · ${r.generated_at ? new Date(r.generated_at).toLocaleDateString("en-CA") : "Not generated"}`,
        page: "Reports",
        icon: FileText,
        badge: r.status,
      }));

      sources.filter(s =>
        s.name?.toLowerCase().includes(ql) ||
        s.description?.toLowerCase().includes(ql) ||
        s.category?.toLowerCase().includes(ql)
      ).slice(0, 4).forEach(s => results.push({
        type: "source",
        id: s.id,
        label: s.name,
        desc: `${s.type?.replace(/_/g, " ")} · ${s.status} · ${s.category?.replace(/_/g, " ") || ""}`,
        page: "DataSources",
        icon: BookOpen,
        badge: s.status,
      }));

      insights.filter(i =>
        i.title?.toLowerCase().includes(ql) ||
        i.content?.toLowerCase().includes(ql) ||
        i.category?.toLowerCase().includes(ql)
      ).slice(0, 3).forEach(i => results.push({
        type: "insight",
        id: i.id,
        label: i.title,
        desc: `${i.type?.replace(/_/g, " ")} · ${i.category || ""}`,
        page: "AIInsights",
        icon: Brain,
        badge: i.type?.replace(/_/g, " "),
      }));

      setDataResults(results);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (!query) { setDataResults([]); setLoading(false); return; }
    setLoading(true);
    searchTimeout.current = setTimeout(() => searchData(query), 280);
    return () => clearTimeout(searchTimeout.current);
  }, [query, searchData]);

  // Filter page results
  const pageResults = query.length > 0
    ? PAGES.filter(p =>
        p.label.toLowerCase().includes(query.toLowerCase()) ||
        p.desc.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 4).map(p => ({ ...p, type: "page" }))
    : [];

  const allResults = query.length > 0
    ? [...pageResults, ...dataResults]
    : [];

  // Keyboard nav
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allResults.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    if (e.key === "Escape") { onClose(); }
    if (e.key === "Enter" && allResults[activeIndex]) {
      handleSelectResult(allResults[activeIndex]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleSelectResult = (result) => {
    if (query) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem("mhip_recent_searches", JSON.stringify(updated));
    }
    onClose();
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("mhip_recent_searches");
  };

  if (!isOpen) return null;

  const grouped = allResults.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const typeOrder = ["page", "metric", "report", "source", "insight"];
  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)", paddingTop: 72 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(135deg, #0d1929 0%, #0a1523 100%)",
          border: "1px solid var(--border-emphasis)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(254,221,0,0.1), 0 0 40px rgba(64,196,255,0.06)",
          maxHeight: "70vh",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-default)" }}>
          <Search size={17} style={{ color: "#FEDD00", flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)", fontSize: 15, letterSpacing: "0.01em" }}
            placeholder="Search metrics, reports, sources, pages..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="flex items-center justify-center w-6 h-6 rounded-full transition-all"
              style={{ background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              <X size={11} />
            </button>
          )}
          {loading && (
            <div className="w-4 h-4 rounded-full border-2 animate-spin shrink-0"
              style={{ borderColor: "rgba(254,221,0,0.2)", borderTopColor: "#FEDD00" }} />
          )}
          <kbd style={{ background: "rgba(254,221,0,0.08)", color: "rgba(254,221,0,0.6)", fontSize: 10, padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(254,221,0,0.2)", fontFamily: "monospace", flexShrink: 0 }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto flex-1 py-2">

          {/* Empty state / recent searches */}
          {!query && (
            <div className="px-4 py-2">
              {recentSearches.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Clock size={11} /> Recent searches
                    </div>
                    <button onClick={clearRecent} className="text-xs" style={{ color: "var(--text-muted)" }}>Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {recentSearches.map((s, i) => (
                      <button key={i} onClick={() => setQuery(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                        style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
                        onMouseOver={e => e.currentTarget.style.borderColor = "rgba(254,221,0,0.3)"}
                        onMouseOut={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}>
                        <Search size={9} />{s}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="text-xs px-1 mb-2" style={{ color: "var(--text-muted)" }}>Quick navigation</div>
              <div className="grid grid-cols-2 gap-1">
                {PAGES.slice(0, 8).map((p) => (
                  <Link key={p.page} to={createPageUrl(p.page)} onClick={onClose}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all cursor-pointer"
                      style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                      onMouseOver={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.borderColor = "rgba(64,196,255,0.25)"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "var(--bg-overlay)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; }}>
                      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        style={{ background: "rgba(64,196,255,0.1)" }}>
                        <p.icon size={12} style={{ color: "#40c4ff" }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{p.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {query && !loading && allResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <AlertCircle size={24} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No results for "{query}"</p>
              <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.7 }}>Try a different keyword</p>
            </div>
          )}

          {/* Grouped results */}
          {query && allResults.length > 0 && typeOrder.map(type => {
            const items = grouped[type];
            if (!items?.length) return null;
            const meta = RESULT_TYPE_META[type];
            return (
              <div key={type} className="mb-1">
                <div className="flex items-center gap-2 px-5 py-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.color, opacity: 0.8 }}>{meta.label}s</span>
                  <div className="flex-1 h-px" style={{ background: `${meta.color}20` }} />
                </div>
                {items.map((result) => {
                  const currentIndex = flatIndex++;
                  const isActive = currentIndex === activeIndex;
                  const Icon = result.icon;
                  return (
                    <Link key={`${result.type}-${result.id || result.page}`}
                      to={createPageUrl(result.page)}
                      onClick={() => handleSelectResult(result)}>
                      <div
                        data-index={currentIndex}
                        className="flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-all"
                        style={{
                          background: isActive ? "var(--bg-hover)" : "transparent",
                          borderLeft: `2px solid ${isActive ? meta.color : "transparent"}`,
                        }}
                        onMouseEnter={() => setActiveIndex(currentIndex)}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: isActive ? `${meta.color}18` : "var(--bg-overlay)", border: `1px solid ${isActive ? `${meta.color}40` : "var(--border-subtle)"}` }}>
                          <Icon size={14} style={{ color: isActive ? meta.color : "var(--text-muted)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: isActive ? "var(--text-primary)" : "var(--text-primary)", opacity: isActive ? 1 : 0.85 }}>
                            {result.label}
                          </div>
                          <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{result.desc}</div>
                        </div>
                        {result.badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full shrink-0 capitalize hidden sm:block"
                            style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                            {result.badge}
                          </span>
                        )}
                        <ChevronRight size={13} style={{ color: "var(--text-muted)", opacity: isActive ? 1 : 0, transition: "opacity 0.1s", flexShrink: 0 }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 flex items-center gap-5"
          style={{ borderTop: "1px solid var(--border-default)", background: "rgba(0,0,0,0.2)" }}>
          {[["↑↓", "navigate"], ["Enter", "open"], ["Esc", "close"]].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
              <kbd style={{ background: "rgba(254,221,0,0.08)", color: "var(--mnbc-yellow)", fontSize: 9, padding: "1px 6px", borderRadius: 3, border: "1px solid rgba(254,221,0,0.2)", fontFamily: "monospace" }}>{key}</kbd>
              {label}
            </span>
          ))}
          <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
            {query ? `${allResults.length} result${allResults.length !== 1 ? "s" : ""}` : `${PAGES.length} pages`}
          </span>
        </div>
      </div>
    </div>
  );
}
