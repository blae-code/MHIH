/**
 * TopCategoriesTile — polished distribution bars showing the most-represented
 * source categories. Each bar uses a semantic category accent color and shows
 * count + percentage with smooth fill animation.
 */
import React from "react";
import { Layers3 } from "lucide-react";

// Semantic category colors — distinct hues so bars are immediately scannable.
const CATEGORY_COLOR = {
  chronic_disease:      "#ff5f6d",
  mental_health:        "#a78bfa",
  substance_use:        "#f97316",
  maternal_child:       "#f472b6",
  social_determinants:  "#34d399",
  demographics:         "#40c4ff",
  mortality:            "#94a3b8",
  access_to_care:       "#fbbf24",
  other:                "#64748b",
};

const formatLabel = (cat) =>
  cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function TopCategoriesTile({ topCategories, totalSources }) {
  return (
    <div className="src-widget-card">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="dashboard-section-label flex items-center gap-1.5" style={{ margin: 0 }}>
            <Layers3 size={11} style={{ color: "#a78bfa" }} />
            Top Categories
          </div>
          {totalSources > 0 && (
            <span
              className="font-mono tabular-nums"
              style={{ fontSize: 9.5, color: "var(--text-muted)" }}
            >
              of {totalSources}
            </span>
          )}
        </div>

        {topCategories.length === 0 ? (
          <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
            <Layers3 size={18} className="mx-auto mb-1.5 opacity-30" />
            <p className="text-xs">No categorized sources yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {topCategories.map(([cat, count]) => {
              const pct = totalSources ? (count / totalSources) * 100 : 0;
              const color = CATEGORY_COLOR[cat] || "#40c4ff";
              return (
                <div key={cat} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
                      />
                      <span
                        className="truncate font-medium"
                        style={{ color: "var(--text-secondary)", fontSize: 11 }}
                      >
                        {formatLabel(cat)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 shrink-0 ml-2">
                      <span
                        className="font-mono font-bold tabular-nums"
                        style={{ color, fontSize: 11.5 }}
                      >
                        {count}
                      </span>
                      <span
                        className="font-mono tabular-nums"
                        style={{ color: "var(--text-muted)", fontSize: 9.5 }}
                      >
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div
                    className="relative overflow-hidden"
                    style={{
                      height: 5,
                      background: "var(--bg-overlay)",
                      borderRadius: 3,
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${color}cc 0%, ${color} 100%)`,
                        borderRadius: 2,
                        boxShadow: `0 0 8px ${color}66, inset 0 1px 0 rgba(255,255,255,0.15)`,
                        transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}