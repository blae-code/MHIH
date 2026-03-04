import React, { useState } from "react";
import { Plus, X, Search } from "lucide-react";

export const AVAILABLE_WIDGETS = [
  // Core Analytics
  {
    id: "stat_cards",
    name: "Platform Metrics",
    description: "Key performance indicators including active metrics, data quality, and sources",
    category: "analytics",
    icon: "📊",
    defaultSpan: 2,
    visible: true
  },
  {
    id: "year_trend",
    name: "Metrics by Year",
    description: "Area chart showing health indicators recorded over time",
    category: "analytics",
    icon: "📈",
    defaultSpan: 2,
    visible: true
  },
  {
    id: "disparity_explorer",
    name: "Disparity Explorer",
    description: "Interactive charts comparing Métis health outcomes vs BC population",
    category: "analytics",
    icon: "🎯",
    defaultSpan: 2,
    visible: true
  },
  {
    id: "regional_performance",
    name: "Regional Performance",
    description: "Bar chart showing average health metrics by BC region",
    category: "geography",
    icon: "🗺️",
    defaultSpan: 2,
    visible: true
  },
  {
    id: "category_pie",
    name: "Category Leaders",
    description: "Scatter plot and rankings of health categories",
    category: "analytics",
    icon: "🔝",
    defaultSpan: 2,
    visible: true
  },
  {
    id: "trending_metrics",
    name: "Trending Metrics",
    description: "Top health indicators with the most significant year-over-year changes",
    category: "analytics",
    icon: "🚀",
    defaultSpan: 2,
    visible: true
  },
  // Data Management
  {
    id: "data_sources",
    name: "Data Sources",
    description: "List of recently updated data connections and their sync status",
    category: "data",
    icon: "🔗",
    defaultSpan: 1,
    visible: true
  },
  {
    id: "ai_insights",
    name: "AI Insights",
    description: "Recent AI-generated analysis and health recommendations",
    category: "ai",
    icon: "✨",
    defaultSpan: 1,
    visible: true
  },
  {
    id: "weekly_reports",
    name: "Weekly Reports",
    description: "Automated weekly summary reports for system administrators",
    category: "reports",
    icon: "📋",
    defaultSpan: 1,
    visible: true
  }
];

export default function WidgetLibrary({ onAddWidget, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Widgets" },
    { id: "analytics", label: "Analytics" },
    { id: "geography", label: "Geography" },
    { id: "data", label: "Data" },
    { id: "ai", label: "AI" },
    { id: "reports", label: "Reports" }
  ];

  const filtered = AVAILABLE_WIDGETS.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || w.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-80vh rounded-xl overflow-hidden flex flex-col"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)"
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-default)" }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Widget Library</h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Add widgets to personalize your dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="activity-icon"
            style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-3 space-y-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs px-2.5 py-2 rounded outline-none"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)"
            }} />
          <div className="flex gap-1.5 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="text-xs px-2.5 py-1.5 rounded font-medium transition-all"
                style={{
                  background: selectedCategory === cat.id ? "rgba(254,221,0,0.15)" : "var(--bg-surface)",
                  border: `1px solid ${selectedCategory === cat.id ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                  color: selectedCategory === cat.id ? "var(--accent-primary)" : "var(--text-secondary)"
                }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Widget Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No widgets match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(widget => (
                <div
                  key={widget.id}
                  className="rounded-lg p-3 border transition-all hover:shadow-lg cursor-pointer group"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)"
                  }}
                  onClick={() => {
                    onAddWidget(widget);
                    onClose();
                  }}>
                  <div className="flex items-start justify-between mb-2">
                    <div style={{ fontSize: 18 }}>{widget.icon}</div>
                    <Plus size={14} style={{ color: "var(--accent-primary)", opacity: 0 }} className="group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{widget.name}</div>
                  <div className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{widget.description}</div>
                  <div className="text-xs mt-2" style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                    {widget.category.charAt(0).toUpperCase() + widget.category.slice(1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}