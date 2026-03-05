export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, status = 500, code = 'internal_error', details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createRequestId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function jsonSuccess(payload: Record<string, unknown>, requestId: string, status = 200) {
  return Response.json(
    {
      request_id: requestId,
      ...payload,
    },
    { status },
  );
}

export function jsonError(error: unknown, requestId: string) {
  if (error instanceof ApiError) {
    return Response.json(
      {
        request_id: requestId,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.status },
    );
  }

  const status = Number((error as any)?.status || 500);
  const code = String((error as any)?.code || 'internal_error');
  const message = String((error as any)?.message || 'Unexpected server error');
  const details = (error as any)?.details;

  return Response.json(
    {
      request_id: requestId,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}
