import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

// ── Inlined from formerly-shared metricSemantics (Phase 1 dead-code cleanup) ──
const LOWER_BETTER_HINTS = ['mortality', 'death', 'overdose', 'hospitalization', 'admission', 'er visit', 'emergency', 'incidence', 'prevalence', 'wait time', 'risk', 'rate', 'injury', 'smoking', 'obesity'];
const HIGHER_BETTER_HINTS = ['life expectancy', 'screening', 'vaccination', 'immunization', 'coverage', 'access', 'attendance', 'completion', 'employment', 'income', 'service uptake', 'primary care attachment'];
function metricDirection(metric: any): 'higher_is_better' | 'lower_is_better' | 'neutral' {
  if (!metric) return 'neutral';
  if (typeof metric.higher_is_better === 'boolean') return metric.higher_is_better ? 'higher_is_better' : 'lower_is_better';
  if (typeof metric.lower_is_better === 'boolean') return metric.lower_is_better ? 'lower_is_better' : 'higher_is_better';
  const explicit = String(metric.better_direction || metric.directionality || metric.interpretation || '').trim().toLowerCase();
  if (['higher_is_better', 'increase_is_better', 'up_is_better'].includes(explicit)) return 'higher_is_better';
  if (['lower_is_better', 'decrease_is_better', 'down_is_better'].includes(explicit)) return 'lower_is_better';
  if (['neutral', 'contextual'].includes(explicit)) return 'neutral';
  const name = String(metric.name || metric.metric_name || '').toLowerCase();
  if (LOWER_BETTER_HINTS.some((h) => name.includes(h))) return 'lower_is_better';
  if (HIGHER_BETTER_HINTS.some((h) => name.includes(h))) return 'higher_is_better';
  return 'neutral';
}
function gapIsHarmful(gap: number, direction: string): boolean {
  if (!Number.isFinite(gap) || Math.abs(gap) < 1e-12) return false;
  if (direction === 'higher_is_better') return gap < 0;
  if (direction === 'lower_is_better') return gap > 0;
  return Math.abs(gap) > 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mad(values: number[]) {
  if (!values.length) return 0;
  const m = median(values);
  return median(values.map((v) => Math.abs(v - m)));
}

function pctChange(from: number, to: number) {
  if (!from) return 0;
  return ((to - from) / Math.abs(from)) * 100;
}

function isAlternatingSeasonal(diffs: number[]) {
  if (diffs.length < 6) return false;
  let flips = 0;
  let prevSign = Math.sign(diffs[0]);
  for (let i = 1; i < diffs.length; i++) {
    const sign = Math.sign(diffs[i]);
    if (sign !== 0 && prevSign !== 0 && sign !== prevSign) flips++;
    if (sign !== 0) prevSign = sign;
  }
  const flipRatio = flips / (diffs.length - 1);
  const amplitudes = diffs.map((d) => Math.abs(d)).filter((d) => d > 0);
  if (!amplitudes.length) return false;
  const ampMean = mean(amplitudes);
  const ampMad = mad(amplitudes);
  const ampStability = ampMean ? ampMad / ampMean : 1;
  return flipRatio > 0.7 && ampStability < 0.6;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let authorized = false;
    let actor = 'system';
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin' || user?.role === 'user') {
        authorized = true;
        actor = user.email || 'system';
      }
    } catch {
      try {
        await base44.asServiceRole.entities.AlertEvent.list('-created_date', 1);
        authorized = true;
      } catch {
        authorized = false;
      }
    }

    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const thresholdPct = Number(body.threshold_pct ?? 12);
    const robustZThreshold = Number(body.robust_z_threshold ?? 2.2);

    const metrics = await base44.asServiceRole.entities.HealthMetric.list('-year', 4000);
    const grouped = new Map<string, any[]>();
    for (const m of metrics) {
      if (m.value == null || !m.year || !m.name) continue;
      const key = `${m.name}|${m.region || 'BC'}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m);
    }

    const alerts: any[] = [];
    const suppressed: any[] = [];
    const now = new Date().toISOString();

    for (const [key, rows] of grouped.entries()) {
      const ordered = rows.sort((a, b) => a.year - b.year);
      if (ordered.length < 4) continue;

      const latest = ordered[ordered.length - 1];
      const prev = ordered[ordered.length - 2];
      const diffs = ordered.slice(1).map((row, i) => Number(row.value) - Number(ordered[i].value));
      const baselineDiffs = diffs.slice(0, -1);
      const latestDiff = diffs[diffs.length - 1];

      const med = median(baselineDiffs);
      const baselineMad = mad(baselineDiffs);
      const robustScale = Math.max(1e-6, 1.4826 * baselineMad);
      const robustZ = (latestDiff - med) / robustScale;
      const latestPct = pctChange(Number(prev.value), Number(latest.value));
      const trendSignal = Math.abs(latestPct) >= thresholdPct && Math.abs(robustZ) >= robustZThreshold;

      const direction = metricDirection(latest);
      const prevGap = prev.comparison_value != null ? Number(prev.value) - Number(prev.comparison_value) : null;
      const latestGap = latest.comparison_value != null ? Number(latest.value) - Number(latest.comparison_value) : null;
      const prevHarm = prevGap != null && gapIsHarmful(prevGap, direction) ? Math.abs(prevGap) : 0;
      const currentHarm = latestGap != null && gapIsHarmful(latestGap, direction) ? Math.abs(latestGap) : 0;
      const harmDelta = currentHarm - prevHarm;
      const gapSignal = latestGap != null && prevGap != null && harmDelta > Math.max(0.5, prevHarm * 0.2);

      const seasonal = isAlternatingSeasonal(baselineDiffs);
      if (seasonal && trendSignal && Math.abs(robustZ) < robustZThreshold + 1.0) {
        suppressed.push({
          key,
          reason: 'seasonal_pattern_suppressed',
          robust_z: Number(robustZ.toFixed(2)),
          latest_pct: Number(latestPct.toFixed(2)),
        });
        continue;
      }

      if (!trendSignal && !gapSignal) continue;

      const [name, region] = key.split('|');
      const severityScore = Math.abs(robustZ) * 8 + Math.abs(latestPct) * 0.8 + Math.max(0, harmDelta) * 3;
      const severity = severityScore >= 45 ? 'critical' : severityScore >= 30 ? 'high' : 'medium';
      const confidence = clamp(0.25 + Math.min(0.35, ordered.length * 0.03) + Math.min(0.2, Math.abs(robustZ) * 0.05) + (seasonal ? -0.08 : 0), 0.2, 0.95);
      const summary = gapSignal
        ? `${name} shows ${latestPct.toFixed(1)}% shift and worsening harmful gap (+${harmDelta.toFixed(2)}).`
        : `${name} shifted ${latestPct.toFixed(1)}% with robust z-score ${robustZ.toFixed(2)}.`;

      alerts.push({
        alert_type: gapSignal ? 'widening_disparity' : 'trend_shift',
        severity,
        status: 'open',
        category: latest.category,
        region,
        metric_name: name,
        metric_id: latest.id,
        lead_time_score: Number(clamp(Math.abs(robustZ) * 20 + Math.abs(latestPct), 0, 100).toFixed(1)),
        confidence_score: Number(confidence.toFixed(2)),
        summary,
        description: `Sentinel scan detected a ${latestPct.toFixed(1)}% movement (${prev.year}→${latest.year}), robust_z=${robustZ.toFixed(2)}, threshold=${thresholdPct}%.`,
        detected_by: 'runSentinelScan',
        detected_at: now,
      });
    }

    const existing = await base44.asServiceRole.entities.AlertEvent.filter({ detected_by: 'runSentinelScan', status: 'open' }, '-created_date', 2000);
    await Promise.all(existing.map((a: any) => base44.asServiceRole.entities.AlertEvent.delete(a.id)));

    for (const alert of alerts.slice(0, 400)) {
      await base44.asServiceRole.entities.AlertEvent.create(alert);
    }

    const weeklySummary = alerts
      .slice(0, 12)
      .map((a) => `- [${a.severity}] ${a.metric_name} (${a.region}): ${a.summary}`)
      .join('\n');

    await base44.asServiceRole.entities.AIInsight.create({
      title: `What Changed This Week — ${new Date().toLocaleDateString('en-CA')}`,
      type: 'weekly_intelligence',
      content: weeklySummary || 'No major week-over-week changes were detected by sentinel monitors.',
      generated_by: 'Sentinel Agent',
      confidence_score: Number(mean(alerts.map((a) => a.confidence_score)).toFixed(2)) || 0.6,
      requires_approval: false,
      approval_status: 'approved',
      pinned: false,
      metadata: {
        scan_actor: actor,
        threshold_pct: thresholdPct,
        robust_z_threshold: robustZThreshold,
        suppressed_count: suppressed.length,
      },
    }).catch(() => {});

    return Response.json({
      success: true,
      scanned_metrics: metrics.length,
      alerts_created: alerts.length,
      suppressed_count: suppressed.length,
      threshold_pct: thresholdPct,
      robust_z_threshold: robustZThreshold,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});