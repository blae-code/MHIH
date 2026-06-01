import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import CockpitShell from "@/components/shell/CockpitShell";
import MetricForgePanel from "@/components/redriver/MetricForgePanel";

function loadProjectionMode() {
  try {
    const stored = localStorage.getItem("rr_projection_mode");
    if (stored === "internal" || stored === "projected") return stored;
  } catch {}
  return "projected";
}

export default function MetricForge() {
  const [projectionMode, setProjectionMode] = useState(loadProjectionMode);

  const updateMode = (mode) => {
    setProjectionMode(mode);
    try {
      localStorage.setItem("rr_projection_mode", mode);
    } catch {}
  };

  return (
    <CockpitShell
      icon={<SlidersHorizontal size={16} style={{ color: "var(--color-info)" }} />}
      title="Metric Forge"
      subtitle="Projection-safe series query builder for time-aligned, comparable evidence"
      topGlow="rgba(64,196,255,0.06)"
      bottomGlow="rgba(254,221,0,0.04)"
      actions={
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
          {["projected", "internal"].map((mode) => (
            <button
              key={mode}
              onClick={() => updateMode(mode)}
              className="px-3 py-1.5 rounded text-xs font-medium capitalize transition-all"
              style={{
                background: projectionMode === mode ? "rgba(64,196,255,0.12)" : "transparent",
                color: projectionMode === mode ? "var(--color-info)" : "var(--text-muted)",
                border: projectionMode === mode ? "1px solid rgba(64,196,255,0.3)" : "1px solid transparent",
              }}>
              {mode}
            </button>
          ))}
        </div>
      }
    >
      <div className="cockpit-widget-card" style={{ padding: 16 }}>
        <div className="relative z-10">
          <MetricForgePanel projectionMode={projectionMode} />
        </div>
      </div>
    </CockpitShell>
  );
}