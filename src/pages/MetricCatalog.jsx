import React from "react";
import { Database } from "lucide-react";
import CockpitShell from "@/components/shell/CockpitShell";
import MetricCatalogPanel from "@/components/redriver/MetricCatalogPanel";

export default function MetricCatalog() {
  return (
    <CockpitShell
      icon={<Database size={16} style={{ color: "var(--color-info)" }} />}
      title="Metric Catalog"
      subtitle="Canonical metric definitions derived live from HealthMetric + DataSource"
      topGlow="rgba(64,196,255,0.06)"
      bottomGlow="rgba(254,221,0,0.04)"
    >
      <div className="p-4">
        <MetricCatalogPanel />
      </div>
    </CockpitShell>
  );
}