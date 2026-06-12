import React from "react";
import { Camera } from "lucide-react";
import CockpitShell from "@/components/shell/CockpitShell";
import InDevelopmentNotice from "@/components/shell/InDevelopmentNotice";

export default function EvidenceSnapshots() {
  return (
    <CockpitShell
      icon={<Camera size={16} style={{ color: "var(--color-info)" }} />}
      title="Evidence Snapshots"
      subtitle="Deterministic snapshot, version, and export workspace for analytic outputs"
      topGlow="rgba(64,196,255,0.06)"
      bottomGlow="rgba(254,221,0,0.04)"
    >
      <InDevelopmentNotice
        icon={Camera}
        accent="#40c4ff"
        title="Evidence Snapshots"
        summary="Freeze a Metric Forge query as a versioned, exportable artifact (JSON, CSV, PDF). Used for evidence chains in policy memos and ministerial briefings. Awaits the rebuilt query layer to capture from."
        phase="Phase 1 · Data Foundation"
        blockers={[
          "Depends on Metric Forge to produce a query to capture",
          "EvidenceSnapshot entity not yet provisioned",
          "api_createEvidenceSnapshot / api_getEvidenceSnapshot / api_exportEvidenceSnapshot return 404",
        ]}
        roadmap={[
          { label: "Hide broken UI behind in-development notice", status: "done" },
          { label: "Provision EvidenceSnapshot entity", status: "planned" },
          { label: "Rebuild create/get/export on direct SDK (no backend functions)", status: "planned" },
          { label: "Re-enable with live capture from Metric Forge", status: "planned" },
        ]}
      />
    </CockpitShell>
  );
}