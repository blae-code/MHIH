import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { assertScopes } from './_shared/auth/assertScopes.ts';
import { createRequestId, ApiError, jsonError, jsonSuccess } from './_shared/http/errorEnvelope.ts';
import { assertRateLimit } from './_shared/http/rateLimit.ts';
import { logApiAudit } from './_shared/http/audit.ts';
import { createEvidenceSnapshotRequestSchema, parseOrThrow } from './_shared/redriverValidators.ts';
import { querySeries } from './_shared/forge/querySeries.ts';
import { applyProjection } from './_shared/projection/applyProjection.ts';

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

function hasRestrictedMetrics(metricDefsById: Record<string, any>, metricIds: string[]) {
  return metricIds.some((id) => {
    const tier = String(metricDefsById[id]?.sensitivity_tier || 'public');
    return tier === 'restricted' || tier === 'sensitive';
  });
}

Deno.serve(async (req) => {
  const requestId = createRequestId();
  const base44 = createClientFromRequest(req);
  let principalId = 'anonymous';
  let principalType = 'unknown';
  let principalScopes: string[] = [];

  try {
    const principal = await assertScopes(req, ['rr_os:snapshots']);
    principalId = principal.principal_id;
    principalType = principal.principal_type;
    principalScopes = principal.scopes;
    assertRateLimit({ bucket: 'rr_snapshot_create', principalId, limit: 20 });

    const body = await req.json().catch(() => ({}));
    const input = parseOrThrow(createEvidenceSnapshotRequestSchema, body);
    const projectionMode = input.projection_mode || input.query.projection_mode || 'projected';
    const queryInput = {
      ...input.query,
      projection_mode: projectionMode,
    };

    const raw = await querySeries(base44, queryInput);
    if (projectionMode === 'projected' && hasRestrictedMetrics(raw.metric_defs_by_id, queryInput.metric_ids)) {
      if (!principalScopes.includes('rr_os:restricted')) {
        throw new ApiError(
          'Requested metrics require rr_os:restricted scope in projected mode',
          403,
          'insufficient_scope',
        );
      }
    }

    const projected = applyProjection({
      series: raw.series,
      metricDefsById: raw.metric_defs_by_id,
      mode: projectionMode,
    });

    const hash = await sha256Hex(stableStringify({
      title: input.title,
      query: queryInput,
      manifest: raw.manifest,
      projection_audit: projected.projection_audit,
      series: projected.series,
      projection_mode: projectionMode,
    }));

    const existing = await base44.asServiceRole.entities.EvidenceSnapshot
      .filter({ hash }, '-created_date', 1)
      .catch(() => []);
    if (existing?.[0]) {
      return jsonSuccess(
        {
          snapshot_id: existing[0].snapshot_id || existing[0].id,
          hash,
          reused: true,
        },
        requestId,
      );
    }

    const snapshotId = `snap_${hash.slice(0, 16)}`;
    const createdAt = new Date().toISOString();
    const created = await base44.asServiceRole.entities.EvidenceSnapshot
      .create({
        snapshot_id: snapshotId,
        title: input.title,
        query: queryInput,
        metric_ids: queryInput.metric_ids,
        dataset_ids: raw.manifest.dataset_ids,
        series_manifest: {
          ...raw.manifest,
          projection_mode: projectionMode,
        },
        data: projected.series,
        render_manifest: {
          source: 'api_createEvidenceSnapshot',
          warnings: raw.warnings,
        },
        artifacts: input.artifacts || null,
        projection_mode: projectionMode,
        hash,
        created_by: principalType === 'user' ? principalId : `service:${principalId}`,
        created_at: createdAt,
      })
      .catch((error: any) => {
        throw new ApiError(
          'EvidenceSnapshot entity is unavailable. Configure Base44 schema before using this endpoint.',
          500,
          'missing_entity',
          { entity: 'EvidenceSnapshot', cause: String(error?.message || error) },
        );
      });

    await logApiAudit(base44, {
      action: 'rr_os_snapshot_create',
      principalId,
      principalType,
      requestId,
      endpoint: 'api_createEvidenceSnapshot',
      status: 'success',
      details: {
        snapshot_id: created?.snapshot_id || snapshotId,
        projection_mode: projectionMode,
        metric_ids: queryInput.metric_ids,
      },
    });

    return jsonSuccess(
      {
        snapshot_id: created?.snapshot_id || snapshotId,
        hash,
      },
      requestId,
    );
  } catch (error) {
    await logApiAudit(base44, {
      action: 'rr_os_snapshot_create',
      principalId,
      principalType,
      requestId,
      endpoint: 'api_createEvidenceSnapshot',
      status: 'error',
      details: { message: String((error as any)?.message || error) },
    });
    return jsonError(error, requestId);
  }
});
