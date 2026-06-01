import React from "react";

/**
 * CockpitShell — shared layout primitive for "cockpit-pattern" pages.
 *
 * Provides:
 *  - Ambient page glow (top yellow + bottom blue)
 *  - Gradient page header strip (icon · title · subtitle · actions)
 *  - Injected CSS for `.cockpit-widget-card` and `.cockpit-zone-grid`
 *
 * Usage:
 *   <CockpitShell
 *     icon={<Database size={16} ... />}
 *     title="Page Title"
 *     subtitle="Page subtitle"
 *     actions={<div>...action buttons...</div>}
 *   >
 *     <StatStrip /> in mb-3 wrapper
 *     <div className="cockpit-zone-grid"> ...two zones... </div>
 *   </CockpitShell>
 */
export default function CockpitShell({
  icon,
  title,
  subtitle,
  actions,
  children,
  topGlow = "rgba(254,221,0,0.05)",
  bottomGlow = "rgba(64,196,255,0.04)",
}) {
  return (
    <div className="min-h-full relative" style={{ background: "var(--bg-surface)" }}>
      {/* Ambient page glows */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260, background: `radial-gradient(ellipse 60% 100% at 50% 0%, ${topGlow} 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: `radial-gradient(ellipse 50% 100% at 50% 100%, ${bottomGlow} 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

      <style>{`
        .cockpit-widget-card {
          border-radius: 10px;
          border: 1.5px solid;
          border-image: linear-gradient(135deg, rgba(254,221,0,0.4) 0%, rgba(64,196,255,0.3) 50%, rgba(254,221,0,0.2) 100%) 1;
          background: #0a1220;
          padding: 14px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(254,221,0,0.08), 0 0 20px rgba(254,221,0,0.05);
        }
        .cockpit-widget-card:hover {
          border-image: linear-gradient(135deg, rgba(254,221,0,0.6) 0%, rgba(64,196,255,0.5) 50%, rgba(254,221,0,0.4) 100%) 1;
          box-shadow: inset 0 1px 0 rgba(254,221,0,0.15), 0 0 32px rgba(254,221,0,0.15), 0 8px 24px rgba(0,0,0,0.4);
        }
        .cockpit-widget-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(254,221,0,0.02) 0%, transparent 100%);
          pointer-events: none;
        }
        .cockpit-zone-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          align-items: start;
        }
        @media (min-width: 1024px) {
          .cockpit-zone-grid {
            grid-template-columns: 1.4fr 1fr;
          }
        }
        .cockpit-zone {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
      `}</style>

      <div className="flex flex-col p-3 relative" style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="rounded-xl px-5 py-3 mb-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--bg-surface) 0%, #091828 50%, var(--bg-elevated) 100%)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(254,221,0,0.1)"
          }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #FEDD00 0%, #40c4ff 60%, transparent 100%)" }} />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(254,221,0,0.15) 0%, rgba(254,221,0,0.05) 100%)", border: "1px solid rgba(254,221,0,0.25)", boxShadow: "0 0 16px rgba(254,221,0,0.1)" }}>
                {icon}
              </div>
              <div>
                <div className="dashboard-section-label" style={{ marginBottom: 0 }}>{title}</div>
                {subtitle && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {actions}
              </div>
            )}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}