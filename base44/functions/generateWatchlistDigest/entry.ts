import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function containsAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some(w => lower.includes(w.toLowerCase()));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let authorized = false;
    let actor = 'system@mhip';
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin' || user?.role === 'user') {
        authorized = true;
        actor = user.email || actor;
      }
    } catch {
      authorized = true;
    }

    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const missionId = body.mission_id || null;

    const allMissions = missionId
      ? await base44.asServiceRole.entities.WatchlistMission.filter({ id: missionId }, '-created_date', 1)
      : await base44.asServiceRole.entities.WatchlistMission.filter({ status: 'active' }, '-updated_date', 200);

    const missions = allMissions || [];
    if (!missions.length) {
      return Response.json({ success: true, scanned_missions: 0, breaches: 0, message: 'No active watchlist missions found.' });
    }

    const metrics = await base44.asServiceRole.entities.HealthMetric.list('-year', 5000);

    const allBreaches: any[] = [];
    for (const mission of missions) {
      const keywords = Array.isArray(mission.metric_keywords)
        ? mission.metric_keywords
        : String(mission.metric_keywords || '').split(',').map((s: string) => s.trim()).filter(Boolean);

      const thresholdPct = Number(mission.threshold_pct ?? 12);
      const region = mission.region || 'all';
      const category = mission.category || 'all';

      const candidate = metrics.filter((m: any) => {
        const catOk = category === 'all' || m.category === category;
        const regOk = region === 'all' || m.region === region;
        const keyOk = !keywords.length || containsAny(`${m.name || ''} ${m.category || ''}`, keywords);
        return catOk && regOk && keyOk && m.value != null && m.year != null;
      });

      const grouped = new Map<string, any[]>();
      for (const m of candidate) {
        const key = `${m.name}|${m.region || 'BC'}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(m);
      }

      let missionBreaches = 0;
      for (const [key, rows] of grouped.entries()) {
        const ordered = rows.sort((a, b) => a.year - b.year);
        if (ordered.length < 2) continue;

        const prev = ordered[ordered.length - 2];
        const curr = ordered[ordered.length - 1];
        if (!prev.value) continue;

        const pct = ((Number(curr.value) - Number(prev.value)) / Math.abs(Number(prev.value))) * 100;
        if (Math.abs(pct) < thresholdPct) continue;

        missionBreaches += 1;
        const breach = {
          mission_id: mission.id,
          mission_name: mission.name,
          metric_name: curr.name,
          region: curr.region || 'BC',
          category: curr.category || 'other',
          from_year: prev.year,
          to_year: curr.year,
          pct_change: Number(pct.toFixed(2)),
          threshold_pct: thresholdPct,
          severity: Math.abs(pct) > thresholdPct * 2 ? 'high' : 'medium',
        };
        allBreaches.push(breach);

        await base44.asServiceRole.entities.AlertEvent.create({
          alert_type: 'watchlist_breach',
          severity: breach.severity,
          status: 'open',
          category: breach.category,
          region: breach.region,
          metric_name: breach.metric_name,
          lead_time_score: Number(Math.min(100, Math.abs(pct) * 2).toFixed(1)),
          confidence_score: Number(curr.freshness_score ?? 0.7),
          summary: `${mission.name}: ${breach.metric_name} moved ${breach.pct_change}% (${breach.from_year} -> ${breach.to_year})`,
          description: `Watchlist threshold breach (${thresholdPct}%) detected for mission ${mission.name}.`,
          detected_by: 'generateWatchlistDigest',
          detected_at: new Date().toISOString(),
          metadata: breach,
        });
      }

      await base44.asServiceRole.entities.WatchlistMission.update(mission.id, {
        last_run_at: new Date().toISOString(),
        last_breach_count: missionBreaches,
      }).catch(() => {});
    }

    const topLines = allBreaches
      .sort((a, b) => Math.abs(b.pct_change) - Math.abs(a.pct_change))
      .slice(0, 12)
      .map((b) => `- ${b.mission_name}: ${b.metric_name} (${b.region}) ${b.pct_change}%`)
      .join('\n');

    await base44.asServiceRole.entities.AIInsight.create({
      title: `Watchlist Digest — ${new Date().toLocaleDateString('en-CA')}`,
      type: 'watchlist_digest',
      content: topLines || 'No watchlist breaches detected in this scan.',
      generated_by: 'Watchlist Monitor',
      confidence_score: 0.88,
      requires_approval: false,
      approval_status: 'approved',
    }).catch(() => {});

    return Response.json({
      success: true,
      scanned_missions: missions.length,
      breaches: allBreaches.length,
      mission_breaches: allBreaches,
      message: allBreaches.length ? 'Watchlist breaches detected and alerts created.' : 'No watchlist breaches detected.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
