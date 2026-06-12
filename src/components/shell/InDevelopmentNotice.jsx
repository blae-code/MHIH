/**
 * InDevelopmentNotice — graceful placeholder for features that are
 * scaffolded but not yet wired to functional backend endpoints.
 *
 * Used during Phase 0 to replace pages whose backend dependencies
 * (MetricDefinition, DatasetManifest, catalog filesystem, etc.) are
 * not yet provisioned. The placeholder is visually consistent with
 * the rest of the OS (gradient border, ambient glow, Sofia Sans
 * typography) so users see "in development" — not "broken".
 *
 * Props:
 *   title     — page-level label (e.g. "Metric Catalog")
 *   summary   — one-line description of what the feature will do
 *   phase     — roadmap phase label (e.g. "Phase 1 · Data Foundation")
 *   blockers  — array of strings describing what's currently blocking
 *   roadmap   — array of {label, status} milestones
 *   icon      — Lucide icon component
 *   accent    — theme accent color (defaults to MNBC blue/cyan)
 */
import React from "react";
import { Construction, Sparkles, CheckCircle2, Clock, Circle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STATUS_META = {
  done:        { icon: CheckCircle2, color: "#00e676", label: "Done" },
  in_progress: { icon: Clock,        color: "#FEDD00", label: "In progress" },
  planned:     { icon: Circle,       color: "#4a6a8a", label: "Planned" },
};

export default function InDevelopmentNotice({
  title = "Feature",
  summary = "This module is being rebuilt on the new data foundation.",
  phase = "Phase 1 · Data Foundation",
  blockers = [],
  roadmap = [],
  icon: Icon = Construction,
  accent = "#40c4ff",
  fallbackLink = { page: "RedRiverOSHome", label: "Return to Home" },
}) {
  const rgb = hexToRgb(accent);

  return (
    <div
      className="relative w-full"
      style={{
        background: `linear-gradient(180deg, rgba(${rgb},0.04) 0%, transparent 60%)`,
        padding: "8px 4px",
      }}
    >
      <div
        className="rounded-2xl overflow-hidden mx-auto max-w-3xl relative"
        style={{
          background: "linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)",
          border: `1px solid rgba(${rgb}, 0.25)`,
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.04),
            0 0 0 1px rgba(0,0,0,0.4),
            0 12px 32px rgba(0,0,0,0.45),
            0 0 40px rgba(${rgb},0.06)
          `,
        }}
      >
        {/* Top accent strip */}
        <div
          aria-hidden
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
            boxShadow: `0 0 12px ${accent}88`,
          }}
        />

        {/* Ambient corner glow */}
        <div
          aria-hidden
          style={{
            position: "absolute", top: -60, right: -60, width: 200, height: 200,
            background: `radial-gradient(circle, rgba(${rgb},0.18) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        <div className="p-6 sm:p-8 relative z-10">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, rgba(${rgb},0.18) 0%, rgba(${rgb},0.04) 100%)`,
                border: `1px solid rgba(${rgb},0.3)`,
                boxShadow: `0 0 16px rgba(${rgb},0.15), inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}
            >
              <Icon size={22} style={{ color: accent, strokeWidth: 2 }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="dashboard-section-label"
                  style={{ margin: 0, color: accent }}
                >
                  In Development
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{
                    background: `rgba(${rgb},0.12)`,
                    color: accent,
                    border: `1px solid rgba(${rgb},0.3)`,
                    fontSize: 9.5,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {phase}
                </span>
              </div>
              <h2
                className="mnbc-heading"
                style={{
                  fontSize: 24,
                  color: "var(--text-primary)",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                {title}
              </h2>
              <p
                className="mt-2 leading-relaxed"
                style={{ color: "var(--text-secondary)", fontSize: 13 }}
              >
                {summary}
              </p>
            </div>
          </div>

          {/* Blockers (if any) */}
          {blockers.length > 0 && (
            <div
              className="rounded-lg p-3.5 mb-4"
              style={{
                background: "rgba(255,77,79,0.04)",
                border: "1px solid rgba(255,77,79,0.18)",
              }}
            >
              <div
                className="flex items-center gap-2 mb-2"
                style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#ff8a8a",
                }}
              >
                <Sparkles size={11} />
                Currently blocked on
              </div>
              <ul className="space-y-1.5">
                {blockers.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2"
                    style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}
                  >
                    <span
                      className="shrink-0 mt-1.5 w-1 h-1 rounded-full"
                      style={{ background: "#ff8a8a" }}
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Roadmap */}
          {roadmap.length > 0 && (
            <div
              className="rounded-lg p-3.5 mb-5"
              style={{
                background: "var(--bg-overlay)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                className="flex items-center gap-2 mb-2.5"
                style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--text-muted)",
                }}
              >
                Path to launch
              </div>
              <ol className="space-y-2">
                {roadmap.map((step, i) => {
                  const meta = STATUS_META[step.status] ?? STATUS_META.planned;
                  const SIcon = meta.icon;
                  return (
                    <li key={i} className="flex items-center gap-2.5">
                      <SIcon
                        size={13}
                        style={{
                          color: meta.color,
                          flexShrink: 0,
                          ...(step.status === "in_progress"
                            ? { animation: "pulse 1.6s ease-in-out infinite" }
                            : {}),
                        }}
                      />
                      <span
                        className="flex-1 truncate"
                        style={{
                          fontSize: 12,
                          color: step.status === "done"
                            ? "var(--text-muted)"
                            : "var(--text-primary)",
                          textDecoration: step.status === "done" ? "line-through" : "none",
                          fontWeight: step.status === "in_progress" ? 600 : 400,
                        }}
                      >
                        {step.label}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5"
                        style={{
                          fontSize: 9, fontWeight: 700,
                          color: meta.color,
                          background: `${meta.color}14`,
                          border: `1px solid ${meta.color}33`,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {meta.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <div
              className="flex items-center gap-1.5"
              style={{ fontSize: 11, color: "var(--text-muted)" }}
            >
              <Sparkles size={11} style={{ color: accent, opacity: 0.8 }} />
              <span>This module will activate once Phase 1 ships.</span>
            </div>
            <Link
              to={createPageUrl(fallbackLink.page)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all group"
              style={{
                background: `linear-gradient(135deg, rgba(${rgb},0.12) 0%, rgba(${rgb},0.04) 100%)`,
                border: `1px solid rgba(${rgb},0.3)`,
                color: accent,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 18px rgba(${rgb},0.25)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {fallbackLink.label}
              <ArrowRight
                size={12}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`
    : "64,196,255";
}