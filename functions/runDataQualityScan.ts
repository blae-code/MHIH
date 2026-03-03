import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admins or service role (for scheduled runs)
    let authorized = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin' || user?.role === 'analyst') authorized = true;
    } catch (_) {}

    if (!authorized) {
      try {
        await base44.asServiceRole.entities.DataQualityFlag.list(); // probe service role
        authorized = true;
      } catch (_) {}
    }

    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const metrics = await base44.asServiceRole.entities.HealthMetric.list('-year', 2000);

    const flags = [];
    const now = new Date().toISOString();

    // ── 1. MISSING VALUES ──────────────────────────────────────────────
    for (const m of metrics) {
      if (m.value == null || m.value === undefined) {
        flags.push({
          metric_id: m.id,
          metric_name: m.name,
          flag_type: 'missing_value',
          severity: 'critical',
          description: `Metric "${m.name}" has no value recorded.`,
          affected_field: 'value',
          affected_value: 'null',
          status: 'open',
          auto_detected: true,
          category: m.category,
          region: m.region,
          year: m.year,
        });
      }
      if (!m.year) {
        flags.push({
          metric_id: m.id,
          metric_name: m.name,
          flag_type: 'missing_value',
          severity: 'high',
          description: `Metric "${m.name}" is missing a year reference.`,
          affected_field: 'year',
          affected_value: 'null',
          status: 'open',
          auto_detected: true,
          category: m.category,
          region: m.region,
        });
      }
      if (!m.category) {
        flags.push({
          metric_id: m.id,
          metric_name: m.name,
          flag_type: 'missing_value',
          severity: 'medium',
          description: `Metric "${m.name}" has no category assigned.`,
          affected_field: 'category',
          affected_value: 'null',
          status: 'open',
          auto_detected: true,
          region: m.region,
          year: m.year,
        });
      }
    }

    // ── 2. STATISTICAL OUTLIERS (z-score per category) ─────────────────
    const byCategory = {};
    for (const m of metrics) {
      if (m.value == null || !m.category) continue;
      if (!byCategory[m.category]) byCategory[m.category] = [];
      byCategory[m.category].push(m);
    }

    for (const [cat, items] of Object.entries(byCategory)) {
      if (items.length < 4) continue;
      const values = items.map(i => i.value);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
      if (std === 0) continue;

      for (const m of items) {
        const z = Math.abs((m.value - mean) / std);
        if (z > 3) {
          flags.push({
            metric_id: m.id,
            metric_name: m.name,
            flag_type: 'outlier',
            severity: z > 4 ? 'critical' : 'high',
            description: `"${m.name}" value ${m.value} is a statistical outlier (z=${z.toFixed(2)}) in category "${cat}". Mean: ${mean.toFixed(2)}, Std: ${std.toFixed(2)}.`,
            affected_field: 'value',
            affected_value: String(m.value),
            expected_range_min: parseFloat((mean - 3 * std).toFixed(2)),
            expected_range_max: parseFloat((mean + 3 * std).toFixed(2)),
            status: 'open',
            auto_detected: true,
            category: m.category,
            region: m.region,
            year: m.year,
          });
        }
      }
    }

    // ── 3. INVALID RANGE (percentages > 100 or negatives) ─────────────
    for (const m of metrics) {
      if (m.value == null) continue;
      const unit = (m.unit || '').toLowerCase();
      if ((unit === '%' || unit.includes('percent')) && (m.value < 0 || m.value > 100)) {
        flags.push({
          metric_id: m.id,
          metric_name: m.name,
          flag_type: 'invalid_range',
          severity: 'critical',
          description: `"${m.name}" has value ${m.value} but unit is "${m.unit}" — percentage must be 0–100.`,
          affected_field: 'value',
          affected_value: String(m.value),
          expected_range_min: 0,
          expected_range_max: 100,
          status: 'open',
          auto_detected: true,
          category: m.category,
          region: m.region,
          year: m.year,
        });
      }
      if (m.value < 0 && !unit.includes('change') && !unit.includes('delta') && !unit.includes('diff')) {
        flags.push({
          metric_id: m.id,
          metric_name: m.name,
          flag_type: 'invalid_range',
          severity: 'high',
          description: `"${m.name}" has a negative value (${m.value}) which is unexpected for this metric type.`,
          affected_field: 'value',
          affected_value: String(m.value),
          status: 'open',
          auto_detected: true,
          category: m.category,
          region: m.region,
          year: m.year,
        });
      }
    }

    // ── 4. DUPLICATES (same name + year + region) ──────────────────────
    const seen = {};
    for (const m of metrics) {
      const key = `${(m.name || '').toLowerCase().trim()}|${m.year}|${m.region}`;
      if (!seen[key]) { seen[key] = [m]; }
      else { seen[key].push(m); }
    }
    for (const [key, items] of Object.entries(seen)) {
      if (items.length > 1) {
        // Only flag each set once
        flags.push({
          metric_id: items[0].id,
          metric_name: items[0].name,
          flag_type: 'duplicate',
          severity: 'medium',
          description: `${items.length} duplicate entries for "${items[0].name}" (year ${items[0].year}, region ${items[0].region}). IDs: ${items.map(i => i.id.slice(-6)).join(', ')}.`,
          affected_field: 'name+year+region',
          affected_value: key,
          status: 'open',
          auto_detected: true,
          category: items[0].category,
          region: items[0].region,
          year: items[0].year,
        });
      }
    }

    // ── 5. STALE DATA (last year of data is more than 5 years old) ─────
    const currentYear = new Date().getFullYear();
    const byMetricName = {};
    for (const m of metrics) {
      if (!m.name || !m.year) continue;
      const k = m.name.toLowerCase().trim();
      if (!byMetricName[k] || m.year > byMetricName[k].year) byMetricName[k] = m;
    }
    for (const [, m] of Object.entries(byMetricName)) {
      if (m.year <= currentYear - 5) {
        flags.push({
          metric_id: m.id,
          metric_name: m.name,
          flag_type: 'stale_data',
          severity: m.year <= currentYear - 8 ? 'high' : 'low',
          description: `"${m.name}" most recent data is from ${m.year} (${currentYear - m.year} years old).`,
          affected_field: 'year',
          affected_value: String(m.year),
          status: 'open',
          auto_detected: true,
          category: m.category,
          region: m.region,
          year: m.year,
        });
      }
    }

    // ── Clear existing auto-detected open flags, insert fresh ──────────
    const existing = await base44.asServiceRole.entities.DataQualityFlag.filter({ auto_detected: true, status: 'open' }, '-created_date', 2000);
    await Promise.all(existing.map(f => base44.asServiceRole.entities.DataQualityFlag.delete(f.id)));

    let inserted = 0;
    for (const flag of flags) {
      await base44.asServiceRole.entities.DataQualityFlag.create(flag);
      inserted++;
    }

    return Response.json({
      success: true,
      metrics_scanned: metrics.length,
      flags_generated: inserted,
      breakdown: {
        missing_value: flags.filter(f => f.flag_type === 'missing_value').length,
        outlier: flags.filter(f => f.flag_type === 'outlier').length,
        invalid_range: flags.filter(f => f.flag_type === 'invalid_range').length,
        duplicate: flags.filter(f => f.flag_type === 'duplicate').length,
        stale_data: flags.filter(f => f.flag_type === 'stale_data').length,
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});