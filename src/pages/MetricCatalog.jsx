import React from "react";
import MetricCatalogPanel from "@/components/redriver/MetricCatalogPanel";

export default function MetricCatalog() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--bg-surface) 0%, #0d1f2a 50%, var(--bg-elevated) 100%)",
          borderColor: "var(--border-default)",
        }}>
        <div className="dashboard-section-label">Red River OS</div>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Metric Catalog
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-6xl mx-auto w-full">
        <MetricCatalogPanel />
      </div>
    </div>
  );
}
