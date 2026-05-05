import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function daysAgo(ts?: string) {
  if (!ts) return 999;
  const ms = Date.now() - new Date(ts).getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'user'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [sources, jobs, metrics, flags] = await Promise.all([
      base44.asServiceRole.entities.DataSource.list('-updated_date', 500),
      base44.asServiceRole.entities.SyncJob.list('-created_date', 2000),
      base44.asServiceRole.entities.HealthMetric.list('-year', 4000),
      base44.asServiceRole.entities.DataQualityFlag.filter({ status: 'open' }, '-created_date', 2000),
    ]);

    const profiles: any[] = [];
    for (const src of sources) {
      const srcJobs = jobs.filter((j: any) => j.source_id === src.id);
      const srcMetrics = metrics.filter((m: any) => m.data_source_name === src.name || m.data_source_id === src.id);
      const srcFlags = flags.filter((f: any) => f.data_source_name === src.name || f.source_id === src.id);

      const syncSuccessRate = srcJobs.length
        ? srcJobs.filter((j: any) => j.status === 'success').length / srcJobs.length
        : 0.8;

      const freshnessDays = daysAgo(src.last_synced || src.updated_date);
      const freshnessScore = freshnessDays > 120 ? 0.25 : freshnessDays > 60 ? 0.45 : freshnessDays > 30 ? 0.65 : 0.9;

      const qualityPenalty = clamp(srcFlags.length * 2.5, 0, 40);
      const coverageScore = srcMetrics.length > 300 ? 0.95 : srcMetrics.length > 100 ? 0.8 : srcMetrics.length > 30 ? 0.65 : 0.45;

      const reliability = clamp(
        syncSuccessRate * 40 +
        freshnessScore * 25 +
        coverageScore * 20 +
        (1 - qualityPenalty / 100) * 15,
        0,
        100,
      );

      const payload = {
        source_id: src.id,
        source_name: src.name,
        reliability_score: Number(reliability.toFixed(1)),
        sync_success_rate: Number(syncSuccessRate.toFixed(3)),
        freshness_days: Number(freshnessDays.toFixed(1)),
        freshness_score: Number(freshnessScore.toFixed(3)),
        quality_open_flags: srcFlags.length,
        coverage_metrics_count: srcMetrics.length,
        reliability_tier: reliability >= 85 ? 'high' : reliability >= 65 ? 'moderate' : 'low',
        notes: `Auto-scored using sync, freshness, quality, and coverage signals.`,
        updated_date: new Date().toISOString(),
      };

      const existing = await base44.asServiceRole.entities.SourceReliabilityProfile.filter({ source_id: src.id }, '-created_date', 1);
      if (existing.length) {
        await base44.asServiceRole.entities.SourceReliabilityProfile.update(existing[0].id, payload);
        profiles.push({ ...payload, id: existing[0].id });
      } else {
        const created = await base44.asServiceRole.entities.SourceReliabilityProfile.create(payload);
        profiles.push(created);
      }
    }

    profiles.sort((a, b) => b.reliability_score - a.reliability_score);

    return Response.json({
      success: true,
      scored_sources: profiles.length,
      profiles,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
