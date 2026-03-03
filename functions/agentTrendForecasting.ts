import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const start = Date.now();

    const task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: "Trend Forecasting Agent",
      task_type: "trend_forecast",
      status: "running",
      triggered_by: "scheduled",
    });

    const metrics = await base44.asServiceRole.entities.HealthMetric.list('-year', 2000);

    if (metrics.length < 5) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, {
        status: "completed",
        summary: "Insufficient historical data for forecasting (need at least 5 metrics).",
        items_processed: 0, items_actioned: 0, duration_ms: Date.now() - start,
      });
      return Response.json({ success: true, message: "Not enough data" });
    }

    // ── Group metrics by (name + region) to build time series ──
    const seriesMap = {};
    for (const m of metrics) {
      if (m.value == null || !m.year || !m.name) continue;
      const key = `${m.name.toLowerCase().trim()}|${m.region || 'BC'}`;
      if (!seriesMap[key]) seriesMap[key] = { name: m.name, category: m.category, region: m.region || 'BC', unit: m.unit || '', points: [] };
      seriesMap[key].points.push({ year: m.year, value: m.value, comparison_value: m.comparison_value ?? null });
    }

    // Keep only series with ≥3 data points (enough to detect a trend)
    const richSeries = Object.values(seriesMap)
      .filter(s => s.points.length >= 3)
      .map(s => ({ ...s, points: s.points.sort((a, b) => a.year - b.year) }));

    if (richSeries.length === 0) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, {
        status: "completed",
        summary: "No metrics have enough historical data points (≥3 years) to forecast.",
        items_processed: metrics.length, items_actioned: 0, duration_ms: Date.now() - start,
      });
      return Response.json({ success: true, message: "No forecastable series" });
    }

    // ── Simple linear regression per series to compute slope ──
    const seriesWithSlope = richSeries.map(s => {
      const n = s.points.length;
      const xs = s.points.map(p => p.year);
      const ys = s.points.map(p => p.value);
      const xMean = xs.reduce((a, b) => a + b, 0) / n;
      const yMean = ys.reduce((a, b) => a + b, 0) / n;
      const slope = xs.reduce((acc, x, i) => acc + (x - xMean) * (ys[i] - yMean), 0) /
                    xs.reduce((acc, x) => acc + (x - xMean) ** 2, 0);
      const lastPoint = s.points[s.points.length - 1];
      const lastYear = lastPoint.year;
      const projected1yr = lastPoint.value + slope;
      const projected3yr = lastPoint.value + slope * 3;
      const pctChange1yr = lastPoint.value !== 0 ? (slope / Math.abs(lastPoint.value)) * 100 : 0;
      return { ...s, slope, lastYear, lastValue: lastPoint.value, projected1yr, projected3yr, pctChange1yr, lastComparison: lastPoint.comparison_value };
    });

    // Sort by absolute rate of change — most concerning first
    seriesWithSlope.sort((a, b) => Math.abs(b.pctChange1yr) - Math.abs(a.pctChange1yr));

    // Pick top 30 most dynamic series for LLM analysis
    const topSeries = seriesWithSlope.slice(0, 30);

    // ── Build data summary for the LLM ──
    const trendLines = topSeries.map(s => {
      const dir = s.slope > 0 ? '↑ increasing' : '↓ decreasing';
      const disparityNote = s.lastComparison != null
        ? `, BC avg=${s.lastComparison}${s.unit} (gap: ${(s.lastValue - s.lastComparison).toFixed(1)})`
        : '';
      const historyStr = s.points.map(p => `${p.year}:${p.value}${s.unit}`).join(', ');
      return `"${s.name}" (${s.category}, ${s.region}): [${historyStr}] — ${dir} at ${Math.abs(s.slope.toFixed(2))}${s.unit}/yr. 1-yr projection: ${s.projected1yr.toFixed(1)}${s.unit}, 3-yr: ${s.projected3yr.toFixed(1)}${s.unit}${disparityNote}`;
    }).join('\n');

    const currentYear = new Date().getFullYear();

    const prompt = `You are a senior epidemiologist and health equity analyst for the BC Métis Health Intelligence Platform.

Using the historical trend data and linear projections below, produce a FORECAST INTELLIGENCE REPORT for BC Métis health outcomes. This report is for policymakers and health equity advocates.

Report structure (use these exact headings):

## Forecast Intelligence Report — ${currentYear}

### Executive Warning Summary
(3-4 sentences. Lead with the 2-3 most urgent projected risks over the next 1-3 years.)

### High-Risk Trajectories (Next 12 Months)
(List 5-8 metrics projected to worsen significantly. For each: name, projected value, % change, and why this matters for Métis health equity.)

### Widening Disparities Alert
(Identify metrics where the Métis-BC gap is projected to grow. Be specific with numbers.)

### Positive Trends Worth Protecting
(2-3 metrics showing improvement — note what may be working and risks of reversal.)

### 3-Year Risk Horizon
(Medium-term outlook: which categories or regions face compounding risks if current trajectories continue?)

### Early Warning Indicators
(5 specific metric thresholds that should trigger immediate policy review if crossed. Format: "If [metric] exceeds [value] in [region], this signals...")

### Policy Recommendations
(5 prioritized, numbered recommendations. Each must be concrete, actionable, and linked to a specific projected risk.)

---

HISTORICAL DATA & PROJECTIONS (${topSeries.length} time series with ≥3 data points):
${trendLines}

Total dataset coverage: ${metrics.length} metrics | ${richSeries.length} forecastable series | Horizon: ${currentYear + 1}–${currentYear + 3}

IMPORTANT: Be specific with numbers. Flag urgent situations clearly. Use "Métis communities" language. Focus on actionable intelligence for policymakers.`;

    const reportContent = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    // Save as a pinned AI insight
    const insight = await base44.asServiceRole.entities.AIInsight.create({
      title: `Trend Forecast & Early Warning Report — ${currentYear}`,
      content: reportContent,
      type: "trend_analysis",
      generated_by: "AI Agent — Trend Forecasting",
      pinned: true,
      category: "all",
      related_metrics: topSeries.slice(0, 10).map(s => s.name),
    });

    const duration = Date.now() - start;
    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: "completed",
      summary: `Forecast report generated. Analyzed ${richSeries.length} time series across ${[...new Set(topSeries.map(s => s.category))].length} categories and ${[...new Set(topSeries.map(s => s.region))].length} regions.`,
      output: reportContent,
      items_processed: metrics.length,
      items_actioned: richSeries.length,
      duration_ms: duration,
    });

    return Response.json({ success: true, insight_id: insight.id, series_analyzed: richSeries.length, duration_ms: duration });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});