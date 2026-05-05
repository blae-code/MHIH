import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { assertScopes } from './_shared/auth/assertScopes.ts';
import { createRequestId, jsonError, jsonSuccess } from './_shared/http/errorEnvelope.ts';
import { assertRateLimit } from './_shared/http/rateLimit.ts';
import { logApiAudit } from './_shared/http/audit.ts';
import { getEvidenceSnapshotRequestSchema, parseOrThrow } from './_shared/redriverValidators.ts';
import { loadSnapshotForMode } from './_shared/snapshots/loadSnapshot.ts';

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
    assertRateLimit({ bucket: 'rr_snapshot_read', principalId, limit: 60 });

    const body = await req.json().catch(() => ({}));
    const input = parseOrThrow(getEvidenceSnapshotRequestSchema, body);
    const projectionMode = input.projection_mode || 'projected';

    const result = await loadSnapshotForMode({
      base44,
      snapshotId: input.snapshot_id,
      projectionMode,
      principalScopes,
    });

    await logApiAudit(base44, {
      action: 'rr_os_snapshot_get',
      principalId,
      principalType,
      requestId,
      endpoint: 'api_getEvidenceSnapshot',
      status: 'success',
      details: {
        snapshot_id: input.snapshot_id,
        projection_mode: projectionMode,
      },
    });

    return jsonSuccess(
      {
        snapshot: result.snapshot,
        projection_audit: result.projection_audit,
      },
      requestId,
    );
  } catch (error) {
    await logApiAudit(base44, {
      action: 'rr_os_snapshot_get',
      principalId,
      principalType,
      requestId,
      endpoint: 'api_getEvidenceSnapshot',
      status: 'error',
      details: { message: String((error as any)?.message || error) },
    });
    return jsonError(error, requestId);
  }
});
