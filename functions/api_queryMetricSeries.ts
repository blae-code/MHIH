import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { assertScopes } from './_shared/auth/assertScopes.ts';
import { createRequestId, ApiError, jsonError, jsonSuccess } from './_shared/http/errorEnvelope.ts';
import { assertRateLimit } from './_shared/http/rateLimit.ts';
import { logApiAudit } from './_shared/http/audit.ts';
import { parseOrThrow, queryMetricSeriesRequestSchema } from './_shared/redriverValidators.ts';
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
    const principal = await assertScopes(req, ['rr_os:read_projection']);
    principalId = principal.principal_id;
    principalType = principal.principal_type;
    principalScopes = principal.scopes;
    assertRateLimit({ bucket: 'rr_series_query', principalId, limit: 30 });

    const body = await req.json().catch(() => ({}));
    const input = parseOrThrow(queryMetricSeriesRequestSchema, body);

    const raw = await querySeries(base44, input);
    if (input.projection_mode === 'projected' && hasRestrictedMetrics(raw.metric_defs_by_id, input.metric_ids)) {
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
      mode: input.projection_mode,
    });

    const finalHash = await sha256Hex(stableStringify({
      manifest: raw.manifest,
      projection_mode: input.projection_mode,
      projection_audit: projected.projection_audit,
      series: projected.series,
      warnings: raw.warnings,
    }));

    const manifest = {
      ...raw.manifest,
      projection_mode: input.projection_mode,
      hash: finalHash,
    };

    await logApiAudit(base44, {
      action: 'rr_os_query_series',
      principalId,
      principalType,
      requestId,
      endpoint: 'api_queryMetricSeries',
      status: 'success',
      details: {
        metric_ids: input.metric_ids,
        projection_mode: input.projection_mode,
        total_series: manifest.total_series,
        total_points: manifest.total_points,
      },
    });

    return jsonSuccess(
      {
        series: projected.series,
        manifest,
        projection_audit: projected.projection_audit,
        warnings: raw.warnings,
      },
      requestId,
    );
  } catch (error) {
    await logApiAudit(base44, {
      action: 'rr_os_query_series',
      principalId,
      principalType,
      requestId,
      endpoint: 'api_queryMetricSeries',
      status: 'error',
      details: { message: String((error as any)?.message || error) },
    });
    return jsonError(error, requestId);
  }
});
