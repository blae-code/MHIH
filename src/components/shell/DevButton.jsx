/**
 * DevButton — visual marker for action buttons that are awaiting the
 * underlying entity/data model. Renders as a disabled button with a "DEV"
 * pill, an explanatory tooltip, and an optional click handler that produces
 * a clear toast/log message instead of an unhandled 500.
 *
 * Use this in pages where the surrounding UI is functional (loads data,
 * renders empty states gracefully) but specific action triggers depend on
 * backend pipelines not yet built. Keeps the page usable and honest.
 */

import React from "react";
import { Wrench } from "lucide-react";

export default function DevButton({
  icon: Icon = Wrench,
  label,
  reason = "This action is awaiting Phase 2 backend pipelines.",
  size = "sm",
}) {
  const padding = size === "lg" ? "px-3 py-2" : "px-2.5 py-1.5";
  return (
    <button
      type="button"
      disabled
      title={`${label} — in development. ${reason}`}
      className={`flex items-center gap-1.5 rounded text-xs font-medium ${padding}`}
      style={{
        background: "var(--bg-overlay)",
        border: "1px dashed rgba(254,221,0,0.35)",
        color: "var(--text-muted)",
        cursor: "not-allowed",
        opacity: 0.75,
      }}
    >
      <Icon size={11} style={{ color: "rgba(254,221,0,0.55)" }} />
      <span>{label}</span>
      <span
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.08em",
          color: "#FEDD00",
          background: "rgba(254,221,0,0.10)",
          border: "1px solid rgba(254,221,0,0.28)",
          borderRadius: 3,
          padding: "1px 4px",
          marginLeft: 2,
        }}
      >
        DEV
      </span>
    </button>
  );
}