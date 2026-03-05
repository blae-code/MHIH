import { base44 } from "@/api/base44Client";

const DEFAULT_SORT = "-year";
const PAGE_SIZE = 5000;
const MAX_PAGES = 400;
const CACHE_TTL_MS = 2 * 60 * 1000;

const cache = new Map();

const buildCacheKey = (sort, fields) => {
  const normalizedFields = Array.isArray(fields) && fields.length ? fields.join(",") : "*";
  return `${sort}::${normalizedFields}`;
};

async function fetchAllHealthMetrics(sort, fields) {
  const all = [];
  const seenIds = new Set();
  let skip = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const batch = await base44.entities.HealthMetric.list(sort, PAGE_SIZE, skip, fields);
    if (!Array.isArray(batch) || batch.length === 0) break;

    for (const row of batch) {
      if (row?.id) {
        if (seenIds.has(row.id)) continue;
        seenIds.add(row.id);
      }
      all.push(row);
    }

    if (batch.length < PAGE_SIZE) break;
    skip += batch.length;

    if (page === MAX_PAGES - 1) {
      // Guard against infinite pagination loops if upstream skip handling regresses.
      console.warn(`HealthMetric pagination cap reached at ${MAX_PAGES} pages; results may be truncated.`);
    }
  }

  return all;
}

export async function listAllHealthMetrics(options = {}) {
  const {
    sort = DEFAULT_SORT,
    fields,
    forceRefresh = false,
    cacheTtlMs = CACHE_TTL_MS,
  } = options;

  const key = buildCacheKey(sort, fields);
  const now = Date.now();
  const cached = cache.get(key);

  if (!forceRefresh && cached?.data && cached.expiresAt > now) {
    return cached.data;
  }

  if (!forceRefresh && cached?.inFlight) {
    return cached.inFlight;
  }

  const inFlight = fetchAllHealthMetrics(sort, fields)
    .then((rows) => {
      cache.set(key, {
        data: rows,
        expiresAt: Date.now() + cacheTtlMs,
        inFlight: null,
      });
      return rows;
    })
    .catch((error) => {
      const stale = cache.get(key)?.data || null;
      cache.set(key, {
        data: stale,
        expiresAt: 0,
        inFlight: null,
      });
      throw error;
    });

  cache.set(key, {
    data: cached?.data || null,
    expiresAt: cached?.expiresAt || 0,
    inFlight,
  });

  return inFlight;
}

export function invalidateHealthMetricCache() {
  cache.clear();
}
