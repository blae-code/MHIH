export async function logApiAudit(base44: any, payload: {
  action: string;
  principalId: string;
  principalType: string;
  requestId: string;
  endpoint: string;
  status: 'success' | 'error';
  details?: Record<string, unknown>;
}) {
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      action: payload.action,
      entity_type: 'RedRiverAPI',
      entity_id: payload.requestId,
      entity_name: payload.endpoint,
      user_email: payload.principalType === 'user' ? payload.principalId : `${payload.principalType}:${payload.principalId}`,
      user_name: `${payload.principalType}:${payload.principalId}`,
      details: JSON.stringify({
        request_id: payload.requestId,
        endpoint: payload.endpoint,
        status: payload.status,
        ...(payload.details || {}),
      }),
    });
  } catch {
    // Best-effort audit logging only.
  }
}
