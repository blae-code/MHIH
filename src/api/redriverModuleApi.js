/**
 * Red River Module API — Phase 1 SDK-direct layer
 *
 * Replaces the dead `api_*` / `syncCatalog` backend-function tree with direct
 * Base44 SDK calls against the canonical `HealthMetric`, `DataSource`, and
 * `EvidenceSnapshot` entities.
 *
 * Design principles:
 *  - No backend functions. No _shared filesystem catalog. No 404s.
 *  - "Datasets" are derived from DataSource rows.
 *  - "Metrics" are derived by grouping HealthMetric rows by name+category.
 *  - Series queries pull HealthMetric rows and pivot by region/year.
 *  - Snapshots are EvidenceSnapshot entity records with frozen series data.
 */

import { base44 } from "@/api/base44Client";

// ── Helpers ──────────────────────────────────────────────────────────────

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function metricIdFor(metric) {
  // Stable derived id from name + category so the same metric across regions/years collapses.
  return `${metric.category || "uncategorized"}.${slugify(metric.name)}`;
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter((v) => v != null && String(v).trim()))).sort();
}

// ── Datasets ─────────────────────────────────────────────────────────────

export async function listDatasets({ includeDeprecated = false } = {}) {
  const sources = await base44.entities.DataSource.list("-updated_date", 500);
  const filtered = includeDeprecated
    ? sources
    : sources.filter((s) => s.status !== "inactive");

  const datasets = filtered.map((s) => ({
    dataset_id: s.id,
    name: s.name,
    description: s.description || "",
    category: s.category || "other",
    region: s.region || "BC",
    type: s.type,
    medium: s.medium || "dataset",
    status: s.status || "pending",
    record_count: s.record_count || 0,
    last_synced: s.last_synced || null,
    sync_frequency: s.sync_frequency || "manual",
    url: s.url || "",
  }));

  return { datasets, total: datasets.length };
}

// ── Metrics ──────────────────────────────────────────────────────────────

/**
 * List metric definitions derived from HealthMetric rows.
 * Groups by (category, name) so the catalog is canonical rather than per-row.
 */
export async function listMetrics({ status = "active", category = null, dataset_id = null } = {}) {
  const rows = await base44.entities.HealthMetric.list("-year", 4000);

  const groups = new Map();
  for (const row of rows) {
    if (category && row.category !== category) continue;
    if (dataset_id && row.data_source_id !== dataset_id) continue;

    const id = metricIdFor(row);
    if (!groups.has(id)) {
      groups.set(id, {
        metric_id: id,
        name: row.name,
        category: row.category,
        subcategory: row.subcategory || null,
        unit: row.unit || "",
        description: row.description || "",
        direction: "neutral",
        version: 1,
        status: "active",
        dataset_ids: new Set(),
        regions: new Set(),
        years: new Set(),
        row_count: 0,
        dimensions: [
          { key: "region", allowed_values: new Set() },
        ],
      });
    }
    const group = groups.get(id);
    if (row.data_source_id) group.dataset_ids.add(row.data_source_id);
    if (row.region) {
      group.regions.add(row.region);
      group.dimensions[0].allowed_values.add(row.region);
    }
    if (row.year != null) group.years.add(row.year);
    group.row_count += 1;
  }

  const metrics = Array.from(groups.values()).map((g) => ({
    metric_id: g.metric_id,
    name: g.name,
    category: g.category,
    subcategory: g.subcategory,
    unit: g.unit,
    description: g.description,
    direction: g.direction,
    version: g.version,
    status: g.status,
    dataset_ids: Array.from(g.dataset_ids),
    regions: Array.from(g.regions).sort(),
    years: Array.from(g.years).sort((a, b) => a - b),
    row_count: g.row_count,
    dimensions: g.dimensions.map((d) => ({
      key: d.key,
      allowed_values: Array.from(d.allowed_values).sort(),
    })),
  }));

  metrics.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return { metrics, total: metrics.length };
}

// ── Series Query ─────────────────────────────────────────────────────────

/**
 * Pivot HealthMetric rows into series keyed by metric + region.
 * Honors filters.region and time.from / time.to.
 */
export async function queryMetricSeries({ metric_ids = [], filters = {}, time = {}, projection_mode = "projected" } = {}) {
  if (!metric_ids.length) {
    return {
      series: [],
      manifest: { total_series: 0, total_points: 0, metric_ids: [], regions: [] },
      projection_mode,
    };
  }

  const rows = await base44.entities.HealthMetric.list("-year", 4000);
  const wantedIds = new Set(metric_ids);
  const fromYear = time.from != null ? Number(time.from) : -Infinity;
  const toYear = time.to != null ? Number(time.to) : Infinity;
  const regionFilter = filters.region || null;

  const seriesMap = new Map();
  for (const row of rows) {
    const id = metricIdFor(row);
    if (!wantedIds.has(id)) continue;
    if (regionFilter && row.region !== regionFilter) continue;
    if (row.year < fromYear || row.year > toYear) continue;

    const key = `${id}::${row.region || "BC"}`;
    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        metric_id: id,
        metric_name: row.name,
        category: row.category,
        unit: row.unit || "",
        series_key: row.region || "BC",
        region: row.region || "BC",
        points: [],
      });
    }
    seriesMap.get(key).points.push({ year: row.year, value: row.value });
  }

  const series = Array.from(seriesMap.values()).map((s) => ({
    ...s,
    points: s.points.sort((a, b) => a.year - b.year),
  }));

  const totalPoints = series.reduce((sum, s) => sum + s.points.length, 0);
  const regions = uniqueSorted(series.map((s) => s.region));

  return {
    series,
    manifest: {
      total_series: series.length,
      total_points: totalPoints,
      metric_ids: Array.from(new Set(series.map((s) => s.metric_id))),
      regions,
    },
    projection_mode,
  };
}

// ── Evidence Snapshots ───────────────────────────────────────────────────

function makeSnapshotId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8);
  return `snap_${y}_${m}_${day}_${rand}`;
}

export async function createEvidenceSnapshot({ title, query, projection_mode = "projected" }) {
  const queryResult = await queryMetricSeries({ ...query, projection_mode });
  const user = await base44.auth.me().catch(() => null);

  const snapshot_id = makeSnapshotId();
  const payload = {
    snapshot_id,
    title: title || "Red River Snapshot",
    query: { ...query, projection_mode },
    projection_mode,
    series_manifest: queryResult.manifest,
    data: queryResult.series,
    captured_by_email: user?.email || "",
    captured_by_name: user?.full_name || "",
  };

  const created = await base44.entities.EvidenceSnapshot.create(payload);
  return { snapshot_id, snapshot: created };
}

export async function getEvidenceSnapshot({ snapshot_id }) {
  // snapshot_id may be the entity id OR the derived snapshot_id field.
  const byField = await base44.entities.EvidenceSnapshot.filter({ snapshot_id }, "-created_date", 1);
  const snapshot = byField[0] || null;
  if (!snapshot) {
    throw new Error(`Snapshot ${snapshot_id} not found`);
  }
  return { snapshot };
}

// ── Export ───────────────────────────────────────────────────────────────

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function buildCsv(snapshot) {
  const header = ["metric_id", "metric_name", "region", "year", "value", "unit"];
  const rows = [header.join(",")];
  for (const series of snapshot.data || []) {
    for (const point of series.points || []) {
      rows.push([
        series.metric_id,
        JSON.stringify(series.metric_name || ""),
        series.region || "",
        point.year,
        point.value,
        series.unit || "",
      ].join(","));
    }
  }
  return rows.join("\n");
}

function buildJson(snapshot) {
  return JSON.stringify({
    snapshot_id: snapshot.snapshot_id,
    title: snapshot.title,
    projection_mode: snapshot.projection_mode,
    captured_at: snapshot.created_date,
    captured_by: snapshot.captured_by_email,
    query: snapshot.query,
    manifest: snapshot.series_manifest,
    data: snapshot.data,
  }, null, 2);
}

function buildPdf(snapshot) {
  // Minimal text-only PDF — built without dependencies. For richer PDFs use
  // jspdf at the call site; this keeps the API layer lightweight.
  const lines = [
    `Evidence Snapshot: ${snapshot.title}`,
    `ID: ${snapshot.snapshot_id}`,
    `Captured: ${snapshot.created_date || ""}`,
    `Mode: ${snapshot.projection_mode}`,
    `Series: ${snapshot.series_manifest?.total_series || 0} · Points: ${snapshot.series_manifest?.total_points || 0}`,
    "",
  ];
  for (const s of (snapshot.data || []).slice(0, 40)) {
    lines.push(`${s.metric_name || s.metric_id} (${s.region}) — ${s.points?.length || 0} points`);
  }
  const text = lines.join("\n");

  // Tiny single-page PDF wrapper
  const content = `BT /F1 10 Tf 40 760 Td (${text.replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\n/g, ") Tj T* (")}) Tj ET`;
  const pdf = [
    "%PDF-1.3",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    "trailer << /Root 1 0 R /Size 6 >>",
    "%%EOF",
  ].join("\n");

  const bytes = new TextEncoder().encode(pdf);
  return bytes;
}

export async function exportEvidenceSnapshot({ snapshot_id, format = "json" }) {
  const { snapshot } = await getEvidenceSnapshot({ snapshot_id });
  const safeTitle = slugify(snapshot.title) || snapshot.snapshot_id;

  if (format === "csv") {
    const csv = buildCsv(snapshot);
    return {
      file_name: `${safeTitle}.csv`,
      mime_type: "text/csv",
      content_base64: bytesToBase64(new TextEncoder().encode(csv)),
    };
  }
  if (format === "pdf") {
    const bytes = buildPdf(snapshot);
    return {
      file_name: `${safeTitle}.pdf`,
      mime_type: "application/pdf",
      content_base64: bytesToBase64(bytes),
    };
  }
  // default: json
  const json = buildJson(snapshot);
  return {
    file_name: `${safeTitle}.json`,
    mime_type: "application/json",
    content_base64: bytesToBase64(new TextEncoder().encode(json)),
  };
}

// ── Catalog "sync" — no-op compatibility ─────────────────────────────────

/**
 * Legacy hook for the Sync Catalog button. With the entity-direct model the
 * catalog is always live — there's nothing to sync. We return a successful
 * envelope so the existing UI continues to work without modification.
 */
export async function syncCatalog() {
  const [datasets, metrics] = await Promise.all([
    listDatasets(),
    listMetrics({ status: "active" }),
  ]);
  return {
    success: true,
    counts: {
      datasets_upserted: datasets.total,
      metrics_upserted: metrics.total,
    },
    mode: "live",
    note: "Catalog is derived live from entities; no sync required.",
  };
}