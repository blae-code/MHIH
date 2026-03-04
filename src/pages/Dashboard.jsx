import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Database, Brain, AlertCircle, RefreshCw, BarChart3, Activity, SlidersHorizontal } from "lucide-react";
import WeeklyReports from "../components/dashboard/WeeklyReports";
import PinnedMetrics from "../components/dashboard/PinnedMetrics";
import DashboardCustomizer, { DEFAULT_WIDGETS } from "../components/dashboard/DashboardCustomizer";
import DisparityExplorer from "../components/dashboard/DisparityExplorer";

const COLORS = ["#e6a817", "#58a6ff", "#2ea043", "#d29922", "#f85149"];
const PREF_KEY = "mhip_dashboard_prefs";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function savePrefs(widgets, pinnedIds) {
  localStorage.setItem(PREF_KEY, JSON.stringify({ widgets, pinnedIds }));
}

export default function Dashboard() {
  const { addLog } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [sources, setSources] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Load persisted prefs
  const [widgets, setWidgets] = useState(() => {
    const saved = loadPrefs();
    if (saved?.widgets) return saved.widgets;
    return DEFAULT_WIDGETS.map(w => ({ ...w, visible: true }));
  });
  const [pinnedIds, setPinnedIds] = useState(() => loadPrefs()?.pinnedIds || []);

  useEffect(() => {
    Promise.all([
      base44.entities.HealthMetric.list("-year", 100),
      base44.entities.DataSource.list("-updated_date", 20),
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
    savePrefs(newWidgets, pinnedIds);
  }, [pinnedIds]);

  const handleUnpin = useCallback((id) => {
    const next = pinnedIds.filter(p => p !== id);
    setPinnedIds(next);
    savePrefs(widgets, next);
  }, [pinnedIds, widgets]);

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

  const STAT_CARDS = [
    { label: "Total Metrics", value: metrics.length, icon: BarChart3, color: "var(--accent-primary)", desc: "Health indicators tracked across all categories" },
    { label: "Data Sources", value: sources.length, icon: Database, color: "var(--color-info)", desc: "Connected external data feeds & repositories" },
    { label: "Active Sources", value: sources.filter(s => s.status === "active").length, icon: Activity, color: "var(--color-success)", desc: "Sources currently syncing successfully" },
    { label: "AI Insights", value: insights.length, icon: Brain, color: "#a78bfa", desc: "AI-generated analyses & recommendations" },
  ];

  const isVisible = (id) => {
    const w = widgets.find(w => w.id === id);
    return !w || w.visible !== false;
  };

  // Ordered widget render map
  const WIDGET_RENDER = {
    stat_cards: isVisible("stat_cards") && (
      <div key="stat_cards" className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="metric-card" title={card.desc}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider leading-tight" style={{ color: "var(--text-muted)" }}>{card.label}</span>
              <div className="p-1.5 rounded-md shrink-0" style={{ background: `${card.color}18` }}>
                <card.icon size={13} style={{ color: card.color }} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: card.color }}>{card.value}</div>
            <div className="text-xs leading-snug" style={{ color: "var(--text-muted)" }}>{card.desc}</div>
          </div>
        ))}
      </div>
    ),
    year_trend: isVisible("year_trend") && (
      <div key="year_trend" className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Metrics by Year</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.7 }}>Number of health indicators recorded per year</div>
          </div>
        </div>
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
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: 12 }}
                labelStyle={{ color: "var(--text-primary)" }}
                itemStyle={{ color: "var(--text-secondary)" }}
              />
              <Area type="monotone" dataKey="count" stroke="#e6a817" fill="url(#grad1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyChart message="No metric data yet." />}
      </div>
    ),
    category_pie: isVisible("category_pie") && (
      <div key="category_pie" className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Metrics by Category</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.7 }}>Distribution across health indicator categories</div>
          </div>
        </div>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={false}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: 12 }}
                labelStyle={{ color: "var(--text-primary)" }}
                itemStyle={{ color: "var(--text-secondary)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : <EmptyChart message="No categories yet." />}
        <div className="mt-2 space-y-1">
          {categoryData.slice(0, 4).map((c, i) => (
            <div key={c.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span style={{ color: "var(--text-secondary)" }}>{c.name}</span>
              </div>
              <span style={{ color: "var(--text-primary)" }}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    disparity_explorer: isVisible("disparity_explorer") && (
      <DisparityExplorer key="disparity_explorer" metrics={metrics} />
    ),
    weekly_reports: isVisible("weekly_reports") && <WeeklyReports key="weekly_reports" />,
    pinned_metrics: isVisible("pinned_metrics") && (
      <PinnedMetrics key="pinned_metrics" pinnedIds={pinnedIds} onUnpin={handleUnpin} />
    ),
    data_sources: isVisible("data_sources") && (
      <div key="data_sources" className="metric-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Data Sources</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.7 }}>Recently updated connections</div>
          </div>
          <span className="tag" style={{ fontSize: 10 }}>{sources.length} total</span>
        </div>
        {sources.length === 0 ? (
          <div className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>
            No sources configured yet.<br />
            <span style={{ opacity: 0.6 }}>Go to Data Sources to add a connection.</span>
          </div>
        ) : (
          <div className="space-y-1">
            {sources.slice(0, 6).map(src => (
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
      <div key="ai_insights" className="metric-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Recent AI Insights</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.7 }}>AI-generated analysis of your data</div>
          </div>
        </div>
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
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
      <RefreshCw size={20} className="animate-spin mr-2" /> Loading dashboard...
    </div>
  );

  return (
    <div className="p-5 space-y-5 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>BC Métis Health Intelligence</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Real-time overview of Métis-specific health metrics across British Columbia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustomizerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
            title="Rearrange and show/hide dashboard widgets">
            <SlidersHorizontal size={12} />
            Customize Layout
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }} title="Dashboard data is live">
            <span className="status-dot active" />
            <span className="text-xs" style={{ color: "var(--color-success)" }}>Live</span>
          </div>
        </div>
      </div>

      {/* Render widgets in user-defined order */}
      {widgets
        .filter(w => w.visible !== false)
        .map(w => WIDGET_RENDER[w.id])
        .filter(Boolean)}

      {customizerOpen && (
        <DashboardCustomizer
          widgets={widgets}
          onWidgetsChange={handleWidgetsChange}
          onClose={() => setCustomizerOpen(false)}
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