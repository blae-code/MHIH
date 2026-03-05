import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { assertScopes } from './_shared/auth/assertScopes.ts';
import { upsertCatalog } from './_shared/catalog/upsertCatalog.ts';
import { createRequestId, jsonError, jsonSuccess } from './_shared/http/errorEnvelope.ts';
import { assertRateLimit } from './_shared/http/rateLimit.ts';
import { logApiAudit } from './_shared/http/audit.ts';

Deno.serve(async (req) => {
  const requestId = createRequestId();
  const base44 = createClientFromRequest(req);
  let principalId = 'anonymous';
  let principalType = 'unknown';

  try {
    const principal = await assertScopes(req, ['catalog:write']);
    principalId = principal.principal_id;
    principalType = principal.principal_type;

    assertRateLimit({
      bucket: 'rr_catalog_write',
      principalId,
      limit: 10,
    });

    const body = await req.json().catch(() => ({}));
    const dryRun = Boolean(body?.dry_run);
    const result = await upsertCatalog(base44, { dry_run: dryRun });

    await logApiAudit(base44, {
      action: 'rr_os_catalog_sync',
      principalId,
      principalType,
      requestId,
      endpoint: 'syncCatalog',
      status: 'success',
      details: {
        dry_run: dryRun,
        metrics: result.metrics,
        datasets: result.datasets,
      },
    });

    return jsonSuccess(
      {
        success: true,
        dry_run: dryRun,
        counts: {
          metrics_upserted: result.metrics.created + result.metrics.updated,
          datasets_upserted: result.datasets.created + result.datasets.updated,
        },
        details: result,
      },
      requestId,
    );
  } catch (error) {
    await logApiAudit(base44, {
      action: 'rr_os_catalog_sync',
      principalId,
      principalType,
      requestId,
      endpoint: 'syncCatalog',
      status: 'error',
      details: {
        message: String((error as any)?.message || error),
      },
    });
    return jsonError(error, requestId);
  }
});
