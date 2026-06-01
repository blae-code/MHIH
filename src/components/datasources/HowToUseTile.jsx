/**
 * HowToUseTile — onboarding hints with a themed yellow header,
 * ambient glow, and per-tip coloured backgrounds.
 */
import React from "react";
import {
  BookOpen, Plus, CalendarClock, ScrollText, Sparkles, ChevronRight,
} from "lucide-react";

const ACCENT = "#FEDD00";

const TIPS = [
  {
    icon: BookOpen,
    color: "#40c4ff",
    title: "Browse external catalogs",
    body: "Use Connect Source to pull from BC, StatsCan, Health Canada, ArcGIS, BigQuery and more.",
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
    <div
      className="rounded-xl relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, rgba(254,221,0,0.07) 0%, var(--bg-elevated) 60%)`,
        border: "1px solid var(--border-subtle)",
        boxShadow: `0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(254,221,0,0.15)`,
      }}
    >
      <span aria-hidden style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${ACCENT} 0%, #ffab40 60%, transparent 100%)`,
      }} />
      <div aria-hidden style={{
        position: "absolute", top: -40, right: -40, width: 140, height: 140,
        background: `radial-gradient(circle, ${ACCENT}33 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div className="relative p-3.5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}33 0%, ${ACCENT}11 100%)`,
              border: `1px solid ${ACCENT}66`,
              boxShadow: `0 0 12px ${ACCENT}33`,
            }}>
            <Sparkles size={11} style={{ color: ACCENT, strokeWidth: 2.5 }} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: ACCENT, fontSize: 10, letterSpacing: "0.1em" }}>
              How to Use
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)", fontSize: 9.5 }}>
              Quick start guide
            </div>
          </div>
        </div>

        <ul className="space-y-1.5">
          {TIPS.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <li
                key={tip.title}
                className="flex items-start gap-2.5 p-2 rounded-md transition-all relative overflow-hidden group"
                style={{
                  background: `linear-gradient(90deg, ${tip.color}10 0%, var(--bg-overlay) 60%)`,
                  border: `1px solid ${tip.color}22`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${tip.color}66`;
                  e.currentTarget.style.boxShadow = `0 0 12px ${tip.color}22`;
                  e.currentTarget.style.transform = "translateX(2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${tip.color}22`;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                {/* Number badge */}
                <span aria-hidden
                  className="absolute top-1 right-1.5 font-mono font-bold opacity-20"
                  style={{ color: tip.color, fontSize: 18, lineHeight: 1 }}>
                  {i + 1}
                </span>
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${tip.color}33 0%, ${tip.color}0a 100%)`,
                    border: `1px solid ${tip.color}55`,
                    boxShadow: `0 0 10px ${tip.color}33, inset 0 1px 0 ${tip.color}22`,
                  }}
                >
                  <Icon size={12} style={{ color: tip.color, strokeWidth: 2.25 }} />
                </div>
                <div className="min-w-0 flex-1 relative z-10">
                  <div className="flex items-center gap-1">
                    <div className="text-xs font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                      {tip.title}
                    </div>
                    <ChevronRight size={9} className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: tip.color }} />
                  </div>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--text-muted)", fontSize: 10.5 }}>
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