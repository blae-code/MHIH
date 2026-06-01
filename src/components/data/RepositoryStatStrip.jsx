import React, { useMemo } from "react";
import { Database, Layers3, MapPin, ShieldCheck, HelpCircle } from "lucide-react";

/**
 * RepositoryStatStrip — top-of-page summary for the Health Metrics Repository.
 * Cards: Total Metrics · Categories · Regions Covered · High Confidence
 */
export default function RepositoryStatStrip({ metrics, filteredCount }) {
  const stats = useMemo(() => {
    const total = metrics.length;
    const categories = new Set(metrics.map(m => m.category).filter(Boolean));
    const regions = new Set(metrics.map(m => m.region).filter(Boolean));
    const highConfidence = metrics.filter(m => m.confidence_level === "high").length;
    const mediumConfidence = metrics.filter(m => m.confidence_level === "medium").length;
    const lowConfidence = metrics.filter(m => m.confidence_level === "low").length;
    const latestYear = metrics.reduce((acc, m) => (m.year && m.year > acc ? m.year : acc), 0);
    return { total, categories: categories.size, regions: regions.size, highConfidence, mediumConfidence, lowConfidence, latestYear };
  }, [metrics]);

  const CARDS = [
    {
      id: "total",
      label: "Total Metrics",
      value: stats.total.toLocaleString(),
      icon: Database,
      color: "#FEDD00",
      bgColor: "rgba(254,221,0,0.08)",
      desc: filteredCount !== stats.total
        ? `${filteredCount.toLocaleString()} matching current filters`
        : stats.latestYear
          ? `Latest data: ${stats.latestYear}`
          : "Health indicator records",
      tooltip: "Total number of health metric records stored in the repository, spanning all categories, regions, and years.",
    },
    {
      id: "categories",
      label: "Categories",
      value: stats.categories,
      icon: Layers3,
      color: "#40c4ff",
      bgColor: "rgba(64,196,255,0.08)",
      desc: stats.categories > 0
        ? `Across ${stats.categories} indicator domain${stats.categories === 1 ? "" : "s"}`
        : "No categories yet",
      tooltip: "Distinct indicator categories represented in the data — e.g. chronic disease, mental health, mortality.",
    },
    {
      id: "regions",
      label: "Regions Covered",
      value: stats.regions,
      icon: MapPin,
      color: "#a78bfa",
      bgColor: "rgba(167,139,250,0.08)",
      desc: stats.regions > 0
        ? `Provincial + ${Math.max(0, stats.regions - 1)} regional cut${stats.regions === 2 ? "" : "s"}`
        : "No regions yet",
      tooltip: "Geographic regions with at least one recorded metric. Includes provincial, health authorities, and other regional cuts.",
    },
    {
      id: "confidence",
      label: "High Confidence",
      value: stats.highConfidence,
      icon: ShieldCheck,
      color: "#00e676",
      bgColor: "rgba(0,230,118,0.08)",
      desc: stats.total > 0
        ? `${Math.round((stats.highConfidence / stats.total) * 100)}% · ${stats.mediumConfidence} med · ${stats.lowConfidence} low`
        : "No data graded yet",
      tooltip: "Records flagged as high confidence by source. Higher counts mean the dataset is more analytically reliable.",
    },
  ];

  return (
    <div>
      <div className="dashboard-section-label mb-2">Repository Overview</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {CARDS.map((card) => (
          <div
            key={card.id}
            className="relative overflow-hidden group"
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