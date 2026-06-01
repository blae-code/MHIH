import React, { useMemo, useState } from "react";
import { Database, SlidersHorizontal, Camera, Layers3 } from "lucide-react";
import CockpitShell from "@/components/shell/CockpitShell";
import ZoneHeader from "@/components/shell/ZoneHeader";
import MetricCatalogPanel from "@/components/redriver/MetricCatalogPanel";
import MetricForgePanel from "@/components/redriver/MetricForgePanel";
import EvidenceSnapshotsPanel from "@/components/redriver/EvidenceSnapshotsPanel";
import { usePlatform } from "@/platform/platformContext";

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

export default function RedRiverOS() {
  const [activeModule, setActiveModule] = useState("catalog");
  const {
    latestForgeQuery,
    setLatestForgeQuery,
    evidenceProjectionMode,
    updateEvidenceProjectionMode,
  } = usePlatform();

  const active = useMemo(() => MODULES.find((m) => m.key === activeModule) || MODULES[0], [activeModule]);

  return (
    <CockpitShell
      icon={<Layers3 size={16} style={{ color: "var(--color-info)" }} />}
      title="Red River OS Module"
      subtitle="Stable analytics boundary for catalog discovery, series forging, and evidence snapshots"
      topGlow="rgba(64,196,255,0.06)"
      bottomGlow="rgba(254,221,0,0.04)"
      actions={
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
          {["projected", "internal"].map((mode) => (
            <button
              key={mode}
              onClick={() => updateEvidenceProjectionMode(mode)}
              className="px-3 py-1.5 rounded text-xs font-medium capitalize transition-all"
              style={{
                background: evidenceProjectionMode === mode ? "rgba(64,196,255,0.12)" : "transparent",
                color: evidenceProjectionMode === mode ? "var(--color-info)" : "var(--text-muted)",
                border: evidenceProjectionMode === mode ? "1px solid rgba(64,196,255,0.3)" : "1px solid transparent",
              }}>
              {mode}
            </button>
          ))}
        </div>
      }
    >
      <div className="cockpit-zone-grid" style={{ gridTemplateColumns: "280px 1fr" }}>
        {/* Module rail */}
        <div className="cockpit-zone">
          <ZoneHeader
            label="Module"
            title="Module Rail"
            count={`${MODULES.length} tools`}
            hint="select a workspace"
          />
          <div className="cockpit-widget-card" style={{ padding: 12 }}>
            <div className="space-y-2 relative z-10">
              {MODULES.map((module) => {
                const isActive = activeModule === module.key;
                return (
                  <button
                    key={module.key}
                    onClick={() => setActiveModule(module.key)}
                    className="w-full text-left rounded-lg p-2.5 transition-all"
                    style={{
                      background: isActive ? "rgba(64,196,255,0.1)" : "var(--bg-overlay)",
                      border: `1px solid ${isActive ? "rgba(64,196,255,0.4)" : "var(--border-subtle)"}`,
                      boxShadow: isActive ? "0 0 16px rgba(64,196,255,0.12)" : "none",
                    }}>
                    <div className="flex items-center gap-2 mb-1">
                      <module.icon size={13} style={{ color: isActive ? "var(--color-info)" : "var(--text-muted)" }} />
                      <span className="text-xs font-semibold" style={{ color: isActive ? "var(--color-info)" : "var(--text-primary)" }}>{module.label}</span>
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{module.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active workspace */}
        <div className="cockpit-zone">
          <ZoneHeader
            label="Workspace"
            title={active.label}
            count={evidenceProjectionMode}
            hint={active.description}
          />
          <div className="cockpit-widget-card" style={{ padding: 16 }}>
            <div className="relative z-10">
              {activeModule === "catalog" && <MetricCatalogPanel />}
              {activeModule === "forge" && (
                <MetricForgePanel
                  projectionMode={evidenceProjectionMode}
                  onQueryComplete={({ query }) => setLatestForgeQuery(query)}
                />
              )}
              {activeModule === "snapshots" && (
                <EvidenceSnapshotsPanel
                  projectionMode={evidenceProjectionMode}
                  latestQuery={latestForgeQuery}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </CockpitShell>
  );
}