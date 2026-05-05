import { ApiError } from '../http/errorEnvelope.ts';

type QueryInput = {
  metric_ids: string[];
  filters?: Record<string, unknown>;
  time: {
    from: number;
    to: number;
  };
  projection_mode: 'internal' | 'projected';
};

type MetricDefinition = {
  id: string;
  metric_id: string;
  name: string;
  category?: string;
  value_type?: string;
  dataset_ids?: string[];
  dimensions?: Array<{ key: string }>;
  default_filters?: Record<string, unknown>;
  suppression?: Record<string, unknown>;
};

type HealthMetricRow = {
  id: string;
  metric_id?: string;
  dataset_id?: string;
  dimensions?: Record<string, unknown>;
  name?: string;
  category?: string;
  region?: string;
  year?: number;
  value?: number | string;
  n?: number;
  suppression_applied?: boolean;
  suppression_reason?: string;
};

function stableStringify(value: any): string {
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `"${k}":${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function listAll(entity: any, sort = '-updated_date', limit = 5000, maxPages = 30) {
  const all = [];
  let skip = 0;
  for (let page = 0; page < maxPages; page += 1) {
    const batch = await entity.list(sort, limit, skip).catch(() => []);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < limit) break;
    skip += batch.length;
  }
  return all;
}

function normalize(value: any) {
  return String(value || '').trim().toLowerCase();
}

function extractDimensionValue(row: HealthMetricRow, key: string) {
  if (row?.dimensions && typeof row.dimensions === 'object' && key in row.dimensions) {
    return row.dimensions[key];
  }
  return (row as any)?.[key];
}

function filterRow(row: HealthMetricRow, filters: Record<string, unknown>, yearFrom: number, yearTo: number) {
  const year = Number(row.year);
  if (!Number.isFinite(year) || year < yearFrom || year > yearTo) return false;
  if (row.value == null) return false;

  for (const [key, value] of Object.entries(filters || {})) {
    if (value == null || value === '' || String(value).toLowerCase() === 'all') continue;
    const rowValue = extractDimensionValue(row, key);
    if (String(rowValue) !== String(value)) return false;
  }
  return true;
}

function dimensionKey(dimensions: Record<string, unknown>, order: string[]) {
  if (!order.length) return 'all';
  return order.map((key) => `${key}:${String(dimensions[key] ?? 'all')}`).join('|');
}

function buildManifest(args: {
  query: QueryInput;
  series: any[];
  metricDefs: MetricDefinition[];
  datasetIds: string[];
  dimensionKeys: string[];
}) {
  const totalPoints = args.series.reduce((sum, row) => sum + (Array.isArray(row.points) ? row.points.length : 0), 0);
  return {
    metric_ids: args.query.metric_ids,
    dataset_ids: args.datasetIds,
    dimension_keys: args.dimensionKeys,
    projection_mode: args.query.projection_mode,
    time: args.query.time,
    total_series: args.series.length,
    total_points: totalPoints,
    generated_at: new Date().toISOString(),
    metric_versions: args.metricDefs.map((d) => ({ metric_id: d.metric_id, id: d.id, name: d.name })),
  };
}

export async function querySeries(base44: any, query: QueryInput) {
  const metricIds = Array.from(new Set(query.metric_ids || [])).filter(Boolean);
  if (!metricIds.length) {
    throw new ApiError('metric_ids is required', 400, 'invalid_request');
  }
  if (!query?.time?.from || !query?.time?.to) {
    throw new ApiError('time.from and time.to are required', 400, 'invalid_request');
  }
  if (query.time.from > query.time.to) {
    throw new ApiError('time.from must be <= time.to', 400, 'invalid_request');
  }

  const metricDefsRaw: MetricDefinition[] = await listAll(base44.asServiceRole.entities.MetricDefinition, '-updated_date', 5000, 20);
  const metricDefs = metricDefsRaw.filter((m) => metricIds.includes(String(m.metric_id)));
  const missing = metricIds.filter((id) => !metricDefs.find((m) => String(m.metric_id) === String(id)));
  if (missing.length) {
    throw new ApiError(`Unknown metric_id(s): ${missing.join(', ')}`, 404, 'metric_not_found', { missing_metric_ids: missing });
  }

  const observations: HealthMetricRow[] = await listAll(base44.asServiceRole.entities.HealthMetric, '-year', 5000, 50);
  const warnings: string[] = [];
  const seriesRows: any[] = [];
  const datasetIds = new Set<string>();
  const allDimensionKeys = new Set<string>();

  for (const def of metricDefs) {
    const defDatasetIds = Array.isArray(def.dataset_ids) ? def.dataset_ids : [];
    defDatasetIds.forEach((id) => datasetIds.add(String(id)));
    const dimensionOrder = Array.isArray(def.dimensions) ? def.dimensions.map((d: any) => String(d.key)) : [];
    dimensionOrder.forEach((key) => allDimensionKeys.add(key));

    const byMetricId = observations.filter((row) => normalize(row.metric_id) === normalize(def.metric_id));
    let matchedRows = byMetricId;
    if (!matchedRows.length) {
      matchedRows = observations.filter((row) =>
        normalize(row.name) === normalize(def.name)
        && (!def.category || normalize(row.category) === normalize(def.category)));
      if (matchedRows.length) {
        warnings.push(`metric_id missing in observations for ${def.metric_id}; fell back to name/category mapping`);
      }
    }

    const filteredRows = matchedRows.filter((row) => filterRow(row, query.filters || {}, query.time.from, query.time.to));
    const groupMap = new Map<string, any>();

    for (const row of filteredRows) {
      const dims: Record<string, unknown> = {};
      for (const key of dimensionOrder) {
        dims[key] = extractDimensionValue(row, key) ?? 'all';
      }
      const key = dimensionKey(dims, dimensionOrder);
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          metric_id: def.metric_id,
          metric_name: def.name,
          dataset_ids: defDatasetIds,
          series_key: key,
          dimensions: dims,
          points: [],
        });
      }
      const numericValue = typeof row.value === 'number' ? row.value : Number(row.value);
      const normalizedValue = Number.isFinite(numericValue) ? numericValue : row.value ?? null;

      groupMap.get(key).points.push({
        year: Number(row.year),
        value: normalizedValue,
        n: row.n ?? null,
        suppression_applied: Boolean(row.suppression_applied),
        suppression_reason: row.suppression_reason || null,
        dimensions: row.dimensions || undefined,
      });
    }

    for (const value of groupMap.values()) {
      value.points.sort((a: any, b: any) => a.year - b.year);
      seriesRows.push(value);
    }
  }

  const manifest = buildManifest({
    query,
    series: seriesRows,
    metricDefs,
    datasetIds: Array.from(datasetIds),
    dimensionKeys: Array.from(allDimensionKeys),
  });
  const hash = await sha256Hex(stableStringify({
    metric_ids: manifest.metric_ids,
    dataset_ids: manifest.dataset_ids,
    dimension_keys: manifest.dimension_keys,
    projection_mode: manifest.projection_mode,
    time: manifest.time,
    total_series: manifest.total_series,
    total_points: manifest.total_points,
    query_filters: query.filters || {},
    series: seriesRows,
  }));

  return {
    series: seriesRows,
    manifest: {
      ...manifest,
      hash,
    },
    metric_defs_by_id: Object.fromEntries(metricDefs.map((def) => [String(def.metric_id), def])),
    warnings,
  };
}
