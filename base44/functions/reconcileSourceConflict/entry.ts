import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function divergence(values: number[]) {
  if (!values.length) return 0;
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === 0) return 0;
  return ((max - min) / Math.abs(max)) * 100;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'user'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const metrics = await base44.asServiceRole.entities.HealthMetric.list('-year', 5000);
    const grouped = new Map<string, any[]>();

    for (const m of metrics) {
      if (!m.name || !m.year || !m.region || m.value == null || !m.data_source_name) continue;
      const key = `${m.name.toLowerCase().trim()}|${m.year}|${m.region}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m);
    }

    const conflicts: any[] = [];
    for (const [key, rows] of grouped.entries()) {
      const sources = [...new Set(rows.map((r) => r.data_source_name))];
      if (sources.length < 2) continue;
      const vals = rows.map((r) => Number(r.value));
      const div = divergence(vals);
      if (div < 5) continue;

      const sortedByFreshness = [...rows].sort((a, b) => Number(b.freshness_score || 0) - Number(a.freshness_score || 0));
      const authoritative = sortedByFreshness[0];

      const candidateReasons = [
        'Different case definitions or collection windows',
        'Release timing mismatch between agencies',
        'Population denominator differences',
      ];

      conflicts.push({
        key,
        metric_name: rows[0].name,
        year: rows[0].year,
        region: rows[0].region,
        category: rows[0].category,
        divergence_pct: Number(div.toFixed(2)),
        sources: rows.map((r) => ({
          source: r.data_source_name,
          value: r.value,
          freshness_score: r.freshness_score ?? null,
          evidence_grade: r.evidence_grade || null,
          metric_id: r.id,
        })),
        likely_authoritative_source: authoritative?.data_source_name || null,
        candidate_reasons: candidateReasons,
      });
    }

    conflicts.sort((a, b) => b.divergence_pct - a.divergence_pct);

    for (const c of conflicts.slice(0, 200)) {
      await base44.asServiceRole.entities.AlertEvent.create({
        alert_type: 'source_conflict',
        severity: c.divergence_pct > 30 ? 'critical' : c.divergence_pct > 15 ? 'high' : 'medium',
        status: 'open',
        category: c.category,
        region: c.region,
        metric_name: c.metric_name,
        summary: `Source conflict (${c.divergence_pct}%): ${c.metric_name} in ${c.region} (${c.year})`,
        description: `Sources disagree for ${c.metric_name}: ${c.sources.map((s: any) => `${s.source}=${s.value}`).join(', ')}`,
        detected_by: 'reconcileSourceConflict',
        detected_at: new Date().toISOString(),
        metadata: c,
      });

      await base44.asServiceRole.entities.DataQualityFlag.create({
        metric_name: c.metric_name,
        flag_type: 'inconsistency',
        severity: c.divergence_pct > 30 ? 'critical' : 'high',
        status: 'open',
        auto_detected: true,
        description: `Conflicting source values detected (${c.divergence_pct}% divergence). Suggested authoritative source: ${c.likely_authoritative_source || 'review needed'}.`,
        category: c.category,
        region: c.region,
        year: c.year,
      });
    }

    const sourceStats = new Map<string, { count: number; severe: number }>();
    for (const c of conflicts) {
      for (const s of c.sources) {
        if (!sourceStats.has(s.source)) sourceStats.set(s.source, { count: 0, severe: 0 });
        const slot = sourceStats.get(s.source)!;
        slot.count += 1;
        if (c.divergence_pct > 15) slot.severe += 1;
      }
    }

    for (const [source, stats] of sourceStats.entries()) {
      const score = Math.max(0, 100 - stats.count * 1.5 - stats.severe * 3);
      const existing = await base44.asServiceRole.entities.SourceReliabilityProfile.filter({ source_name: source }, '-created_date', 1);
      if (existing.length) {
        await base44.asServiceRole.entities.SourceReliabilityProfile.update(existing[0].id, {
          source_name: source,
          reliability_score: Number(score.toFixed(1)),
          conflict_rate: Number((stats.count / Math.max(1, metrics.length)).toFixed(4)),
          severe_conflicts: stats.severe,
          updated_date: new Date().toISOString(),
        });
      } else {
        await base44.asServiceRole.entities.SourceReliabilityProfile.create({
          source_name: source,
          reliability_score: Number(score.toFixed(1)),
          conflict_rate: Number((stats.count / Math.max(1, metrics.length)).toFixed(4)),
          severe_conflicts: stats.severe,
          updated_date: new Date().toISOString(),
        });
      }
    }

    return Response.json({
      success: true,
      conflicts_found: conflicts.length,
      conflicts: conflicts.slice(0, 40),
      message: 'Conflicts reconciled and routed to alert + quality workflows.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
