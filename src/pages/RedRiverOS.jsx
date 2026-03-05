import React, { useMemo, useState } from "react";
import { Database, SlidersHorizontal, Camera, Layers3 } from "lucide-react";
import MetricCatalogPanel from "@/components/redriver/MetricCatalogPanel";
import MetricForgePanel from "@/components/redriver/MetricForgePanel";
import EvidenceSnapshotsPanel from "@/components/redriver/EvidenceSnapshotsPanel";

const MODULES = [
  {
    key: "catalog",
    label: "Metric Catalog",
    description: "Dataset manifests and metric definitions",
    icon: Database,
  },
  {
    key: "forge",
    label: "Metric Forge",
    description: "Projection-safe series query builder",
    icon: SlidersHorizontal,
  },
  {
    key: "snapshots",
    label: "Evidence Snapshots",
    description: "Deterministic snapshot and export workspace",
    icon: Camera,
  },
];

function loadProjectionMode() {
  try {
    const stored = localStorage.getItem("rr_projection_mode");
    if (stored === "internal" || stored === "projected") return stored;
  } catch {}
  return "projected";
}

export default function RedRiverOS() {
  const [activeModule, setActiveModule] = useState("catalog");
  const [projectionMode, setProjectionMode] = useState(loadProjectionMode);
  const [latestQuery, setLatestQuery] = useState(null);

  const active = useMemo(() => MODULES.find((m) => m.key === activeModule) || MODULES[0], [activeModule]);

  const updateProjectionMode = (mode) => {
    setProjectionMode(mode);
    try {
      localStorage.setItem("rr_projection_mode", mode);
    } catch {}
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--bg-surface) 0%, #0d1f2a 45%, var(--bg-elevated) 100%)",
          borderColor: "var(--border-default)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(64,196,255,0.12)",
        }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #40c4ff 0%, #FEDD00 60%, transparent 100%)" }} />
        <div className="flex items-center justify-between">
          <div>
            <div className="dashboard-section-label">Red River OS Module</div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Stable analytics boundary for catalog discovery, series forging, and evidence snapshots.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            {["projected", "internal"].map((mode) => (
              <button
                key={mode}
                onClick={() => updateProjectionMode(mode)}
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

      <div className="flex-1 overflow-hidden p-6">
        <div className="grid lg:grid-cols-[280px_1fr] gap-4 h-full">
          <div className="rounded-xl p-3 overflow-auto" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Layers3 size={14} style={{ color: "var(--color-info)" }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Module Rail</span>
            </div>

            <div className="space-y-2">
              {MODULES.map((module) => (
                <button
                  key={module.key}
                  onClick={() => setActiveModule(module.key)}
                  className="w-full text-left rounded-lg p-2.5 transition-all"
                  style={{
                    background: activeModule === module.key ? "rgba(64,196,255,0.1)" : "var(--bg-overlay)",
                    border: `1px solid ${activeModule === module.key ? "rgba(64,196,255,0.28)" : "var(--border-subtle)"}`,
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <module.icon size={13} style={{ color: activeModule === module.key ? "var(--color-info)" : "var(--text-muted)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{module.label}</span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{module.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl overflow-auto p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <div className="mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{active.label}</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{active.description}</p>
            </div>

            {activeModule === "catalog" && <MetricCatalogPanel />}
            {activeModule === "forge" && (
              <MetricForgePanel
                projectionMode={projectionMode}
                onQueryComplete={({ query }) => setLatestQuery(query)}
              />
            )}
            {activeModule === "snapshots" && (
              <EvidenceSnapshotsPanel
                projectionMode={projectionMode}
                latestQuery={latestQuery}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
