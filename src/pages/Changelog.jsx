import React, { useState } from "react";
import { BookOpen, Tag, Calendar, ChevronDown, ChevronRight, CheckCircle2, Wrench, Sparkles, AlertCircle, Zap } from "lucide-react";

const APP_VERSION = "0.1.0";
const APP_NAME = "MHIP — Métis Health Intelligence Platform";

const CHANGELOG = [
  {
    version: "0.1.0",
    date: "2026-03-05",
    status: "current",
    title: "Initial Release",
    summary: "First stable build of the Métis Health Intelligence Platform. Establishes core data, analytics, policy, and AI infrastructure.",
    changes: {
      new: [
        "Dashboard with platform KPIs, sparklines, and live metric tracking",
        "Data Repository — browse, import, export, and manage health metrics",
        "Visualizations — interactive charts with drill-down and cross-filtering (bar, line, area, pie, heatmap, Sankey, network)",
        "AI Insights — LLM-powered health analysis and pinned insight library",
        "AI Analyst — natural language data query interface",
        "Policy Lab — scenario simulation and intervention modelling",
        "Recommendations — confidence-ranked policy recommendation queue",
        "Watchlists — KPI mission and threshold breach monitoring",
        "Interventions Registry — planned and active intervention tracking",
        "Approvals Inbox — human gate for high-impact AI outputs",
        "Forecast Backtesting — MAPE drift and holdout validation",
        "Conflict Workbench — adjudicate conflicting source values",
        "Evidence Explorer — trace claims to source evidence",
        "Alerts Center — sentinel and source conflict alert operations",
        "Geo Equity Map — regional burden and disparity hotspots",
        "Knowledge Admin — policy document indexing and semantic query",
        "Hansard Intelligence — BC/Federal Hansard intelligence feed",
        "Data Sources — manage external data connections with sync scheduling",
        "My Data Sources — personal data import management",
        "Data Quality — flag review and resolution workflows",
        "AI Agents — automated insight, quality, and gap-finding agents",
        "Export — CSV and PDF data export",
        "Predictive Analytics — forecasting and trend modelling",
        "Geo Map — regional health data map",
        "Alerts — threshold-based notification system",
        "Data Prep — data cleaning and transformation tools",
        "Workflows — automated data pipeline builder",
        "Data Governance — audit logs and data policy management",
        "Reports — custom report builder with scheduling",
        "Team management and role-based access control",
        "Admin panel with system configuration",
        "In-app notification system with email delivery",
        "Command palette with live search (⌘K)",
        "User feedback modal",
        "Global dark theme with MNBC brand identity",
      ],
      improved: [],
      fixed: [],
    },
  },
];

const TYPE_CONFIG = {
  new: { label: "New", icon: Sparkles, color: "#00e676", bg: "rgba(0,230,118,0.08)", border: "rgba(0,230,118,0.2)" },
  improved: { label: "Improved", icon: Zap, color: "#40c4ff", bg: "rgba(64,196,255,0.08)", border: "rgba(64,196,255,0.2)" },
  fixed: { label: "Fixed", icon: Wrench, color: "#ffab40", bg: "rgba(255,171,64,0.08)", border: "rgba(255,171,64,0.2)" },
  breaking: { label: "Breaking", icon: AlertCircle, color: "#ff4757", bg: "rgba(255,71,87,0.08)", border: "rgba(255,71,87,0.2)" },
};

function ChangeSection({ type, items }) {
  if (!items || items.length === 0) return null;
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
          <Icon size={11} />
          {cfg.label}
        </span>
      </div>
      <ul className="space-y-1.5 ml-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: cfg.color, opacity: 0.7 }} />
            <span style={{ lineHeight: 1.55 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VersionCard({ entry, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const isCurrent = entry.status === "current";

  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{
        background: isCurrent ? "linear-gradient(135deg, #0d1f18 0%, #0a1820 100%)" : "var(--bg-elevated)",
        border: `1px solid ${isCurrent ? "rgba(0,230,118,0.25)" : "var(--border-subtle)"}`,
        boxShadow: isCurrent ? "0 0 24px rgba(0,230,118,0.06)" : "none",
      }}>
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
        style={{ background: "transparent" }}
        onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
        onMouseOut={e => e.currentTarget.style.background = "transparent"}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: isCurrent ? "rgba(0,230,118,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${isCurrent ? "rgba(0,230,118,0.3)" : "var(--border-subtle)"}`,
          }}>
          <Tag size={16} style={{ color: isCurrent ? "#00e676" : "var(--text-muted)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono font-bold text-base" style={{ color: isCurrent ? "#00e676" : "var(--text-primary)" }}>
              v{entry.version}
            </span>
            {isCurrent && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(0,230,118,0.12)", color: "#00e676", border: "1px solid rgba(0,230,118,0.25)" }}>
                CURRENT
              </span>
            )}
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{entry.title}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <Calendar size={11} />
              {entry.date}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{entry.summary}</span>
          </div>
        </div>
        {open ? <ChevronDown size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
               : <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5 pt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <ChangeSection type="new" items={entry.changes.new} />
          <ChangeSection type="improved" items={entry.changes.improved} />
          <ChangeSection type="fixed" items={entry.changes.fixed} />
          <ChangeSection type="breaking" items={entry.changes.breaking} />
        </div>
      )}
    </div>
  );
}

export default function Changelog() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--bg-surface) 0%, #091828 50%, var(--bg-elevated) 100%)",
          borderBottom: "1px solid var(--border-default)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(0,230,118,0.08)"
        }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #00e676 0%, #40c4ff 50%, transparent 100%)" }} />
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(0,230,118,0.15) 0%, rgba(0,230,118,0.05) 100%)", border: "1px solid rgba(0,230,118,0.25)" }}>
              <BookOpen size={16} style={{ color: "#00e676" }} />
            </div>
            <div>
              <div className="dashboard-section-label" style={{ marginBottom: 0, color: "#00e676" }}>Changelog</div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{APP_NAME}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono font-bold text-lg" style={{ color: "#00e676", lineHeight: 1 }}>v{APP_VERSION}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Latest release</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 max-w-3xl w-full mx-auto">
        <div className="space-y-3">
          {CHANGELOG.map((entry, i) => (
            <VersionCard key={entry.version} entry={entry} defaultOpen={i === 0} />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-6 px-4 py-3 rounded-lg text-xs" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text-secondary)" }}>Adding a new release:</strong> Edit <code style={{ color: "var(--accent-primary)", background: "rgba(254,221,0,0.08)", padding: "1px 5px", borderRadius: 3 }}>pages/Changelog.jsx</code> and prepend a new entry to the <code style={{ color: "var(--accent-primary)", background: "rgba(254,221,0,0.08)", padding: "1px 5px", borderRadius: 3 }}>CHANGELOG</code> array with the version, date, and categorised changes. Update <code style={{ color: "var(--accent-primary)", background: "rgba(254,221,0,0.08)", padding: "1px 5px", borderRadius: 3 }}>APP_VERSION</code> to match.
        </div>
      </div>
    </div>
  );
}