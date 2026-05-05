type SeriesPoint = {
  year: number;
  value: number | string | null;
  n?: number | null;
  suppression_applied?: boolean;
  suppression_reason?: string | null;
  dimensions?: Record<string, unknown>;
};

type Series = {
  metric_id: string;
  metric_name?: string;
  dataset_ids: string[];
  series_key: string;
  dimensions: Record<string, unknown>;
  points: SeriesPoint[];
};

type MetricDef = {
  metric_id: string;
  value_type?: string;
  suppression?: {
    min_n?: number;
    rounding?: {
      mode?: string;
      decimals?: number;
    };
    redact_dims?: string[];
  };
};

function roundValue(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function defaultDecimals(valueType?: string, value?: number) {
  if (valueType === 'rate' || valueType === 'percent') return 1;
  if (valueType === 'number') {
    if (typeof value === 'number' && Math.abs(value) < 10) return 1;
    return 0;
  }
  return 2;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function applyProjection(args: {
  series: Series[];
  metricDefsById: Record<string, MetricDef>;
  mode: 'internal' | 'projected';
}) {
  const redactedDimensions: string[] = [];
  let suppressedPoints = 0;
  let roundedPoints = 0;

  if (args.mode === 'internal') {
    return {
      series: args.series,
      projection_audit: {
        projection_mode: 'internal',
        suppressed_points: 0,
        rounded_points: 0,
        redacted_dimensions: [],
      },
    };
  }

  const projectedSeries = args.series.map((seriesRow) => {
    const def = args.metricDefsById[seriesRow.metric_id] || {};
    const suppression = def.suppression || {};
    const minN = typeof suppression.min_n === 'number' ? suppression.min_n : null;
    const redactDims = Array.isArray(suppression.redact_dims) ? suppression.redact_dims : [];
    redactDims.forEach((d) => redactedDimensions.push(d));

    const projectedDimensions = { ...(seriesRow.dimensions || {}) };
    for (const key of redactDims) {
      if (key in projectedDimensions) delete projectedDimensions[key];
    }

    const points = (seriesRow.points || []).map((point) => {
      const nextPoint: SeriesPoint = { ...point };
      const nValue = typeof nextPoint.n === 'number' ? nextPoint.n : null;
      const numericValue = typeof nextPoint.value === 'number' ? nextPoint.value : Number(nextPoint.value);
      const isNumeric = Number.isFinite(numericValue);

      if (minN != null && nValue != null && nValue < minN) {
        nextPoint.value = null;
        nextPoint.suppression_applied = true;
        nextPoint.suppression_reason = 'min_n';
        suppressedPoints += 1;
        return nextPoint;
      }

      if (isNumeric) {
        const mode = String(suppression.rounding?.mode || 'fixed');
        if (mode !== 'none') {
          const decimals = typeof suppression.rounding?.decimals === 'number'
            ? suppression.rounding.decimals
            : defaultDecimals(def.value_type, numericValue);
          const rounded = roundValue(numericValue, decimals);
          if (rounded !== numericValue) roundedPoints += 1;
          nextPoint.value = rounded;
        }
      }

      if (point?.dimensions && typeof point.dimensions === 'object') {
        const dims = { ...(point.dimensions || {}) };
        for (const key of redactDims) {
          if (key in dims) delete dims[key];
        }
        nextPoint.dimensions = dims;
      }

      nextPoint.suppression_applied = Boolean(nextPoint.suppression_applied);
      nextPoint.suppression_reason = nextPoint.suppression_reason || null;
      return nextPoint;
    });

    return {
      ...seriesRow,
      dimensions: projectedDimensions,
      points,
    };
  });

  return {
    series: projectedSeries,
    projection_audit: {
      projection_mode: 'projected',
      suppressed_points: suppressedPoints,
      rounded_points: roundedPoints,
      redacted_dimensions: unique(redactedDimensions),
    },
  };
}
