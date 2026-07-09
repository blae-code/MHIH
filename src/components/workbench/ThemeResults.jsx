/**
 * ThemeResults — renders AI-identified qualitative themes: prevalence chart,
 * theme cards with descriptions, keywords, and representative quotes.
 */

import React from "react";
import { Quote, Hash } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TOOLTIP_PROPS, AXIS_TICK, GRID_STROKE, CURSOR_FILL } from "@/components/workbench/chartTheme";

const THEME_COLORS = ["#40c4ff", "#00e676", "#FEDD00", "#ff9e40", "#e040fb", "#ff5252", "#69f0ae", "#7c9eff"];

export default function ThemeResults({ result }) {
  if (!result?.themes?.length) return null;
  const chartData = result.themes.map((t, i) => ({
    name: t.name,
    mentions: t.mention_count ?? 0,
    fill: THEME_COLORS[i % THEME_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      {result.summary && (
        <p className="text-xs leading-relaxed px-3 py-2.5 rounded-lg"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          {result.summary}
        </p>
      )}

      {/* Theme prevalence chart */}
      <div className="depth-card p-3">
        <div className="mb-1.5" style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Theme Prevalence
        </div>
        <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 34)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
            <XAxis type="number" tick={AXIS_TICK} allowDecimals={false} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
            <YAxis type="category" dataKey="name" width={160} tick={{ ...AXIS_TICK, fontSize: 11, fill: "#8bafd4" }} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} cursor={CURSOR_FILL} formatter={(v) => [`${v} responses`, "Mentions"]} />
            <Bar dataKey="mentions" radius={[0, 4, 4, 0]} barSize={18} fillOpacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Theme cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {result.themes.map((t, i) => {
          const color = THEME_COLORS[i % THEME_COLORS.length];
          return (
            <div key={i} className="depth-card p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.name}</span>
                <span className="tag ml-auto" style={{ fontSize: 10 }}>
                  {t.mention_count ?? 0} responses
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>
                {t.description}
              </p>
              {t.keywords?.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mb-2">
                  <Hash size={10} style={{ color: "var(--text-muted)" }} />
                  {t.keywords.map((k, j) => (
                    <span key={j} className="tag" style={{ fontSize: 9.5, padding: "1px 6px" }}>{k}</span>
                  ))}
                </div>
              )}
              {t.example_quotes?.length > 0 && (
                <div className="space-y-1.5">
                  {t.example_quotes.slice(0, 2).map((q, j) => (
                    <div key={j} className="flex gap-1.5 text-xs italic px-2.5 py-1.5 rounded-md"
                      style={{ background: "var(--bg-overlay)", border: `1px solid var(--border-subtle)`, borderLeft: `2px solid ${color}`, color: "var(--text-secondary)" }}>
                      <Quote size={10} className="shrink-0 mt-0.5" style={{ color, opacity: 0.7 }} />
                      <span>"{q}"</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}