import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { metricDirection } from './_shared/metricSemantics.ts';

type Metric = {
  id: string;
  name?: string;
  category?: string;
  region?: string;
  year?: number;
  value?: number;
  data_source_name?: string;
  freshness_score?: number;
  evidence_grade?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function pearson(xs: number[], ys: number[]) {
  if (xs.length < 3 || ys.length < 3 || xs.length !== ys.length) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  const numerator = xs.reduce((acc, x, i) => acc + (x - mx) * (ys[i] - my), 0);
  const dx = Math.sqrt(xs.reduce((acc, x) => acc + (x - mx) ** 2, 0));
  const dy = Math.sqrt(ys.reduce((acc, y) => acc + (y - my) ** 2, 0));
  if (!dx || !dy) return 0;
  return numerator / (dx * dy);
}

function fisherInterval(r: number, n: number) {
  if (!Number.isFinite(r) || n < 4 || Math.abs(r) >= 1) return [r, r];
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  const se = 1 / Math.sqrt(n - 3);
  const zLow = z - 1.96 * se;
  const zHigh = z + 1.96 * se;
  const low = (Math.exp(2 * zLow) - 1) / (Math.exp(2 * zLow) + 1);
  const high = (Math.exp(2 * zHigh) - 1) / (Math.exp(2 * zHigh) + 1);
  return [clamp(low, -1, 1), clamp(high, -1, 1)];
}

function isRecent(ts?: string, hours = 24) {
  if (!ts) return false;
  const ageMs = Date.now() - new Date(ts).getTime();
  return ageMs >= 0 && ageMs < hours * 60 * 60 * 1000;
}

function gradeScore(grade?: string) {
  const g = String(grade || '').toLowerCase();
  if (g === 'high') return 0.95;
  if (g === 'moderate') return 0.75;
  if (g === 'low') return 0.45;
  return 0.6;
}

function pairedSeries(targetByYear: Map<number, number>, sourceRows: Metric[], lag: number) {
  const sourceByYear = new Map<number, number>();
  for (const row of sourceRows) {
    if (row.year != null && row.value != null) sourceByYear.set(Number(row.year), Number(row.value));
  }
  const pairs: { x: number; y: number; year: number }[] = [];
  for (const [targetYear, targetValue] of targetByYear.entries()) {
    const sourceYear = targetYear - lag;
    if (!sourceByYear.has(sourceYear)) continue;
    pairs.push({ x: sourceByYear.get(sourceYear) as number, y: targetValue, year: targetYear });
  }
  return pairs.sort((a, b) => a.year - b.year);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'user'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      target_metric_name,
      category = 'all',
      region = 'all',
      run_label,
      use_cache = true,
      cache_ttl_hours = 24,
      min_samples = 5,
      max_lag_years = 2,
    } = body;

    if (!target_metric_name) {
      return Response.json({ error: 'target_metric_name is required' }, { status: 400 });
    }

    const normalizedTarget = String(target_metric_name).toLowerCase().trim();
    const ttl = Math.max(1, Number(cache_ttl_hours || 24));
    if (use_cache !== false) {
      const recentRuns = await base44.asServiceRole.entities.ScenarioRun.filter({ run_type: 'causal_analysis' }, '-created_date', 120);
      const cached = recentRuns.find((r: any) => {
        const a = r.assumptions || {};
        return isRecent(r.created_date, ttl)
          && String(a.target_metric_name || '').toLowerCase().trim() === normalizedTarget
          && String(a.category || 'all') === String(category)
          && String(a.region || 'all') === String(region)
          && r.output?.drivers;
      });

      if (cached) {
        return Response.json({
          success: true,
          cached: true,
          run_id: cached.id,
          target_metric_name,
          analysis_type: 'associational_driver_analysis',
          drivers_count: Number(cached.outputs_count || cached.output?.drivers?.length || 0),
          graph: cached.output?.graph || { nodes: [], edges: [] },
          drivers: (cached.output?.drivers || []).slice(0, 20),
          narrative: cached.output?.narrative || { summary: 'Cached result reused.' },
          message: 'Reused recent driver analysis to reduce token/API usage.',
        });
      }
    }

    const metrics: Metric[] = await base44.asServiceRole.entities.HealthMetric.list('-year', 4000);
    const scoped = metrics.filter((m) => {
      const categoryOk = category === 'all' || m.category === category;
      const regionOk = region === 'all' || m.region === region;
      return categoryOk && regionOk && m.value != null && m.year != null;
    });

    const targetSeries = scoped
      .filter((m) => (m.name || '').toLowerCase() === normalizedTarget)
      .sort((a, b) => (a.year || 0) - (b.year || 0));

    if (targetSeries.length < min_samples) {
      return Response.json({
        error: 'Insufficient target series data for driver analysis',
        target_metric_name,
        available_points: targetSeries.length,
        minimum_required: min_samples,
      }, { status: 400 });
    }

    const targetByYear = new Map<number, number>();
    for (const row of targetSeries) targetByYear.set(row.year as number, Number(row.value));

    const grouped = new Map<string, Metric[]>();
    for (const m of scoped) {
      if (!m.name || (m.name || '').toLowerCase() === normalizedTarget) continue;
      const key = `${m.name}|${m.region || 'BC'}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m);
    }

    const drivers: any[] = [];
    const lagMax = clamp(Number(max_lag_years || 2), 0, 5);
    for (const [key, rows] of grouped.entries()) {
      const ordered = rows.sort((a, b) => (a.year || 0) - (b.year || 0));
      if (ordered.length < min_samples) continue;

      let best: any = null;
      for (let lag = 0; lag <= lagMax; lag++) {
        const pairs = pairedSeries(targetByYear, ordered, lag);
        if (pairs.length < min_samples) continue;
        const corr = pearson(pairs.map((p) => p.x), pairs.map((p) => p.y));
        if (!best || Math.abs(corr) > Math.abs(best.correlation)) {
          best = { lag, correlation: corr, pairs };
        }
      }
      if (!best) continue;

      const effect = Math.abs(best.correlation);
      if (effect < 0.2) continue;

      const [name, reg] = key.split('|');
      const avgFreshness = mean(rows.map((r) => Number(r.freshness_score ?? 0.6)));
      const avgEvidence = mean(rows.map((r) => gradeScore(r.evidence_grade)));
      const sampleScore = clamp(best.pairs.length / 12, 0, 1);
      const lagPenalty = best.lag > 0 ? 0.95 : 1;
      const confidence = clamp((0.2 + effect * 0.45 + sampleScore * 0.2 + avgFreshness * 0.1 + avgEvidence * 0.1) * lagPenalty, 0.2, 0.96);
      const [corrLow, corrHigh] = fisherInterval(best.correlation, best.pairs.length);

      drivers.push({
        metric_name: name,
        region: reg,
        category: rows[0]?.category || 'other',
        direction: best.correlation >= 0 ? 'positive' : 'negative',
        correlation: Number(best.correlation.toFixed(3)),
        effect_size: Number(effect.toFixed(3)),
        lag_years: best.lag,
        sample_size: best.pairs.length,
        confidence: Number(confidence.toFixed(3)),
        uncertainty: Number((1 - confidence).toFixed(3)),
        uncertainty_interval: {
          correlation_95ci: [Number(corrLow.toFixed(3)), Number(corrHigh.toFixed(3))],
        },
        analysis_type: 'associational_driver_analysis',
        caveat: 'Associational signal only. Not proof of causality.',
        target_directionality: metricDirection(targetSeries[targetSeries.length - 1]),
        evidence_metric_ids: rows.slice(-4).map((r) => r.id),
      });
    }

    drivers.sort((a, b) => b.effect_size - a.effect_size);

    const nodes = [
      { id: `target:${target_metric_name}`, label: target_metric_name, type: 'target' },
      ...drivers.slice(0, 20).map((d) => ({ id: `driver:${d.metric_name}:${d.region}`, label: `${d.metric_name} (${d.region})`, type: 'driver' })),
    ];
    const edges = drivers.slice(0, 20).map((d) => ({
      source: `driver:${d.metric_name}:${d.region}`,
      target: `target:${target_metric_name}`,
      weight: d.effect_size,
      sign: d.direction,
      lag_years: d.lag_years,
      confidence: d.confidence,
      uncertainty: d.uncertainty,
    }));

    const resultText = drivers.length === 0
      ? {
          summary: `No strong associational drivers were detected for ${target_metric_name} under current filters.`,
          caveats: ['No candidate drivers passed minimum effect and sample thresholds.'],
          actions: ['Broaden category/region scope or ingest additional indicators before prescriptive action.'],
        }
      : await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are supporting an associational driver analysis for BC Metis health policy teams.\nTarget metric: ${target_metric_name}\nTop driver signals (not causal proof):\n${drivers.slice(0, 8).map((d, i) => `${i + 1}. ${d.metric_name} (${d.region}) corr=${d.correlation}, lag=${d.lag_years}y, confidence=${d.confidence}, n=${d.sample_size}`).join('\n')}\n\nReturn a concise narrative with:\n1) what the signals suggest,\n2) caveats (confounding, selection bias, omitted variable risk),\n3) 3 practical follow-up actions.\nNever claim causality; call this associational evidence.`,
          response_json_schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              caveats: { type: 'array', items: { type: 'string' } },
              actions: { type: 'array', items: { type: 'string' } },
            },
          },
        });

    const run = await base44.asServiceRole.entities.ScenarioRun.create({
      scenario_name: run_label || `Driver analysis: ${target_metric_name}`,
      run_type: 'causal_analysis',
      status: 'completed',
      model_version: 'associational-driver-v2',
      assumptions: {
        method: 'associational_driver_analysis',
        target_metric_name,
        category,
        region,
        min_samples,
        max_lag_years: lagMax,
        caveat: 'Associational only; causal claims are not supported by this method.',
      },
      inputs_count: scoped.length,
      outputs_count: drivers.length,
      output: {
        analysis_type: 'associational_driver_analysis',
        drivers: drivers.slice(0, 30),
        graph: { nodes, edges },
        narrative: resultText,
      },
      created_by: user.email,
    });

    const recommendations = (resultText.actions || []).slice(0, 5);
    const driverConfidence = Number(mean(drivers.slice(0, 5).map((d) => Number(d.confidence || 0.5))).toFixed(2));
    for (let i = 0; i < recommendations.length; i++) {
      await base44.asServiceRole.entities.Recommendation.create({
        title: `Driver analysis action ${i + 1}: ${target_metric_name}`,
        summary: recommendations[i],
        recommendation_type: 'causal',
        priority_score: 70 - i * 5,
        confidence_score: driverConfidence,
        approval_status: 'pending',
        requires_approval: true,
        scenario_run_id: run.id,
        status: 'pending',
        rank: i + 1,
      });
    }

    for (const d of drivers.slice(0, 15)) {
      await base44.asServiceRole.entities.EvidenceLink.create({
        run_id: run.id,
        link_type: 'causal_driver',
        metric_name: d.metric_name,
        source_name: 'HealthMetric',
        evidence_grade: 'moderate',
        confidence_score: d.confidence,
        uncertainty: d.uncertainty,
        model_version: 'associational-driver-v2',
      }).catch(() => {});
    }

    return Response.json({
      success: true,
      run_id: run.id,
      target_metric_name,
      analysis_type: 'associational_driver_analysis',
      drivers_count: drivers.length,
      graph: { nodes, edges },
      drivers: drivers.slice(0, 20),
      narrative: resultText,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
