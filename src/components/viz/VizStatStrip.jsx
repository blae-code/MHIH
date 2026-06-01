import React, { useMemo } from "react";
import { Database, Layers, MapPin, Activity, HelpCircle } from "lucide-react";

/**
 * VizStatStrip — top-of-page metric summary, matching Dashboard's stat_cards pattern.
 * Cards: Data Points · Categories · Regions · Years Tracked
 */
export default function VizStatStrip({ filtered, metrics, cats, regions, years }) {
  const stats = useMemo(() => {
    const values = filtered.map((m) => m.value).filter((v) => v != null);
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return {
      points: filtered.length,
      total: metrics.length,
      categories: cats.length,
      regions: regions.length,
      years: years.length,
      avg,
    };
  }, [filtered, metrics, cats, regions, years]);

  const CARDS = [
    {
      id: "points",
      label: "Filtered Data Points",
      value: stats.points.toLocaleString(),
      icon: Database,
      color: "#40c4ff",
      bgColor: "rgba(64,196,255,0.08)",
      desc: stats.points === stats.total
        ? `All ${stats.total.toLocaleString()} records in view`
        : `${stats.points.toLocaleString()} of ${stats.total.toLocaleString()} after filters`,
      tooltip: "Number of metric records matching the current filter set. Click a chart element to drill down or cross-filter.",
    },
    {
      id: "categories",
      label: "Categories",
      value: stats.categories,
      icon: Layers,
      color: "#FEDD00",
      bgColor: "rgba(254,221,0,0.08)",
      desc: `${stats.categories} health domains available`,
      tooltip: "Distinct health categories represented in the loaded dataset (chronic disease, mental health, social determinants, etc.).",
    },
    {
      id: "regions",
      label: "Regions",
      value: stats.regions,
      icon: MapPin,
      color: "#a78bfa",
      bgColor: "rgba(167,139,250,0.08)",
      desc: `${stats.regions} geographic areas`,
      tooltip: "Distinct regions in the dataset (BC, Northern BC, Interior, Fraser, Vancouver Island, Vancouver Coastal, Provincial).",
    },
    {
      id: "years",
      label: "Years Tracked",
      value: stats.years,
      icon: Activity,
      color: "#00e676",
      bgColor: "rgba(0,230,118,0.08)",
      desc: stats.years > 0
        ? `${Math.min(...years)} – ${Math.max(...years)} time range`
        : "No temporal data",
      tooltip: "Number of distinct years represented in the dataset. Switch grouping to 'Year' to view temporal trends.",
    },
  ];

  return (
    <div>
      <div className="dashboard-section-label mb-2">Dataset Overview</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {CARDS.map((card) => (
          <div
            key={card.id}
            className="viz-stat-card relative overflow-hidden group"
            title={card.tooltip}
            style={{
              background: `linear-gradient(135deg, ${card.bgColor} 0%, var(--bg-elevated) 100%)`,
              border: `1.5px solid ${card.color}33`,
              cursor: "help",
              padding: 12,
              borderRadius: 10,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.35)",
              transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${card.color} 0%, transparent 100%)` }} />
            <div className="flex items-start justify-between mb-2 relative z-10">
              <span className="font-semibold uppercase tracking-wider leading-tight" style={{ color: "var(--text-secondary)", fontSize: "9px", letterSpacing: "0.05em" }}>
                {card.label}
              </span>
              <div className="flex items-center gap-1">
                <div className="p-1.5 rounded-md shrink-0 transition-all group-hover:scale-110" style={{ background: card.bgColor, boxShadow: `0 0 8px ${card.color}22` }}>
                  <card.icon size={12} style={{ color: card.color, strokeWidth: 2.5 }} />
                </div>
                <HelpCircle size={10} style={{ color: card.color, opacity: 0.5 }} />
              </div>
            </div>
            <div className="font-black mb-1 relative z-10 leading-none" style={{ color: card.color, textShadow: `0 2px 8px ${card.color}18`, fontSize: 26 }}>
              {card.value}
            </div>
            <div className="leading-snug relative z-10" style={{ color: "var(--text-secondary)", fontSize: "10.5px" }}>
              {card.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}