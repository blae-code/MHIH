import React from "react";
import { Database } from "lucide-react";
import CockpitShell from "@/components/shell/CockpitShell";
import MetricCatalogPanel from "@/components/redriver/MetricCatalogPanel";

export default function MetricCatalog() {
  return (
    <CockpitShell
      icon={<Database size={16} style={{ color: "var(--color-info)" }} />}
      title="Metric Catalog"
      subtitle="Dataset manifests, metric definitions, and ownership across the analytics boundary"
      topGlow="rgba(64,196,255,0.06)"
      bottomGlow="rgba(254,221,0,0.04)"
    >
      <div className="cockpit-widget-card" style={{ padding: 16 }}>
        <div className="relative z-10">
          <MetricCatalogPanel />
        </div>
      </div>
    </CockpitShell>
  );
}