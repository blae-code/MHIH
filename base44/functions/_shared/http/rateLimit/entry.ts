import { ApiError } from './errorEnvelope.ts';

type CounterState = {
  windowStart: number;
  count: number;
};

const counters = new Map<string, CounterState>();

function cleanup(now: number, windowMs: number) {
  for (const [key, value] of counters.entries()) {
    if (now - value.windowStart > windowMs * 5) counters.delete(key);
  }
}

export function assertRateLimit(opts: {
  bucket: string;
  principalId: string;
  limit: number;
  windowMs?: number;
}) {
  const windowMs = opts.windowMs ?? 60_000;
  const now = Date.now();
  cleanup(now, windowMs);
  const key = `${opts.bucket}:${opts.principalId}`;
  const existing = counters.get(key);

  if (!existing || now - existing.windowStart >= windowMs) {
    counters.set(key, { windowStart: now, count: 1 });
    return;
  }

  existing.count += 1;
  counters.set(key, existing);
  if (existing.count > opts.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - existing.windowStart)) / 1000));
    throw new ApiError('Rate limit exceeded', 429, 'rate_limited', {
      bucket: opts.bucket,
      limit: opts.limit,
      retry_after_seconds: retryAfterSec,
    });
  }
}
