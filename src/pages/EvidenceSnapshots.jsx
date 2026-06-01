import React from "react";
import { Camera } from "lucide-react";
import CockpitShell from "@/components/shell/CockpitShell";
import EvidenceSnapshotsPanel from "@/components/redriver/EvidenceSnapshotsPanel";
import { usePlatform } from "@/platform/platformContext";

export default function EvidenceSnapshots() {
  const {
    latestForgeQuery,
    evidenceProjectionMode,
    updateEvidenceProjectionMode,
  } = usePlatform();

  return (
    <CockpitShell
      icon={<Camera size={16} style={{ color: "var(--color-info)" }} />}
      title="Evidence Snapshots"
      subtitle="Deterministic snapshot, version, and export workspace for analytic outputs"
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
      <div className="cockpit-widget-card" style={{ padding: 16 }}>
        <div className="relative z-10">
          <EvidenceSnapshotsPanel
            projectionMode={evidenceProjectionMode}
            latestQuery={latestForgeQuery}
          />
        </div>
      </div>
    </CockpitShell>
  );
}