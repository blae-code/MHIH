import { ApiError } from '../http/errorEnvelope.ts';
import { applyProjection } from '../projection/applyProjection.ts';

function safeJson(value: any, fallback: any) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

async function listAll(entity: any, sort = '-updated_date', limit = 5000, maxPages = 20) {
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

function hasRestrictedMetrics(metricDefsById: Record<string, any>, metricIds: string[]) {
  return metricIds.some((id) => {
    const tier = String(metricDefsById[id]?.sensitivity_tier || 'public');
    return tier === 'restricted' || tier === 'sensitive';
  });
}

export async function loadSnapshotForMode(args: {
  base44: any;
  snapshotId: string;
  projectionMode: 'internal' | 'projected';
  principalScopes: string[];
}) {
  let snapshot = await args.base44.asServiceRole.entities.EvidenceSnapshot
    .filter({ snapshot_id: args.snapshotId }, '-created_date', 1)
    .catch(() => []);
  const row = snapshot?.[0] || null;
  if (!row) {
    throw new ApiError(`EvidenceSnapshot not found: ${args.snapshotId}`, 404, 'snapshot_not_found');
  }

  const query = safeJson(row.query, {});
  const data = safeJson(row.data, []);
  const series_manifest = safeJson(row.series_manifest, {});
  const render_manifest = safeJson(row.render_manifest, {});
  const artifacts = safeJson(row.artifacts, null);
  const metric_ids: string[] = Array.isArray(row.metric_ids) ? row.metric_ids : safeJson(row.metric_ids, []);
  const dataset_ids: string[] = Array.isArray(row.dataset_ids) ? row.dataset_ids : safeJson(row.dataset_ids, []);

  const metricDefs = await listAll(args.base44.asServiceRole.entities.MetricDefinition, '-updated_date', 5000, 20);
  const metricDefsById = Object.fromEntries(
    (metricDefs || []).map((m: any) => [String(m.metric_id), m]),
  );

  if (args.projectionMode === 'projected' && hasRestrictedMetrics(metricDefsById, metric_ids)) {
    if (!args.principalScopes.includes('rr_os:restricted')) {
      throw new ApiError(
        'Requested metrics require rr_os:restricted scope in projected mode',
        403,
        'insufficient_scope',
      );
    }
  }

  if (args.projectionMode === 'projected' && String(row.projection_mode || 'internal') === 'internal') {
    const projected = applyProjection({
      series: Array.isArray(data) ? data : [],
      metricDefsById,
      mode: 'projected',
    });
    return {
      snapshot: {
        snapshot_id: row.snapshot_id,
        title: row.title,
        query,
        metric_ids,
        dataset_ids,
        series_manifest: {
          ...series_manifest,
          projection_mode: 'projected',
        },
        data: projected.series,
        render_manifest,
        artifacts,
        projection_mode: 'projected',
        hash: row.hash,
        created_by: row.created_by,
        created_at: row.created_at,
      },
      projection_audit: projected.projection_audit,
    };
  }

  return {
    snapshot: {
      snapshot_id: row.snapshot_id,
      title: row.title,
      query,
      metric_ids,
      dataset_ids,
      series_manifest,
      data: Array.isArray(data) ? data : [],
      render_manifest,
      artifacts,
      projection_mode: String(row.projection_mode || args.projectionMode),
      hash: row.hash,
      created_by: row.created_by,
      created_at: row.created_at,
    },
    projection_audit: {
      projection_mode: String(row.projection_mode || args.projectionMode),
      suppressed_points: 0,
      rounded_points: 0,
      redacted_dimensions: [],
    },
  };
}
