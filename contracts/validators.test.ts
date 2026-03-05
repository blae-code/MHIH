import { describe, expect, it } from 'vitest';
import {
  createEvidenceSnapshotRequestSchema,
  metricContractSchema,
  parseOrThrow,
  queryMetricSeriesRequestSchema,
} from './validators';

describe('contracts validators', () => {
  it('accepts a valid metric contract', () => {
    const parsed = metricContractSchema.parse({
      metric_id: 'mh_demo_life_expectancy',
      name: 'Life expectancy at birth',
      category: 'demographics',
      value_type: 'number',
      direction: 'higher_is_better',
      dimensions: [],
      default_filters: {},
      suppression: {},
      dataset_ids: ['bc_vital_stats_demo'],
      status: 'active',
      version: 1,
    });
    expect(parsed.metric_id).toBe('mh_demo_life_expectancy');
  });

  it('rejects a query request with no metric_ids', () => {
    expect(() =>
      parseOrThrow(queryMetricSeriesRequestSchema, {
        metric_ids: [],
        filters: {},
        time: { from: 2020, to: 2024 },
        projection_mode: 'projected',
      }),
    ).toThrowError();
  });

  it('accepts create snapshot request with nested query', () => {
    const parsed = createEvidenceSnapshotRequestSchema.parse({
      title: 'Snapshot - Demo',
      query: {
        metric_ids: ['mh_demo_diabetes_prev'],
        filters: { region: 'BC' },
        time: { from: 2020, to: 2024 },
        projection_mode: 'projected',
      },
      projection_mode: 'projected',
    });
    expect(parsed.query.metric_ids).toHaveLength(1);
  });
});
