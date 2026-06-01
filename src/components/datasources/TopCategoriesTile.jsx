/**
 * TopCategoriesTile — coloured distribution bars with a themed violet header,
 * ambient glow, and per-row coloured background tints.
 */
import React from "react";
import { Layers3, PieChart } from "lucide-react";

const ACCENT = "#a78bfa";

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
  const max = topCategories.length ? Math.max(...topCategories.map(([, c]) => c)) : 0;

  return (
    <div
      className="rounded-xl relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, rgba(167,139,250,0.07) 0%, var(--bg-elevated) 60%)`,
        border: "1px solid var(--border-subtle)",
        boxShadow: `0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(167,139,250,0.12)`,
      }}
    >
      <span aria-hidden style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${ACCENT} 0%, #f472b6 60%, transparent 100%)`,
      }} />
      <div aria-hidden style={{
        position: "absolute", top: -40, right: -40, width: 140, height: 140,
        background: `radial-gradient(circle, ${ACCENT}33 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div className="relative p-3.5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}33 0%, ${ACCENT}11 100%)`,
                border: `1px solid ${ACCENT}55`,
                boxShadow: `0 0 10px ${ACCENT}22`,
              }}>
              <PieChart size={11} style={{ color: ACCENT, strokeWidth: 2.5 }} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: ACCENT, fontSize: 10, letterSpacing: "0.1em" }}>
                Top Categories
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)", fontSize: 9.5 }}>
                Distribution by domain
              </div>
            </div>
          </div>
          {totalSources > 0 && (
            <span className="px-2 py-0.5 rounded-full font-mono tabular-nums font-semibold"
              style={{
                fontSize: 10,
                background: `linear-gradient(135deg, ${ACCENT}28 0%, ${ACCENT}10 100%)`,
                color: ACCENT,
                border: `1px solid ${ACCENT}55`,
              }}>
              {totalSources} total
            </span>
          )}
        </div>

        {topCategories.length === 0 ? (
          <div className="text-center py-6" style={{ color: "var(--text-muted)" }}>
            <Layers3 size={20} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">No categorized sources yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topCategories.map(([cat, count]) => {
              const pct = totalSources ? (count / totalSources) * 100 : 0;
              const widthPct = max ? (count / max) * 100 : 0;
              const color = CATEGORY_COLOR[cat] || ACCENT;
              return (
                <div key={cat}
                  className="px-2 py-1.5 rounded-md transition-all"
                  style={{
                    background: `linear-gradient(90deg, ${color}10 0%, var(--bg-overlay) 80%)`,
                    border: `1px solid ${color}22`,
                  }}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-sm shrink-0"
                        style={{
                          background: color,
                          boxShadow: `0 0 8px ${color}aa, inset 0 1px 0 rgba(255,255,255,0.3)`,
                        }} />
                      <span className="truncate font-semibold"
                        style={{ color: "var(--text-primary)", fontSize: 11 }}>
                        {formatLabel(cat)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 shrink-0 ml-2">
                      <span className="font-mono font-bold tabular-nums"
                        style={{ color, fontSize: 12, textShadow: `0 0 8px ${color}66` }}>
                        {count}
                      </span>
                      <span className="font-mono tabular-nums"
                        style={{ color: "var(--text-muted)", fontSize: 9.5 }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative overflow-hidden"
                    style={{
                      height: 5,
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: 3,
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
                    }}>
                    <div style={{
                      width: `${widthPct}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${color}88 0%, ${color} 60%, ${color}ee 100%)`,
                      borderRadius: 3,
                      boxShadow: `0 0 10px ${color}88, inset 0 1px 0 rgba(255,255,255,0.25)`,
                      transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                    }} />
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