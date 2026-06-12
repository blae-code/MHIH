/**
 * CockpitCard
 *
 * The canonical card surface for every panel in the Data & Evidence module.
 * Encapsulates the gradient border, ambient glow, hover lift, and inner
 * padding that today is copy-pasted into each page's <style> block.
 *
 * Use this in place of bespoke `.repo-widget-card`, `.dashboard-widget-card`,
 * etc. — those classes can keep working in parallel while we migrate.
 *
 * Props:
 *   tone      — "default" | "info" | "success" | "warning" | "danger"
 *               Tints the gradient border + glow without touching content.
 *   padding   — "none" | "sm" | "md" (default)
 *   interactive — boolean: enables hover lift (default true)
 *   header    — optional small header strip (label + actions)
 *   children  — card body
 *   className — extra Tailwind classes for the outer wrapper
 *   style     — extra inline styles for the outer wrapper
 */

import React from "react";

const TONE_BORDER = {
  default: "linear-gradient(135deg, rgba(254,221,0,0.4) 0%, rgba(64,196,255,0.3) 50%, rgba(254,221,0,0.2) 100%)",
  info:    "linear-gradient(135deg, rgba(64,196,255,0.5) 0%, rgba(64,196,255,0.25) 100%)",
  success: "linear-gradient(135deg, rgba(0,230,118,0.5) 0%, rgba(0,230,118,0.25) 100%)",
  warning: "linear-gradient(135deg, rgba(255,171,64,0.5) 0%, rgba(255,171,64,0.25) 100%)",
  danger:  "linear-gradient(135deg, rgba(255,71,87,0.5) 0%, rgba(255,71,87,0.25) 100%)",
};

const TONE_HOVER = {
  default: "linear-gradient(135deg, rgba(254,221,0,0.6) 0%, rgba(64,196,255,0.5) 50%, rgba(254,221,0,0.4) 100%)",
  info:    "linear-gradient(135deg, rgba(64,196,255,0.7) 0%, rgba(64,196,255,0.4) 100%)",
  success: "linear-gradient(135deg, rgba(0,230,118,0.7) 0%, rgba(0,230,118,0.4) 100%)",
  warning: "linear-gradient(135deg, rgba(255,171,64,0.7) 0%, rgba(255,171,64,0.4) 100%)",
  danger:  "linear-gradient(135deg, rgba(255,71,87,0.7) 0%, rgba(255,71,87,0.4) 100%)",
};

const TONE_GLOW = {
  default: "rgba(254,221,0,0.05)",
  info:    "rgba(64,196,255,0.06)",
  success: "rgba(0,230,118,0.06)",
  warning: "rgba(255,171,64,0.06)",
  danger:  "rgba(255,71,87,0.06)",
};

const PADDING = { none: 0, sm: 10, md: 14 };

export default function CockpitCard({
  tone = "default",
  padding = "md",
  interactive = true,
  header,
  children,
  className = "",
  style = {},
}) {
  const pad = PADDING[padding] ?? PADDING.md;
  const cardId = React.useId().replace(/:/g, "");

  return (
    <>
      <style>{`
        .cc-${cardId} {
          border-radius: 10px;
          border: 1.5px solid;
          border-image: ${TONE_BORDER[tone]} 1;
          background: #0a1220;
          padding: ${pad}px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(254,221,0,0.08), 0 0 20px ${TONE_GLOW[tone]};
        }
        ${interactive ? `
        .cc-${cardId}:hover {
          border-image: ${TONE_HOVER[tone]} 1;
          box-shadow: inset 0 1px 0 rgba(254,221,0,0.15), 0 0 32px ${TONE_GLOW[tone]}, 0 8px 24px rgba(0,0,0,0.4);
          transform: translateY(-1px);
        }` : ""}
        .cc-${cardId}::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(254,221,0,0.02) 0%, transparent 100%);
          pointer-events: none;
        }
        .cc-${cardId} > * { position: relative; z-index: 1; }
      `}</style>
      <div className={`cc-${cardId} ${className}`} style={style}>
        {header && (
          <div className="flex items-center justify-between mb-2">
            {header}
          </div>
        )}
        {children}
      </div>
    </>
  );
}