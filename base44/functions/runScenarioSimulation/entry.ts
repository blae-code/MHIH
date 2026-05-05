import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { isImprovement, metricDirection } from './_shared/metricSemantics.ts';

type Metric = {
  id: string;
  name?: string;
  category?: string;
  region?: string;
  year?: number;
  value?: number;
  unit?: string;
  comparison_value?: number;
  data_source_name?: string;
  evidence_grade?: string;
  freshness_score?: number;
};

const MODEL_VERSION = 'scenario-linear-v2';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function std(values: number[]) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

function gradeScore(grade?: string) {
  const g = String(grade || '').toLowerCase();
  if (g === 'high') return 0.95;
  if (g === 'moderate') return 0.75;
  if (g === 'low') return 0.45;
  return 0.6;
}

function linearRegression(points: { year: number; value: number }[]) {
  if (points.length < 2) {
    return { slope: 0, intercept: points[0]?.value || 0, r2: 0, residualStd: 0 };
  }

  const xVals = points.map((p) => p.year);
  const yVals = points.map((p) => p.value);
  const xMean = mean(xVals);
  const yMean = mean(yVals);
  const numerator = xVals.reduce((acc, x, i) => acc + (x - xMean) * (yVals[i] - yMean), 0);
  const denominator = xVals.reduce((acc, x) => acc + (x - xMean) ** 2, 0);
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  const predictions = xVals.map((x) => slope * x + intercept);
  const residuals = yVals.map((y, i) => y - predictions[i]);
  const ssRes = residuals.reduce((acc, r) => acc + r ** 2, 0);
  const ssTot = yVals.reduce((acc, y) => acc + (y - yMean) ** 2, 0);
  const r2 = ssTot === 0 ? 0 : clamp(1 - ssRes / ssTot, 0, 1);

  return { slope, intercept, r2, residualStd: std(residuals) };
}

function predict(model: { slope: number; intercept: number }, year: number) {
  return model.slope * year + model.intercept;
}

function effectMultiplier(interventionType: string, magnitudePct: number) {
  const pct = clamp(Number(magnitudePct || 0), -80, 80);
  const direction = interventionType === 'risk_increase' ? 1 : -1;
  return 1 + (direction * pct) / 100;
}

function stableStringify(value: any): string {
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `"${k}":${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a_${(hash >>> 0).toString(16)}`;
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
      scenario_id,
      name,
      category,
      region,
      intervention_type = 'preventive',
      magnitude_pct = 10,
      coverage_pct = 30,
      target_metric_name,
      assumptions = {},
      seed = 42,
    } = body;

    let scenario = null;
    if (scenario_id) {
      try {
        scenario = await base44.asServiceRole.entities.PolicyScenario.get(scenario_id);
      } catch {
        const found = await base44.asServiceRole.entities.PolicyScenario.filter({ id: scenario_id }, '-created_date', 1);
        scenario = found?.[0] || null;
      }
    }

    const scenarioName = scenario?.name || name || `Scenario ${new Date().toISOString().slice(0, 10)}`;
    const scenarioCategory = scenario?.category || category || 'all';
    const scenarioRegion = scenario?.region || region || 'BC';
    const scenarioMagnitude = Number(scenario?.magnitude_pct ?? magnitude_pct ?? 10);
    const scenarioCoverage = clamp(Number(scenario?.coverage_pct ?? coverage_pct ?? 30), 0, 100);
    const targetMetric = scenario?.target_metric_name || target_metric_name || null;

    const allMetrics: Metric[] = await base44.asServiceRole.entities.HealthMetric.list('-year', 4000);
    const scoped = allMetrics.filter((m) => {
      const catOk = scenarioCategory === 'all' || m.category === scenarioCategory;
      const regOk = scenarioRegion === 'all' || m.region === scenarioRegion;
      const targetOk = !targetMetric || (m.name || '').toLowerCase().includes(String(targetMetric).toLowerCase());
      return catOk && regOk && targetOk && m.value != null && m.year != null && m.name;
    });

    if (scoped.length < 5) {
      return Response.json({
        error: 'Insufficient baseline data for scenario simulation',
        min_required: 5,
        available: scoped.length,
      }, { status: 400 });
    }

    const grouped = new Map<string, Metric[]>();
    for (const m of scoped) {
      const key = `${m.name}|${m.region || 'BC'}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m);
    }

    const multiplier = effectMultiplier(intervention_type, scenarioMagnitude);
    const coverage = scenarioCoverage / 100;

    const projections: any[] = [];
    const evidenceLinks: any[] = [];
    for (const [, items] of grouped.entries()) {
      const points = items
        .filter((p) => p.year != null && p.value != null)
        .sort((a, b) => (a.year || 0) - (b.year || 0))
        .map((p) => ({ year: Number(p.year), value: Number(p.value) }));

      if (points.length < 4) continue;

      const model = linearRegression(points);
      const last = points[points.length - 1];
      const baseline = mean(points.slice(-3).map((p) => p.value));
      const baseline1 = predict(model, last.year + 1);
      const baseline3 = predict(model, last.year + 3);

      const scenario1 = baseline1 * (1 - (1 - multiplier) * coverage);
      const scenario3 = baseline3 * (1 - (1 - multiplier) * coverage);
      const delta1 = scenario1 - baseline1;
      const delta3 = scenario3 - baseline3;

      const recentMetrics = items.slice(-4);
      const avgFreshness = mean(recentMetrics.map((r) => Number(r.freshness_score ?? 0.6)));
      const avgEvidence = mean(recentMetrics.map((r) => gradeScore(r.evidence_grade)));
      const sampleScore = clamp(points.length / 10, 0, 1);
      const confidence = clamp(0.2 + sampleScore * 0.25 + model.r2 * 0.25 + avgFreshness * 0.15 + avgEvidence * 0.15, 0.2, 0.97);

      const sigma1 = model.residualStd * Math.sqrt(1);
      const sigma3 = model.residualStd * Math.sqrt(3);
      const ci1 = 1.96 * sigma1;
      const ci3 = 1.96 * sigma3;

      const reference = recentMetrics[recentMetrics.length - 1];
      const direction = metricDirection(reference);
      const improved1 = isImprovement(delta1, direction);
      const improved3 = isImprovement(delta3, direction);

      projections.push({
        metric_name: reference.name,
        region: reference.region || 'BC',
        category: reference.category,
        unit: reference.unit || '',
        directionality: direction,
        baseline,
        last_year: last.year,
        baseline_projection_1y: Number(baseline1.toFixed(3)),
        baseline_projection_3y: Number(baseline3.toFixed(3)),
        scenario_projection_1y: Number(scenario1.toFixed(3)),
        scenario_projection_3y: Number(scenario3.toFixed(3)),
        delta_1y: Number(delta1.toFixed(3)),
        delta_3y: Number(delta3.toFixed(3)),
        pct_impact_1y: baseline1 === 0 ? 0 : Number(((delta1 / Math.abs(baseline1)) * 100).toFixed(2)),
        pct_impact_3y: baseline3 === 0 ? 0 : Number(((delta3 / Math.abs(baseline3)) * 100).toFixed(2)),
        confidence: Number(confidence.toFixed(3)),
        uncertainty: {
          interval_1y: [Number((scenario1 - ci1).toFixed(3)), Number((scenario1 + ci1).toFixed(3))],
          interval_3y: [Number((scenario3 - ci3).toFixed(3)), Number((scenario3 + ci3).toFixed(3))],
          residual_std: Number(model.residualStd.toFixed(4)),
          r2: Number(model.r2.toFixed(4)),
        },
        sample_size: points.length,
        method: 'linear_regression_intervention_multiplier',
        assumptions: {
          deterministic_seed: Number(seed || 42),
          intervention_type,
          magnitude_pct: scenarioMagnitude,
          coverage_pct: scenarioCoverage,
        },
        interpretation: {
          year_1: improved1 ? 'improving' : 'worsening_or_neutral',
          year_3: improved3 ? 'improving' : 'worsening_or_neutral',
        },
        evidence_metric_ids: recentMetrics.map((i) => i.id),
      });

      evidenceLinks.push(...recentMetrics.map((m) => ({
        metric_id: m.id,
        metric_name: m.name,
        source_name: m.data_source_name || 'unknown',
        evidence_grade: m.evidence_grade || 'moderate',
        confidence_score: confidence,
      })));
    }

    projections.sort((a, b) => Math.abs(b.pct_impact_3y) - Math.abs(a.pct_impact_3y));
    const meanConfidence = mean(projections.map((p) => Number(p.confidence || 0)));
    const prescriptiveBlocked = projections.length === 0 || meanConfidence < 0.45;
    const candidateRecommendations = projections.filter((p) => Number(p.confidence || 0) >= 0.45).slice(0, 5);

    const runAssumptions = {
      ...assumptions,
      method: 'linear_regression_intervention_multiplier',
      uncertainty_method: 'residual_normal_95ci',
      deterministic_seed: Number(seed || 42),
      intervention_type,
      magnitude_pct: scenarioMagnitude,
      coverage_pct: scenarioCoverage,
      category: scenarioCategory,
      region: scenarioRegion,
      target_metric_name: targetMetric,
    };
    const assumptionsHash = hashString(stableStringify(runAssumptions));

    const run = await base44.asServiceRole.entities.ScenarioRun.create({
      scenario_id: scenario?.id || scenario_id || null,
      scenario_name: scenarioName,
      run_type: 'policy_simulation',
      status: 'completed',
      model_version: MODEL_VERSION,
      assumptions: {
        ...runAssumptions,
        assumptions_hash: assumptionsHash,
      },
      inputs_count: scoped.length,
      outputs_count: projections.length,
      output: {
        projections: projections.slice(0, 100),
        method_metadata: {
          method: 'linear_regression_intervention_multiplier',
          deterministic_seed: Number(seed || 42),
          assumptions_hash: assumptionsHash,
          confidence_mean: Number(meanConfidence.toFixed(3)),
          prescriptive_blocked: prescriptiveBlocked,
        },
      },
      created_by: user.email,
    });

    const topRecommendations = prescriptiveBlocked
      ? []
      : candidateRecommendations.map((p, idx) => {
          const improving = p.interpretation?.year_3 === 'improving';
          return {
            title: `${p.metric_name}: ${improving ? 'improving' : 'worsening'} 3-year trajectory`,
            summary: `Projected 3-year scenario impact is ${p.pct_impact_3y}% in ${p.region}. Confidence ${(Number(p.confidence) * 100).toFixed(0)}%.`,
            recommendation_type: 'scenario',
            priority_score: Math.min(100, Math.round(Math.abs(p.pct_impact_3y) * 2 + (1 - p.confidence) * 30)),
            confidence_score: Number(p.confidence.toFixed(2)),
            approval_status: 'pending',
            requires_approval: true,
            scenario_run_id: run.id,
            status: 'pending',
            rank: idx + 1,
          };
        });

    for (const rec of topRecommendations) {
      await base44.asServiceRole.entities.Recommendation.create(rec);
    }

    for (const e of evidenceLinks.slice(0, 120)) {
      await base44.asServiceRole.entities.EvidenceLink.create({
        run_id: run.id,
        link_type: 'scenario_input',
        metric_id: e.metric_id,
        metric_name: e.metric_name,
        source_name: e.source_name,
        evidence_grade: e.evidence_grade,
        confidence_score: Number(e.confidence_score.toFixed(3)),
        model_version: MODEL_VERSION,
      }).catch(() => {});
    }

    return Response.json({
      success: true,
      run_id: run.id,
      scenario_name: scenarioName,
      assumptions_hash: assumptionsHash,
      projections_count: projections.length,
      recommendations_created: topRecommendations.length,
      prescriptive_blocked: prescriptiveBlocked,
      projections: projections.slice(0, 30),
      assumptions: run.assumptions,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
