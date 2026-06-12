import React from "react";
import { Database } from "lucide-react";
import CockpitShell from "@/components/shell/CockpitShell";
import InDevelopmentNotice from "@/components/shell/InDevelopmentNotice";

export default function MetricCatalog() {
  return (
    <CockpitShell
      icon={<Database size={16} style={{ color: "var(--color-info)" }} />}
      title="Metric Catalog"
      subtitle="Dataset manifests, metric definitions, and ownership across the analytics boundary"
      topGlow="rgba(64,196,255,0.06)"
      bottomGlow="rgba(254,221,0,0.04)"
    >
      <InDevelopmentNotice
        icon={Database}
        accent="#40c4ff"
        title="Metric Catalog"
        summary="A canonical browser for dataset manifests, metric definitions, ownership, and projection policies. Currently being rebuilt on the live HealthMetric + DataSource model rather than the abandoned catalog-filesystem scaffold."
        phase="Phase 1 · Data Foundation"
        blockers={[
          "Aspirational entities (MetricDefinition, DatasetManifest) were never provisioned",
          "Backend functions api_listMetrics / api_listDatasets / syncCatalog return 404 due to broken local imports",
          "Catalog filesystem (functions/_shared/catalog) does not deploy with backend functions",
        ]}
        roadmap={[
          { label: "Hide broken UI behind in-development notice", status: "done" },
          { label: "Refactor panel to derive schema from HealthMetric + DataSource", status: "in_progress" },
          { label: "Decommission dead api_* + syncCatalog functions", status: "planned" },
          { label: "Re-enable in nav with live data", status: "planned" },
        ]}
      />
    </CockpitShell>
  );
}