import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Database, Brain, AlertCircle, RefreshCw, BarChart3, Activity, SlidersHorizontal, RotateCcw, Save, Layout, Pencil, Edit3, TrendingUp, Pin, PinOff } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import WeeklyReports from "../components/dashboard/WeeklyReports";
import PinnedMetrics from "../components/dashboard/PinnedMetrics";
import DashboardCustomizer, { DEFAULT_WIDGETS } from "../components/dashboard/DashboardCustomizer";
import DashboardLayoutManager, { PRESET_LAYOUTS } from "../components/dashboard/DashboardLayoutManager";
import DisparityExplorer from "../components/dashboard/DisparityExplorer";
import RegionalPerformance from "../components/dashboard/RegionalPerformance";
import CategoryLeaders from "../components/dashboard/CategoryLeaders";
import TrendingMetrics from "../components/dashboard/TrendingMetrics";

const COLORS = ["#e6a817", "#58a6ff", "#2ea043", "#d29922", "#f85149"];
const PREFS_KEY = "mhip_dashboard_prefs";
const LAYOUTS_KEY = "mhip_dashboard_layouts";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function savePrefs(currentLayoutId, widgets, pinnedIds, title, visibleStatCards) {
  localStorage.setItem(PREFS_KEY, JSON.stringify({ currentLayoutId, widgets, pinnedIds, title, visibleStatCards }));
}

function loadLayouts() {
  try {
    const raw = localStorage.getItem(LAYOUTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLayouts(layouts) {
  localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts));
}

export default function Dashboard() {
  const { addLog } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [sources, setSources] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [layoutManagerOpen, setLayoutManagerOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  // Load persisted prefs and layouts
  const [prefs, setPrefs] = useState(() => loadPrefs() || {});
  const [layouts, setLayouts] = useState(() => loadLayouts());
  const [currentLayoutId, setCurrentLayoutId] = useState(prefs.currentLayoutId || "default");
  const [dashboardTitle, setDashboardTitle] = useState(prefs.title || "Dashboard");
  const [tempTitle, setTempTitle] = useState(dashboardTitle);

  // Initialize widgets
  const [widgets, setWidgets] = useState(() => {
    if (prefs?.widgets) return prefs.widgets;
    return [
      ...DEFAULT_WIDGETS.map(w => ({ ...w, visible: true, span: 2 })),
      { id: "regional_performance", visible: true, span: 2 },
      { id: "category_pie", visible: true, span: 2 }
    ];
  });
  const [pinnedIds, setPinnedIds] = useState(() => prefs?.pinnedIds || []);
  const [visibleStatCards, setVisibleStatCards] = useState(() => prefs?.visibleStatCards || ["total_metrics", "data_sources", "active_sources", "ai_insights"]);
  const [hasChanges, setHasChanges] = useState(false);
  const [regeneratingInsights, setRegeneratingInsights] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.HealthMetric.list("-year", 100),
      base44.entities.DataSource.list("-updated_date", 500),
      base44.entities.AIInsight.list("-created_date", 5),
    ]).then(([m, s, i]) => {
      setMetrics(m);
      setSources(s);
      setInsights(i);
      addLog("success", `Dashboard loaded — ${m.length} metrics, ${s.length} sources`);
    }).catch(e => addLog("error", e.message)).finally(() => setLoading(false));
  }, []);

  const handleWidgetsChange = useCallback((newWidgets) => {
    setWidgets(newWidgets);
    setHasChanges(true);
    savePrefs(currentLayoutId, newWidgets, pinnedIds, dashboardTitle, visibleStatCards);
    addLog("success", "Dashboard layout updated");
  }, [currentLayoutId, pinnedIds, dashboardTitle, visibleStatCards, addLog]);

  const handleStatCardToggle = useCallback((cardId) => {
    const newVisible = visibleStatCards.includes(cardId)
      ? visibleStatCards.filter(id => id !== cardId)
      : [...visibleStatCards, cardId];
    setVisibleStatCards(newVisible);
    savePrefs(currentLayoutId, widgets, pinnedIds, dashboardTitle, newVisible);
    setHasChanges(true);
    addLog("success", "Stat cards updated");
  }, [visibleStatCards, currentLayoutId, widgets, pinnedIds, dashboardTitle, addLog]);

  const handleUnpin = useCallback((id) => {
    const next = pinnedIds.filter(p => p !== id);
    setPinnedIds(next);
    savePrefs(currentLayoutId, widgets, next, dashboardTitle, visibleStatCards);
  }, [currentLayoutId, widgets, dashboardTitle, visibleStatCards]);

  const handleResetLayout = useCallback(() => {
    const defaultLayout = DEFAULT_WIDGETS.map(w => ({ ...w, visible: true, span: 2 }));
    setWidgets(defaultLayout);
    setVisibleStatCards(["total_metrics", "data_sources", "active_sources", "ai_insights"]);
    savePrefs(currentLayoutId, defaultLayout, pinnedIds, dashboardTitle, ["total_metrics", "data_sources", "active_sources", "ai_insights"]);
    setHasChanges(false);
    addLog("success", "Dashboard layout reset to default");
  }, [currentLayoutId, pinnedIds, dashboardTitle, addLog]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(widgets);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    handleWidgetsChange(items);
  };

  const handleSaveNewLayout = (name) => {
    const newLayout = {
      id: `layout_${Date.now()}`,
      name,
      widgetCount: widgets.filter(w => w.visible !== false).length,
      widgets: JSON.parse(JSON.stringify(widgets)),
      pinnedIds: [...pinnedIds],
      title: dashboardTitle,
      createdAt: new Date().toISOString(),
    };
    const newLayouts = [...layouts, newLayout];
    saveLayouts(newLayouts);
    setLayouts(newLayouts);
    addLog("success", `Layout "${name}" saved`);
  };

  const handleLoadLayout = (layoutId) => {
    let layoutToLoad = null;

    if (layoutId.startsWith("preset_")) {
      const presetKey = layoutId.replace("preset_", "");
      const preset = PRESET_LAYOUTS[presetKey];
      if (preset) {
        layoutToLoad = {
          widgets: preset.widgets,
          pinnedIds: [],
          title: preset.name,
        };
      }
    } else {
      const saved = layouts.find(l => l.id === layoutId);
      if (saved) {
        layoutToLoad = {
          widgets: saved.widgets,
          pinnedIds: saved.pinnedIds,
          title: saved.title,
        };
      }
    }

    if (layoutToLoad) {
      setCurrentLayoutId(layoutId);
      setWidgets(layoutToLoad.widgets);
      setPinnedIds(layoutToLoad.pinnedIds);
      setDashboardTitle(layoutToLoad.title);
      setTempTitle(layoutToLoad.title);
      savePrefs(layoutId, layoutToLoad.widgets, layoutToLoad.pinnedIds, layoutToLoad.title);
      setHasChanges(false);
      addLog("success", `Loaded layout: ${layoutToLoad.title}`);
      setLayoutManagerOpen(false);
    }
  };

  const handleDeleteLayout = (layoutId) => {
    const newLayouts = layouts.filter(l => l.id !== layoutId);
    saveLayouts(newLayouts);
    setLayouts(newLayouts);
    addLog("success", "Layout deleted");
  };

  const handleUpdateTitle = () => {
    setDashboardTitle(tempTitle);
    savePrefs(currentLayoutId, widgets, pinnedIds, tempTitle);
    setEditingTitle(false);
    addLog("success", "Dashboard title updated");
  };

  const handleRegenerateInsights = async () => {
    setRegeneratingInsights(true);
    try {
      const newInsights = await base44.entities.AIInsight.list("-created_date", 5);
      setInsights(newInsights);
      addLog("success", "AI Insights regenerated");
    } catch (e) {
      addLog("error", "Failed to regenerate insights");
    } finally {
      setRegeneratingInsights(false);
    }
  };

  // Derived stats
  const categoryCount = metrics.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryCount).map(([k, v]) => ({ name: k.replace(/_/g, " "), value: v }));
  const yearData = metrics.reduce((acc, m) => {
    if (m.year && m.value != null) {
      const found = acc.find(a => a.year === m.year);
      if (found) { found.count++; found.total += m.value; }
      else acc.push({ year: m.year, count: 1, total: m.value });
    }
    return acc;
  }, []).sort((a, b) => a.year - b.year).slice(-8);

  // Calculate health metrics
  const healthStats = (() => {
    const metisMetrics = metrics.filter(m => m.metis_specific);
    const withComparison = metisMetrics.filter(m => m.comparison_value != null);
    const disparities = withComparison.map(m => m.value - m.comparison_value);
    const avgDisparity = disparities.length > 0 ? disparities.reduce((a, b) => a + b, 0) / disparities.length : 0;
    
    // Trend: compare last year vs previous year
    const thisYear = Math.max(...metrics.filter(m => m.year).map(m => m.year));
    const lastYear = thisYear - 1;
    const thisYearMetrics = metrics.filter(m => m.year === thisYear);
    const lastYearMetrics = metrics.filter(m => m.year === lastYear);
    const trend = thisYearMetrics.length > 0 && lastYearMetrics.length > 0 
      ? ((thisYearMetrics.reduce((s, m) => s + (m.value || 0), 0) / thisYearMetrics.length) - 
         (lastYearMetrics.reduce((s, m) => s + (m.value || 0), 0) / lastYearMetrics.length))
      : 0;
    
    const regionCounts = {};
    metisMetrics.forEach(m => {
      regionCounts[m.region] = (regionCounts[m.region] || 0) + 1;
    });
    const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const categories = [...new Set(metisMetrics.map(m => m.category))].length;
    
    return { avgDisparity, trend, topRegion, categories, totalMetricsSeries: metisMetrics.length };
  })();

  const ALL_STAT_CARDS = {
    metis_metrics: { label: "Métis Health Indicators", value: healthStats.totalMetricsSeries, icon: Activity, color: "#FEDD00", bgColor: "rgba(254,221,0,0.08)", desc: "Métis-specific health metrics tracked" },
    health_disparity: { label: "Avg Health Disparity", value: healthStats.avgDisparity.toFixed(1), icon: TrendingUp, color: healthStats.avgDisparity > 0 ? "#FF4757" : "#2ED573", bgColor: healthStats.avgDisparity > 0 ? "rgba(255,71,87,0.08)" : "rgba(46,213,115,0.08)", desc: healthStats.avgDisparity > 0 ? "Higher than BC population" : "Better than BC population" },
    yearly_trend: { label: "Year-over-Year Trend", value: (healthStats.trend > 0 ? "+" : "") + healthStats.trend.toFixed(1), icon: Brain, color: healthStats.trend > 0 ? "#2ED573" : "#FF4757", bgColor: healthStats.trend > 0 ? "rgba(46,213,115,0.08)" : "rgba(255,71,87,0.08)", desc: healthStats.trend > 0 ? "Improving health outcomes" : "Declining health outcomes" },
    coverage: { label: "Health Categories", value: healthStats.categories, icon: BarChart3, color: "#40C4FF", bgColor: "rgba(64,196,255,0.08)", desc: `${healthStats.categories} major health categories tracked` },
  };

  const STAT_CARDS = ["metis_metrics", "health_disparity", "yearly_trend", "coverage"].map(id => ALL_STAT_CARDS[id]).filter(Boolean);

  const isVisible = (id) => {
    const w = widgets.find(w => w.id === id);
    return !w || w.visible !== false;
  };

  // Ordered widget render map
  const WIDGET_RENDER = {
    stat_cards: isVisible("stat_cards") && (
     <div key="stat_cards" className="space-y-3 group col-span-full">
       <div>
         <div className="dashboard-section-label mb-3">Platform Metrics</div>
         <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
           {STAT_CARDS.map((card, idx) => {
             const cardId = Object.keys(ALL_STAT_CARDS).find(k => ALL_STAT_CARDS[k].label === card.label);
             return (
               <div key={cardId} className="dashboard-widget-card relative overflow-hidden group"
                 style={{
                   background: `linear-gradient(135deg, ${card.bgColor || "rgba(254,221,0,0.03)"} 0%, var(--bg-elevated) 100%)`,
                   border: `1.5px solid ${card.color}33`
                 }}>
                 {/* Accent line */}
                 <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${card.color} 0%, transparent 100%)` }} />
                 
                 <div className="flex items-start justify-between mb-3 relative z-10">
                   <span className="text-xs font-semibold uppercase tracking-wider leading-tight" style={{ color: "var(--text-secondary)", fontSize: "9px", letterSpacing: "0.05em" }}>{card.label}</span>
                   <div className="p-2 rounded-lg shrink-0 transition-all group-hover:scale-110" style={{ background: card.bgColor, boxShadow: `0 0 12px ${card.color}22` }}>
                     <card.icon size={14} style={{ color: card.color, strokeWidth: 2.5 }} />
                   </div>
                 </div>
                 <div className="text-4xl font-black mb-2 relative z-10 leading-tight" style={{ color: card.color, textShadow: `0 2px 8px ${card.color}18` }}>{card.value}</div>
                 <div className="text-xs leading-snug relative z-10" style={{ color: "var(--text-secondary)", fontSize: "11px" }}>{card.desc}</div>
               </div>
             );
           })}
           {Object.keys(ALL_STAT_CARDS).filter(id => !visibleStatCards.includes(id)).length > 0 && (
             <button
               onClick={() => handleStatCardToggle(Object.keys(ALL_STAT_CARDS).find(id => !visibleStatCards.includes(id)))}
               className="dashboard-widget-card flex items-center justify-center gap-2 border-dashed"
               style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}
               title="Add a stat card">
               <span>+ Add Card</span>
             </button>
           )}
         </div>
       </div>

       {pinnedIds && pinnedIds.length > 0 && (
         <div className="dashboard-widget-card">
           <div className="flex items-center gap-2 mb-3 relative z-10">
             <Pin size={13} style={{ color: "var(--accent-primary)" }} />
             <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Pinned Metrics</span>
           </div>
           <div className="space-y-2">
             {metrics.filter(m => pinnedIds.includes(m.id)).map(m => (
               <div key={m.id} className="flex items-center justify-between py-2 px-2.5 rounded relative z-10" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                 <div className="min-w-0 flex-1">
                   <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{m.name}</div>
                   <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                     {m.category?.replace(/_/g, " ")} · {m.region} · {m.year}
                   </div>
                 </div>
                 <div className="flex items-center gap-2.5 shrink-0 ml-3">
                   <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>{m.value}{m.unit || ""}</span>
                   <button onClick={() => handleUnpin(m.id)} title="Unpin" className="activity-icon" style={{ width: 18, height: 18 }}>
                     <PinOff size={11} style={{ color: "var(--text-muted)" }} />
                   </button>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}
     </div>
    ),
    year_trend: isVisible("year_trend") && (
      <div key="year_trend" className="dashboard-widget-card">
        <div className="dashboard-section-label mb-3">Metrics by Year</div>
        <div className="text-xs mb-4 relative z-10" style={{ color: "var(--text-muted)", opacity: 0.7 }}>Number of health indicators recorded per year</div>
        {yearData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={yearData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e6a817" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e6a817" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="year" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "12px", color: "var(--text-primary)", fontSize: 11, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
                labelStyle={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: "var(--text-secondary)", fontSize: 11 }}
                cursor={{ fill: "rgba(254,221,0,0.04)" }}
              />
              <Area type="monotone" dataKey="count" stroke="#e6a817" fill="url(#grad1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyChart message="No metric data yet." />}
      </div>
    ),
    category_pie: isVisible("category_pie") && (
      <CategoryLeaders key="category_pie" metrics={metrics} />
    ),
    regional_performance: isVisible("regional_performance") && (
      <RegionalPerformance key="regional_performance" metrics={metrics} />
    ),
    disparity_explorer: isVisible("disparity_explorer") && (
      <DisparityExplorer key="disparity_explorer" metrics={metrics} />
    ),
    weekly_reports: isVisible("weekly_reports") && <WeeklyReports key="weekly_reports" />,

    data_sources: isVisible("data_sources") && (
      <div key="data_sources" className="dashboard-widget-card">
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="dashboard-section-label">Data Sources</div>
          <span className="tag" style={{ fontSize: 10 }}>{sources.length} total</span>
        </div>
        <div className="text-xs mb-3 relative z-10" style={{ color: "var(--text-muted)", opacity: 0.7 }}>Recently updated connections</div>
        {sources.length === 0 ? (
          <div className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>
            No sources configured yet.<br />
            <span style={{ opacity: 0.6 }}>Go to Data Sources to add a connection.</span>
          </div>
        ) : (
          <div className="space-y-1">
            {sources.slice(0, 8).map(src => (
              <div key={src.id} className="flex items-center justify-between py-1.5 px-2 rounded-md" style={{ background: "var(--bg-overlay)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`status-dot ${src.status} shrink-0`} title={`Status: ${src.status}`} />
                  <span className="text-xs truncate" style={{ color: "var(--text-primary)" }} title={src.name}>{src.name}</span>
                </div>
                <span className="tag shrink-0 ml-2" style={{ fontSize: 10 }}>{src.type?.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    ai_insights: isVisible("ai_insights") && (
      <div key="ai_insights" className="dashboard-widget-card">
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="dashboard-section-label">Recent AI Insights</div>
          <button
            onClick={handleRegenerateInsights}
            disabled={regeneratingInsights}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all"
            style={{
              background: "rgba(254,221,0,0.08)",
              border: "1px solid rgba(254,221,0,0.2)",
              color: "var(--text-secondary)",
              opacity: regeneratingInsights ? 0.5 : 1,
              cursor: regeneratingInsights ? "not-allowed" : "pointer"
            }}
            title="Regenerate insights">
            <RefreshCw size={11} style={{ transform: regeneratingInsights ? "rotate(180deg)" : "none", transition: "transform 0.3s linear" }} className={regeneratingInsights ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        <div className="text-xs mb-3 relative z-10" style={{ color: "var(--text-muted)", opacity: 0.7 }}>AI-generated analysis of your data</div>
        {insights.length === 0 ? (
          <div className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>
            No insights generated yet.<br />
            <span style={{ opacity: 0.6 }}>Visit AI Insights to generate your first analysis.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {insights.slice(0, 4).map(ins => (
              <div key={ins.id} className="p-2.5 rounded-md" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                <div className="text-xs font-semibold mb-1 leading-tight" style={{ color: "var(--accent-primary)" }}>{ins.title}</div>
                <div className="text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{ins.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    trending_metrics: isVisible("trending_metrics") && (
      <TrendingMetrics key="trending_metrics" metrics={metrics} />
    ),
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
      <RefreshCw size={20} className="animate-spin mr-2" /> Loading dashboard...
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg-surface)" }}>
      <style>{`
        .dashboard-section-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          cursor: pointer;
          user-select: none;
          border-radius: 4px;
          transition: background 0.12s;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .dashboard-section-header:hover {
          background: rgba(255,255,255,0.03);
          color: var(--text-primary);
        }
        .dashboard-widget-card {
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
          background: linear-gradient(to bottom, var(--bg-surface), var(--bg-elevated));
          padding: 16px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
        }
        .dashboard-widget-card:hover {
          border-color: var(--border-default);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(254,221,0,0.05);
          transform: translateY(-1px);
        }
        .dashboard-widget-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(254,221,0,0.02) 0%, transparent 100%);
          pointer-events: none;
        }
        .dashboard-section-label {
          font-family: 'Sofia Sans Extra Condensed', 'Aptos Narrow', 'Arial Narrow', sans-serif;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--mnbc-yellow);
          margin-bottom: 8px;
        }
        .dashboard-section-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
      `}</style>
      
      {/* Main container — no scroll */}
      <div className="flex-1 overflow-hidden flex flex-col p-4">

        {/* Hero header with gradient — nav-panel styled */}
        <div className="mb-4 rounded-lg overflow-hidden shrink-0" style={{
          background: "linear-gradient(to bottom, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(254,221,0,0.08)"
        }}>
          <div className="p-4 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--color-success)", boxShadow: "0 0 8px rgba(0,230,118,0.5)" }} />
                {editingTitle ? (
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={e => setTempTitle(e.target.value)}
                    onBlur={handleUpdateTitle}
                    onKeyDown={e => e.key === "Enter" && handleUpdateTitle()}
                    autoFocus
                    className="text-sm font-bold tracking-wider outline-none px-2 py-0.5 rounded-md"
                    style={{ color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.04em", background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}
                  />
                ) : (
                  <h1 className="text-sm font-bold tracking-wider cursor-pointer" style={{ color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.04em" }} onClick={() => setEditingTitle(true)}>
                    {dashboardTitle}
                  </h1>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
                Real-time overview of Métis-specific health metrics across British Columbia
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-4">
              {editingTitle && (
                <button
                  onClick={handleUpdateTitle}
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
                  style={{ background: "var(--accent-primary)", color: "#000" }}
                  title="Save title">
                  <Save size={13} />
                </button>
              )}
              {hasChanges && (
                <button
                  onClick={handleResetLayout}
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
                  style={{ background: "rgba(255,171,64,0.08)", border: "1px solid rgba(255,171,64,0.2)", color: "var(--text-secondary)" }}
                  onMouseOver={e => { e.currentTarget.style.background = "rgba(255,171,64,0.14)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "rgba(255,171,64,0.08)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  title="Reset to default layout">
                  <RotateCcw size={13} />
                </button>
              )}
              <button
                onClick={() => setLayoutManagerOpen(true)}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
                style={{ background: "rgba(64,196,255,0.08)", border: "1px solid rgba(64,196,255,0.2)", color: "var(--text-secondary)" }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(64,196,255,0.14)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(64,196,255,0.08)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                title="Save, load, and manage layouts">
                <Layout size={13} />
              </button>
              <button
                onClick={() => setCustomizerOpen(true)}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
                style={{ background: "rgba(254,221,0,0.08)", border: "1px solid rgba(254,221,0,0.2)", color: "var(--text-secondary)" }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(254,221,0,0.14)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(254,221,0,0.08)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                title="Rearrange and show/hide dashboard widgets">
                <SlidersHorizontal size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Widgets grid — drag-and-drop enabled */}
        <div className="flex-1 overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="dashboard-widgets" type="WIDGET">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="h-full gap-3 grid grid-cols-2 auto-rows-max"
                  style={{
                    overflowY: "auto",
                    paddingRight: "4px",
                    background: snapshot.isDraggingOver ? "rgba(254,221,0,0.02)" : "transparent",
                  }}>
                  {widgets
                    .filter(w => w.visible !== false)
                    .map((w, index) => (
                      <Draggable key={w.id} draggableId={w.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.5 : 1,
                            }}>
                            {WIDGET_RENDER[w.id]}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {customizerOpen && (
        <DashboardCustomizer
          widgets={widgets}
          onWidgetsChange={handleWidgetsChange}
          onClose={() => setCustomizerOpen(false)}
        />
      )}

      {layoutManagerOpen && (
        <DashboardLayoutManager
          layouts={layouts}
          currentLayout={{ id: currentLayoutId }}
          onLoadLayout={handleLoadLayout}
          onSaveLayout={handleSaveNewLayout}
          onDeleteLayout={handleDeleteLayout}
          onClose={() => setLayoutManagerOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-2 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px dashed var(--border-subtle)" }}>
      <AlertCircle size={18} style={{ color: "var(--text-muted)" }} />
      <span className="text-xs text-center" style={{ color: "var(--text-muted)" }}>{message}</span>
      <span className="text-xs text-center" style={{ color: "var(--text-muted)", opacity: 0.6 }}>Add data from the Data Repository to see charts here.</span>
    </div>
  );
}