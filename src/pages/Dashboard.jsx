import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Database, Brain, AlertCircle, RefreshCw, BarChart3, Activity } from "lucide-react";

const COLORS = ["#e6a817", "#58a6ff", "#2ea043", "#d29922", "#f85149"];

export default function Dashboard() {
  const { addLog } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [sources, setSources] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const activeSourcesCount = sources.filter(s => s.status === "active").length;
  const errorSourcesCount = sources.filter(s => s.status === "error").length;

  const STAT_CARDS = [
    { label: "Total Metrics", value: metrics.length, icon: BarChart3, color: "var(--accent-primary)" },
    { label: "Data Sources", value: sources.length, icon: Database, color: "var(--color-info)" },
    { label: "Active Sources", value: activeSourcesCount, icon: Activity, color: "var(--color-success)" },
    { label: "AI Insights", value: insights.length, icon: Brain, color: "#a78bfa" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
      <RefreshCw size={20} className="animate-spin mr-2" /> Loading dashboard...
    </div>
  );

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            BC Métis Health Intelligence
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Real-time overview of Métis-specific health metrics in British Columbia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot active" />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Live</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="metric-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {card.label}
              </span>
              <card.icon size={14} style={{ color: card.color }} />
            </div>
            <div className="text-3xl font-bold" style={{ color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Trend over years */}
        <div className="metric-card xl:col-span-2">
          <div className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Metrics by Year
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
                <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#e6a817" fill="url(#grad1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No metric data yet. Import data to see trends." />
          )}
        </div>

        {/* Category distribution */}
        <div className="metric-card">
          <div className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            By Category
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={false}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No categories yet." />
          )}
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
      </div>

      {/* Recent sources + insights */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Data Sources */}
        <div className="metric-card">
          <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Data Sources
          </div>
          {sources.length === 0 ? (
            <div className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>No sources configured yet.</div>
          ) : (
            <div className="space-y-2">
              {sources.slice(0, 6).map(src => (
                <div key={src.id} className="flex items-center justify-between py-1 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${src.status}`} />
                    <span className="text-xs" style={{ color: "var(--text-primary)" }}>{src.name}</span>
                  </div>
                  <span className="tag">{src.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="metric-card">
          <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Recent AI Insights
          </div>
          {insights.length === 0 ? (
            <div className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>No insights yet. Visit AI Insights to generate analysis.</div>
          ) : (
            <div className="space-y-2">
              {insights.slice(0, 4).map(ins => (
                <div key={ins.id} className="p-2 rounded" style={{ background: "var(--bg-overlay)" }}>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--accent-primary)" }}>{ins.title}</div>
                  <div className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>{ins.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-2">
      <AlertCircle size={20} style={{ color: "var(--text-muted)" }} />
      <span className="text-xs text-center" style={{ color: "var(--text-muted)" }}>{message}</span>
    </div>
  );
}