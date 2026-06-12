import React from "react";
import { SlidersHorizontal } from "lucide-react";
import CockpitShell from "@/components/shell/CockpitShell";
import InDevelopmentNotice from "@/components/shell/InDevelopmentNotice";

export default function MetricForge() {
  return (
    <CockpitShell
      icon={<SlidersHorizontal size={16} style={{ color: "var(--accent-primary)" }} />}
      title="Metric Forge"
      subtitle="Projection-safe metric series query workbench with deterministic guardrails"
      topGlow="rgba(254,221,0,0.06)"
      bottomGlow="rgba(64,196,255,0.04)"
    >
      <InDevelopmentNotice
        icon={SlidersHorizontal}
        accent="#FEDD00"
        title="Metric Forge"
        summary="An interactive series-query workbench with projection guardrails, filter composition, and snapshot handoff. The query engine depends on the same catalog layer being rebuilt in Phase 1."
        phase="Phase 1 · Data Foundation"
        blockers={[
          "Depends on api_queryMetricSeries (currently 404)",
          "Requires Metric Catalog to be live for metric picker",
          "Projection policy engine (_shared/projection) is not deployable as-is",
        ]}
        roadmap={[
          { label: "Hide broken UI behind in-development notice", status: "done" },
          { label: "Build query layer directly on HealthMetric entity", status: "in_progress" },
          { label: "Migrate projection rules to entity-level policy", status: "planned" },
          { label: "Re-enable with live data", status: "planned" },
        ]}
      />
    </CockpitShell>
  );
}