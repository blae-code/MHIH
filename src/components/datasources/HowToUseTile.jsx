/**
 * HowToUseTile — concise onboarding hints for the Data Sources page.
 * Each tip has its own glyph, accent color, and short call-to-action label.
 */
import React from "react";
import {
  BookOpen, Plus, CalendarClock, ScrollText, Sparkles,
} from "lucide-react";

const TIPS = [
  {
    icon: BookOpen,
    color: "#40c4ff",
    title: "Browse external catalogs",
    body: "Use Connect Source to pull from BC, StatsCan, Health Canada, ArcGIS and more.",
  },
  {
    icon: Plus,
    color: "#FEDD00",
    title: "Add a manual entry",
    body: "Use Add Source for custom APIs, uploads, or sources outside our catalogs.",
  },
  {
    icon: CalendarClock,
    color: "#a78bfa",
    title: "Schedule recurring syncs",
    body: "Set daily, weekly, or monthly cadences — or sync ad-hoc with the refresh icon.",
  },
  {
    icon: ScrollText,
    color: "#ff5f6d",
    title: "Inspect failures",
    body: "Open Sync Logs to review errors, retry jobs, and trace ingest issues.",
  },
];

export default function HowToUseTile() {
  return (
    <div className="src-widget-card">
      <div className="relative z-10">
        <div className="dashboard-section-label flex items-center gap-1.5 mb-3">
          <Sparkles size={11} style={{ color: "#FEDD00" }} />
          How to Use
        </div>
        <ul className="space-y-2">
          {TIPS.map((tip) => {
            const Icon = tip.icon;
            return (
              <li
                key={tip.title}
                className="flex items-start gap-2.5 p-2 rounded-md transition-all"
                style={{
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--border-subtle)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${tip.color}44`;
                  e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.background = "var(--bg-overlay)";
                }}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: `${tip.color}18`,
                    border: `1px solid ${tip.color}33`,
                    boxShadow: `0 0 8px ${tip.color}22`,
                  }}
                >
                  <Icon size={11} style={{ color: tip.color, strokeWidth: 2.25 }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-xs font-semibold leading-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {tip.title}
                  </div>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: "var(--text-muted)", fontSize: 10.5 }}
                  >
                    {tip.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}