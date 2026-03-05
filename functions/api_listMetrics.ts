import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { assertScopes } from './_shared/auth/assertScopes.ts';
import { createRequestId, ApiError, jsonError, jsonSuccess } from './_shared/http/errorEnvelope.ts';
import { assertRateLimit } from './_shared/http/rateLimit.ts';
import { logApiAudit } from './_shared/http/audit.ts';
import { listMetricsRequestSchema, parseOrThrow } from './_shared/redriverValidators.ts';

Deno.serve(async (req) => {
  const requestId = createRequestId();
  const base44 = createClientFromRequest(req);
  let principalId = 'anonymous';
  let principalType = 'unknown';

  try {
    const principal = await assertScopes(req, ['rr_os:read_catalog']);
    principalId = principal.principal_id;
    principalType = principal.principal_type;
    assertRateLimit({ bucket: 'rr_catalog_read', principalId, limit: 60 });

    const body = await req.json().catch(() => ({}));
    const input = parseOrThrow(listMetricsRequestSchema, body);

    const rows = await base44.asServiceRole.entities.MetricDefinition
      .list('-updated_date', 5000)
      .catch((error: any) => {
        throw new ApiError(
          'MetricDefinition entity is unavailable. Configure Base44 schema before using this endpoint.',
          500,
          'missing_entity',
          { entity: 'MetricDefinition', cause: String(error?.message || error) },
        );
      });

    const metrics = (rows || [])
      .filter((row: any) => !input.dataset_id || (Array.isArray(row.dataset_ids) && row.dataset_ids.includes(input.dataset_id)))
      .filter((row: any) => !input.category || String(row.category || '') === input.category)
      .filter((row: any) => !input.status || String(row.status || 'active') === input.status)
      .map((row: any) => ({
        metric_id: row.metric_id,
        name: row.name,
        description: row.description ?? null,
        category: row.category,
        unit: row.unit ?? null,
        value_type: row.value_type || 'number',
        direction: row.direction || 'neutral',
        dimensions: row.dimensions || [],
        default_filters: row.default_filters || {},
        suppression: row.suppression || {},
        dataset_ids: Array.isArray(row.dataset_ids) ? row.dataset_ids : [],
        method_notes: row.method_notes ?? null,
        owner: row.owner ?? null,
        status: row.status || 'active',
        version: Number(row.version || 1),
        sensitivity_tier: row.sensitivity_tier || 'public',
      }));

    await logApiAudit(base44, {
      action: 'rr_os_list_metrics',
      principalId,
      principalType,
      requestId,
      endpoint: 'api_listMetrics',
      status: 'success',
      details: { count: metrics.length },
    });

    return jsonSuccess({ metrics }, requestId);
  } catch (error) {
    await logApiAudit(base44, {
      action: 'rr_os_list_metrics',
      principalId,
      principalType,
      requestId,
      endpoint: 'api_listMetrics',
      status: 'error',
      details: { message: String((error as any)?.message || error) },
    });
    return jsonError(error, requestId);
  }
});
