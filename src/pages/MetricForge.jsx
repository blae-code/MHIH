import React, { useState } from "react";
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
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--bg-surface) 0%, #0d1f2a 50%, var(--bg-elevated) 100%)",
          borderColor: "var(--border-default)",
        }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="dashboard-section-label">Red River OS</div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Metric Forge
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            {["projected", "internal"].map((mode) => (
              <button
                key={mode}
                onClick={() => updateMode(mode)}
                className="px-3 py-1.5 rounded text-xs font-medium capitalize"
                style={{
                  background: projectionMode === mode ? "rgba(64,196,255,0.12)" : "transparent",
                  color: projectionMode === mode ? "var(--color-info)" : "var(--text-muted)",
                  border: projectionMode === mode ? "1px solid rgba(64,196,255,0.3)" : "1px solid transparent",
                }}>
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-6xl mx-auto w-full">
        <MetricForgePanel projectionMode={projectionMode} />
      </div>
    </div>
  );
}
