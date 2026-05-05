type Direction = 'higher_is_better' | 'lower_is_better' | 'neutral';

const LOWER_BETTER_HINTS = [
  'mortality',
  'death',
  'overdose',
  'hospitalization',
  'admission',
  'er visit',
  'emergency',
  'incidence',
  'prevalence',
  'disease burden',
  'wait time',
  'risk',
  'rate',
  'injury',
  'crime',
  'smoking',
  'obesity',
];

const HIGHER_BETTER_HINTS = [
  'life expectancy',
  'screening',
  'vaccination',
  'immunization',
  'coverage',
  'access',
  'attendance',
  'completion',
  'employment',
  'income',
  'service uptake',
  'primary care attachment',
];

function hasHint(text: string, hints: string[]) {
  const normalized = text.toLowerCase();
  return hints.some((hint) => normalized.includes(hint));
}

export function metricDirection(metric: any): Direction {
  if (!metric) return 'neutral';
  if (typeof metric.higher_is_better === 'boolean') {
    return metric.higher_is_better ? 'higher_is_better' : 'lower_is_better';
  }
  if (typeof metric.lower_is_better === 'boolean') {
    return metric.lower_is_better ? 'lower_is_better' : 'higher_is_better';
  }

  const explicit = String(metric.better_direction || metric.directionality || metric.interpretation || '')
    .trim()
    .toLowerCase();
  if (explicit === 'higher_is_better' || explicit === 'increase_is_better' || explicit === 'up_is_better') {
    return 'higher_is_better';
  }
  if (explicit === 'lower_is_better' || explicit === 'decrease_is_better' || explicit === 'down_is_better') {
    return 'lower_is_better';
  }
  if (explicit === 'neutral' || explicit === 'contextual') {
    return 'neutral';
  }

  const name = String(metric.name || metric.metric_name || '');
  if (hasHint(name, LOWER_BETTER_HINTS)) return 'lower_is_better';
  if (hasHint(name, HIGHER_BETTER_HINTS)) return 'higher_is_better';
  return 'neutral';
}

export function isImprovement(delta: number, direction: Direction) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 1e-12) return false;
  if (direction === 'higher_is_better') return delta > 0;
  if (direction === 'lower_is_better') return delta < 0;
  return false;
}

export function gapIsHarmful(gap: number, direction: Direction) {
  if (!Number.isFinite(gap) || Math.abs(gap) < 1e-12) return false;
  if (direction === 'higher_is_better') return gap < 0;
  if (direction === 'lower_is_better') return gap > 0;
  return Math.abs(gap) > 0;
}

export function compareToBenchmark(value: number, benchmark: number, direction: Direction) {
  const delta = value - benchmark;
  if (!Number.isFinite(delta) || Math.abs(delta) < 1e-12) {
    return { delta: 0, better: null };
  }
  if (direction === 'higher_is_better') return { delta, better: delta > 0 };
  if (direction === 'lower_is_better') return { delta, better: delta < 0 };
  return { delta, better: null };
}
