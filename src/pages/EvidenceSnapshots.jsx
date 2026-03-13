import React from "react";
import EvidenceSnapshotsPanel from "@/components/redriver/EvidenceSnapshotsPanel";
import { usePlatform } from "@/platform/platformContext";

export default function EvidenceSnapshots() {
  const {
    latestForgeQuery,
    evidenceProjectionMode,
    updateEvidenceProjectionMode,
  } = usePlatform();

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
              Evidence Snapshots
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            {["projected", "internal"].map((mode) => (
              <button
                key={mode}
                onClick={() => updateEvidenceProjectionMode(mode)}
                className="px-3 py-1.5 rounded text-xs font-medium capitalize"
                style={{
                  background: evidenceProjectionMode === mode ? "rgba(64,196,255,0.12)" : "transparent",
                  color: evidenceProjectionMode === mode ? "var(--color-info)" : "var(--text-muted)",
                  border: evidenceProjectionMode === mode ? "1px solid rgba(64,196,255,0.3)" : "1px solid transparent",
                }}>
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-6xl mx-auto w-full">
        <EvidenceSnapshotsPanel
          projectionMode={evidenceProjectionMode}
          latestQuery={latestForgeQuery}
        />
      </div>
    </div>
  );
}
