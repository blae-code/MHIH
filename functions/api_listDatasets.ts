import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { assertScopes } from './_shared/auth/assertScopes.ts';
import { createRequestId, ApiError, jsonError, jsonSuccess } from './_shared/http/errorEnvelope.ts';
import { assertRateLimit } from './_shared/http/rateLimit.ts';
import { logApiAudit } from './_shared/http/audit.ts';
import { listDatasetsRequestSchema, parseOrThrow } from './_shared/redriverValidators.ts';

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
    const input = parseOrThrow(listDatasetsRequestSchema, body);

    const rows = await base44.asServiceRole.entities.DatasetManifest
      .list('-updated_date', 5000)
      .catch((error: any) => {
        throw new ApiError(
          'DatasetManifest entity is unavailable. Configure Base44 schema before using this endpoint.',
          500,
          'missing_entity',
          { entity: 'DatasetManifest', cause: String(error?.message || error) },
        );
      });

    const datasets = (rows || [])
      .filter((row: any) => input.includeDeprecated || String(row.status || 'active') !== 'deprecated')
      .map((row: any) => ({
        dataset_id: row.dataset_id,
        name: row.name,
        description: row.description ?? null,
        version: Number(row.version || 1),
        steward: row.steward ?? null,
        license: row.license ?? null,
        refresh_interval_days: Number(row.refresh_interval_days || 0),
        schema: row.schema || {},
        schema_hash: row.schema_hash || '',
        projection_policy_id: row.projection_policy_id || 'default_health_projection_v1',
        status: row.status || 'active',
      }));

    await logApiAudit(base44, {
      action: 'rr_os_list_datasets',
      principalId,
      principalType,
      requestId,
      endpoint: 'api_listDatasets',
      status: 'success',
      details: { count: datasets.length },
    });

    return jsonSuccess({ datasets }, requestId);
  } catch (error) {
    await logApiAudit(base44, {
      action: 'rr_os_list_datasets',
      principalId,
      principalType,
      requestId,
      endpoint: 'api_listDatasets',
      status: 'error',
      details: { message: String((error as any)?.message || error) },
    });
    return jsonError(error, requestId);
  }
});
