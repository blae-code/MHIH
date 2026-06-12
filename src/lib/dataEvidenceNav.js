/**
 * Data & Evidence — cross-page navigation helpers
 *
 * Centralised builders for URLs that jump between related artefacts:
 *   metric ↔ source ↔ quality flag ↔ snapshot ↔ catalog entry
 *
 * Every Data & Evidence page should use these helpers so that:
 *   1. Query-param contracts stay consistent (metric_id, source_id, flag_id, …)
 *   2. Renaming a page only requires a one-line change here.
 *   3. Cross-jumps remain shareable URLs.
 */

import { createPageUrl } from "@/utils";

function withParams(pageName, params) {
  const base = createPageUrl(pageName);
  const qs = Object.entries(params || {})
    .filter(([, v]) => v != null && v !== "" && v !== "all")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `${base}?${qs}` : base;
}

// ── Page-targeted builders ─────────────────────────────────────────────────
export const navTo = {
  /** Data Repository, optionally pre-filtered */
  repository: (params) => withParams("DataRepository", params),

  /** Data Sources catalog, optionally focused on one source */
  sources: (params) => withParams("DataSources", params),

  /** Data Quality, optionally focused on a metric or flag */
  quality: (params) => withParams("DataQuality", params),

  /** Metric Catalog, optionally focused on one entry */
  catalog: (params) => withParams("MetricCatalog", params),

  /** Evidence Snapshots, optionally focused on a snapshot */
  snapshots: (params) => withParams("EvidenceSnapshots", params),

  /** Metric Forge */
  forge: (params) => withParams("MetricForge", params),

  /** Visualizations, optionally seeded with a metric */
  visualizations: (params) => withParams("Visualizations", params),

  /** Reports */
  reports: (params) => withParams("Reports", params),
};

// ── Convenience cross-jumps for a metric row ──────────────────────────────
export const metricCrossJumps = (m) => ({
  toSource: m?.data_source_id
    ? navTo.sources({ source_id: m.data_source_id })
    : null,
  toQuality: m?.id
    ? navTo.quality({ metric_id: m.id })
    : null,
  toSnapshot: m?.id
    ? navTo.snapshots({ metric_id: m.id, mode: "new" })
    : null,
  toCatalog: m?.id ? navTo.catalog({ metric_id: m.id }) : null,
  toVisualize: m?.id ? navTo.visualizations({ metric_id: m.id }) : null,
});