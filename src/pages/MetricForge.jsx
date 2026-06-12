import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import CockpitShell from "@/components/shell/CockpitShell";
import MetricForgePanel from "@/components/redriver/MetricForgePanel";

export default function MetricForge() {
  const [, setLatestQuery] = useState(null);

  return (
    <CockpitShell
      icon={<SlidersHorizontal size={16} style={{ color: "var(--accent-primary)" }} />}
      title="Metric Forge"
      subtitle="Projection-safe metric series query workbench"
      topGlow="rgba(254,221,0,0.06)"
      bottomGlow="rgba(64,196,255,0.04)"
    >
      <div className="p-4">
        <MetricForgePanel
          projectionMode="projected"
          onQueryComplete={({ query }) => setLatestQuery(query)}
        />
      </div>
    </CockpitShell>
  );
}