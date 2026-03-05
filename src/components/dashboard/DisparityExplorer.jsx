import React, { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { getMetricDirection, isHarmfulGap } from "@/lib/metricSemantics";

export default function DisparityExplorer({ metrics = [], trackedMetricIds = [] }) {
  const rows = useMemo(() => {
    const scoped = (trackedMetricIds?.length
      ? metrics.filter((m) => trackedMetricIds.includes(m.id))
      : metrics
    ).filter((m) => m.value != null && m.comparison_value != null);

    return scoped
      .map((m) => {
        const gap = Number(m.value) - Number(m.comparison_value);
        const direction = getMetricDirection(m);
        const harmful = isHarmfulGap(gap, direction);
        return {
          id: m.id,
          name: m.name,
          category: m.category,
          region: m.region || "BC",
          year: m.year,
          direction,
          gap: Number(gap.toFixed(2)),
          harmful,
          burden: harmful ? Math.abs(gap) : 0,
          metis: Number(m.value),
          benchmark: Number(m.comparison_value),
        };
      })
      .sort((a, b) => b.burden - a.burden)
      .slice(0, 10);
  }, [metrics, trackedMetricIds]);

  return (
    <div className="dashboard-widget-card">
      <div className="dashboard-section-label mb-2">Disparity Explorer</div>
      <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
        Highest harmful gaps versus BC benchmark (semantics-aware)
      </div>

      {rows.length === 0 ? (
        <div className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>
          No comparable metrics available.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-lg p-2.5 flex items-center justify-between gap-3"
              style={{
                background: row.harmful ? "rgba(255,71,87,0.08)" : "var(--bg-overlay)",
                border: `1px solid ${row.harmful ? "rgba(255,71,87,0.25)" : "var(--border-subtle)"}`,
              }}
            >
              <div className="min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }} title={row.name}>
                  {row.name}
                </div>
                <div className="text-xs mt-1 truncate" style={{ color: "var(--text-muted)" }}>
                  {row.category?.replace(/_/g, " ")} · {row.region} · {row.year}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold" style={{ color: row.harmful ? "#f85149" : "#2ea043" }}>
                  {row.gap > 0 ? "+" : ""}
                  {row.gap.toFixed(2)}
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {row.harmful ? "harmful gap" : "non-harmful"}
                </div>
              </div>
            </div>
          ))}
          <div className="text-[10px] flex items-center gap-1.5 mt-1" style={{ color: "var(--text-muted)" }}>
            <AlertTriangle size={11} />
            Metric direction is inferred from metadata/name where explicit semantics are absent.
          </div>
        </div>
      )}
    </div>
  );
}
