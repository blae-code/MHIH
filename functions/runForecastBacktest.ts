import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function linearFit(points: { x: number; y: number }[]) {
  const xMean = mean(points.map((p) => p.x));
  const yMean = mean(points.map((p) => p.y));
  const numerator = points.reduce((acc, p) => acc + (p.x - xMean) * (p.y - yMean), 0);
  const denominator = points.reduce((acc, p) => acc + (p.x - xMean) ** 2, 0);
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

function predict(model: { slope: number; intercept: number }, x: number) {
  return model.slope * x + model.intercept;
}

function absPctErr(actual: number, predicted: number) {
  if (!actual) return 0;
  return Math.abs((actual - predicted) / Math.abs(actual)) * 100;
}

function smape(actual: number, predicted: number) {
  const denom = (Math.abs(actual) + Math.abs(predicted)) / 2;
  if (!denom) return 0;
  return (Math.abs(actual - predicted) / denom) * 100;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'user'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const threshold = Number(body.mape_alert_threshold ?? 20);
    const holdoutPointsRequested = clamp(Number(body.holdout_points ?? 3), 1, 5);

    const metrics = await base44.asServiceRole.entities.HealthMetric.list('-year', 5000);
    const grouped = new Map<string, any[]>();
    for (const m of metrics) {
      if (!m.name || !m.year || m.value == null) continue;
      const key = `${m.name.toLowerCase().trim()}|${m.region || 'BC'}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m);
    }

    const rows: any[] = [];
    const seriesRows: any[] = [];
    for (const [key, vals] of grouped.entries()) {
      const ordered = vals.sort((a, b) => a.year - b.year);
      if (ordered.length < 6) continue;

      const holdoutCount = Math.min(holdoutPointsRequested, Math.max(1, ordered.length - 4));
      const startHoldoutIdx = ordered.length - holdoutCount;
      const pointErrors: number[] = [];
      const pointAbs: number[] = [];
      const pointSmape: number[] = [];

      for (let idx = startHoldoutIdx; idx < ordered.length; idx++) {
        const holdout = ordered[idx];
        const train = ordered.slice(0, idx).map((p) => ({ x: Number(p.year), y: Number(p.value) }));
        if (train.length < 4) continue;

        const model = linearFit(train);
        const yhat = predict(model, Number(holdout.year));
        const actual = Number(holdout.value);
        const absError = Math.abs(actual - yhat);
        const ape = absPctErr(actual, yhat);
        const smapeVal = smape(actual, yhat);

        pointErrors.push(ape);
        pointAbs.push(absError);
        pointSmape.push(smapeVal);

        rows.push({
          key,
          metric_name: holdout.name,
          category: holdout.category || 'other',
          region: holdout.region || 'BC',
          holdout_year: holdout.year,
          actual: Number(actual.toFixed(4)),
          predicted: Number(yhat.toFixed(4)),
          abs_error: Number(absError.toFixed(4)),
          ape: Number(ape.toFixed(2)),
          smape: Number(smapeVal.toFixed(2)),
          slope: Number(model.slope.toFixed(5)),
          train_points: train.length,
          holdout_points: holdoutCount,
          model_version: 'linear-backtest-v2',
        });
      }

      if (!pointErrors.length) continue;
      seriesRows.push({
        key,
        metric_name: ordered[ordered.length - 1]?.name,
        category: ordered[ordered.length - 1]?.category || 'other',
        region: ordered[ordered.length - 1]?.region || 'BC',
        holdout_points: holdoutCount,
        mape: Number(mean(pointErrors).toFixed(2)),
        mae: Number(mean(pointAbs).toFixed(4)),
        smape: Number(mean(pointSmape).toFixed(2)),
      });
    }

    rows.sort((a, b) => b.ape - a.ape);
    seriesRows.sort((a, b) => b.mape - a.mape);

    const byCategory: Record<string, number[]> = {};
    const byRegion: Record<string, number[]> = {};
    for (const row of seriesRows) {
      byCategory[row.category] = byCategory[row.category] || [];
      byCategory[row.category].push(row.mape);
      byRegion[row.region] = byRegion[row.region] || [];
      byRegion[row.region].push(row.mape);
    }

    const categoryScores = Object.entries(byCategory)
      .map(([category, mapes]) => ({
        category,
        count: mapes.length,
        mape: Number(mean(mapes).toFixed(2)),
      }))
      .sort((a, b) => b.mape - a.mape);

    const regionScores = Object.entries(byRegion)
      .map(([region, mapes]) => ({
        region,
        count: mapes.length,
        mape: Number(mean(mapes).toFixed(2)),
      }))
      .sort((a, b) => b.mape - a.mape);

    const overallMape = Number(mean(seriesRows.map((r) => r.mape)).toFixed(2));
    const overallMae = Number(mean(seriesRows.map((r) => r.mae)).toFixed(4));
    const overallSmape = Number(mean(seriesRows.map((r) => r.smape)).toFixed(2));

    const run = await base44.asServiceRole.entities.ScenarioRun.create({
      scenario_name: `Forecast Backtest ${new Date().toISOString().slice(0, 10)}`,
      run_type: 'forecast_backtest',
      status: 'completed',
      model_version: 'linear-backtest-v2',
      assumptions: {
        holdout_strategy: 'rolling_multi_holdout',
        holdout_points: holdoutPointsRequested,
        minimum_points: 6,
        threshold_mape_alert: threshold,
        metrics: ['MAPE', 'MAE', 'sMAPE'],
      },
      inputs_count: seriesRows.length,
      outputs_count: rows.length,
      output: {
        overall_mape: overallMape,
        overall_mae: overallMae,
        overall_smape: overallSmape,
        rows: rows.slice(0, 1000),
        series_rows: seriesRows.slice(0, 600),
        category_scores: categoryScores,
        region_scores: regionScores,
      },
      created_by: user.email,
    });

    const highErrorRegions = regionScores.filter((r) => r.mape >= threshold).slice(0, 12);
    for (const r of highErrorRegions) {
      await base44.asServiceRole.entities.AlertEvent.create({
        alert_type: 'model_drift',
        severity: r.mape > 35 ? 'critical' : r.mape > 25 ? 'high' : 'medium',
        status: 'open',
        category: 'model_quality',
        region: r.region,
        metric_name: 'Forecast MAPE',
        lead_time_score: Number(Math.min(100, r.mape * 2).toFixed(1)),
        confidence_score: 0.9,
        summary: `Forecast backtest MAPE ${r.mape}% in ${r.region} (n=${r.count})`,
        description: `Backtesting exceeded threshold ${threshold}% in ${r.region}. Metrics include MAPE/MAE/sMAPE with rolling holdouts.`,
        detected_by: 'runForecastBacktest',
        detected_at: new Date().toISOString(),
      }).catch(() => {});
    }

    await base44.asServiceRole.entities.AIInsight.create({
      title: `Forecast Backtest — ${new Date().toLocaleDateString('en-CA')}`,
      type: 'model_quality',
      content: `MAPE: ${overallMape}% | sMAPE: ${overallSmape}% | MAE: ${overallMae}. Series analyzed: ${seriesRows.length}. Highest-risk regions: ${regionScores.slice(0, 3).map((r) => `${r.region} (${r.mape}%)`).join(', ') || 'n/a'}.`,
      generated_by: 'Backtest Agent',
      confidence_score: 0.9,
      requires_approval: false,
      approval_status: 'approved',
    }).catch(() => {});

    return Response.json({
      success: true,
      run_id: run.id,
      overall_mape: overallMape,
      overall_mae: overallMae,
      overall_smape: overallSmape,
      threshold,
      rows_analyzed: rows.length,
      series_analyzed: seriesRows.length,
      high_error_regions: highErrorRegions,
      category_scores: categoryScores,
      region_scores: regionScores,
      rows: rows.slice(0, 300),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
