/**
 * Reporting — unified reporting suite (merged Visualizations + Reports).
 *
 * One page, three linked workspaces:
 *   - Chart Studio: craft interactive chart components for use in reports
 *   - Reports:      assemble, generate, and download full reports
 *   - Schedules:    automate recurring report delivery
 *
 * Chart Studio's "Build Report" button hands off directly to the Reports
 * tab with the builder open.
 */

import React, { useState } from "react";
import { FileText, BarChart3, Calendar } from "lucide-react";
import ChartStudio from "@/components/reporting/ChartStudio";
import ReportsCenter from "@/components/reporting/ReportsCenter";

const TABS = [
  { key: "studio", label: "Chart Studio", icon: BarChart3 },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "schedules", label: "Schedules", icon: Calendar },
];

export default function Reporting() {
  const [tab, setTab] = useState("studio");
  const [builderSignal, setBuilderSignal] = useState(0);

  // Chart Studio → Reports hand-off: switch tab and open the builder
  const handleSendToReport = () => {
    setTab("reports");
    setBuilderSignal((n) => n + 1);
  };

  return (
    <div className="min-h-full relative" style={{ background: "var(--bg-surface)" }}>
      {/* Ambient page glow — matches Dashboard depth treatment */}
      <div aria-hidden style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 260,
        background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(254,221,0,0.05) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div aria-hidden style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
        background: "radial-gradient(ellipse 50% 100% at 50% 100%, rgba(64,196,255,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div className="flex flex-col p-3 relative" style={{ zIndex: 1 }}>

        {/* ── Header strip ───────────────────────────────────────────── */}
        <div className="rounded-xl px-5 py-3 mb-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--bg-surface) 0%, #0d1f2a 50%, var(--bg-elevated) 100%)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(254,221,0,0.1)"
          }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #FEDD00 0%, #40c4ff 60%, transparent 100%)" }} />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(254,221,0,0.15) 0%, rgba(254,221,0,0.05) 100%)",
                  border: "1px solid rgba(254,221,0,0.25)",
                  boxShadow: "0 0 16px rgba(254,221,0,0.1)"
                }}>
                <FileText size={16} style={{ color: "var(--accent-primary)" }} />
              </div>
              <div>
                <div className="dashboard-section-label" style={{ marginBottom: 0 }}>Reporting Suite</div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Craft chart components, assemble custom reports, and schedule automated delivery
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all"
                    style={{
                      background: tab === t.key ? "rgba(254,221,0,0.12)" : "transparent",
                      color: tab === t.key ? "var(--accent-primary)" : "var(--text-muted)",
                      border: tab === t.key ? "1px solid rgba(254,221,0,0.3)" : "1px solid transparent"
                    }}>
                    <t.icon size={12} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Active workspace ───────────────────────────────────────── */}
        {tab === "studio" ? (
          <ChartStudio onSendToReport={handleSendToReport} />
        ) : (
          <ReportsCenter view={tab} openBuilderSignal={builderSignal} />
        )}
      </div>
    </div>
  );
}