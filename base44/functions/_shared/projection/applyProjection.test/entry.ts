import { describe, expect, it } from 'vitest';
import { applyProjection } from './applyProjection';

const metricDefsById = {
  mh_demo_rate: {
    metric_id: 'mh_demo_rate',
    value_type: 'rate',
    suppression: {
      min_n: 5,
      rounding: {
        mode: 'fixed',
        decimals: 1,
      },
      redact_dims: ['site'],
    },
  },
};

describe('applyProjection', () => {
  it('suppresses points below min_n in projected mode', () => {
    const output = applyProjection({
      mode: 'projected',
      metricDefsById,
      series: [
        {
          metric_id: 'mh_demo_rate',
          metric_name: 'Demo Rate',
          dataset_ids: ['demo'],
          series_key: 'region:BC|site:A',
          dimensions: { region: 'BC', site: 'A' },
          points: [
            { year: 2024, value: 12.345, n: 3 },
            { year: 2025, value: 8.888, n: 10 },
          ],
        },
      ],
    });

    expect(output.series[0].points[0].value).toBeNull();
    expect(output.series[0].points[0].suppression_reason).toBe('min_n');
    expect(output.projection_audit.suppressed_points).toBe(1);
  });

  it('applies rounding and dimension redaction in projected mode', () => {
    const output = applyProjection({
      mode: 'projected',
      metricDefsById,
      series: [
        {
          metric_id: 'mh_demo_rate',
          metric_name: 'Demo Rate',
          dataset_ids: ['demo'],
          series_key: 'region:BC|site:A',
          dimensions: { region: 'BC', site: 'A' },
          points: [{ year: 2024, value: 12.345, n: 8 }],
        },
      ],
    });

    expect(output.series[0].points[0].value).toBe(12.3);
    expect(output.series[0].dimensions.site).toBeUndefined();
    expect(output.projection_audit.redacted_dimensions).toContain('site');
  });

  it('is a no-op in internal mode', () => {
    const input = [
      {
        metric_id: 'mh_demo_rate',
        metric_name: 'Demo Rate',
        dataset_ids: ['demo'],
        series_key: 'region:BC|site:A',
        dimensions: { region: 'BC', site: 'A' },
        points: [{ year: 2024, value: 12.345, n: 3 }],
      },
    ];
    const output = applyProjection({
      mode: 'internal',
      metricDefsById,
      series: input,
    });

    expect(output.series).toEqual(input);
    expect(output.projection_audit.projection_mode).toBe('internal');
  });
});
