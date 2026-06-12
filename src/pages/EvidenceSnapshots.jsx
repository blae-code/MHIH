import React from "react";
import { Camera } from "lucide-react";
import CockpitShell from "@/components/shell/CockpitShell";
import EvidenceSnapshotsPanel from "@/components/redriver/EvidenceSnapshotsPanel";

export default function EvidenceSnapshots() {
  return (
    <CockpitShell
      icon={<Camera size={16} style={{ color: "var(--color-info)" }} />}
      title="Evidence Snapshots"
      subtitle="Freeze, version, and export deterministic query artifacts"
      topGlow="rgba(64,196,255,0.06)"
      bottomGlow="rgba(254,221,0,0.04)"
    >
      <div className="p-4">
        <EvidenceSnapshotsPanel projectionMode="projected" />
      </div>
    </CockpitShell>
  );
}