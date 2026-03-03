import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const start = Date.now();

    const task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: "Anomaly Narrative Agent",
      task_type: "anomaly_report",
      status: "running",
      triggered_by: "scheduled",
    });

    const metrics = await base44.asServiceRole.entities.HealthMetric.list('-year', 500);
    const currentYear = new Date().getFullYear();

    // Find metrics with comparison values (disparity analysis)
    const withComparison = metrics.filter(m => m.comparison_value != null && m.value != null);

    // Find year-over-year changes
    const byName = {};
    for (const m of metrics) {
      if (!m.name) continue;
      const k = m.name.toLowerCase().trim();
      if (!byName[k]) byName[k] = [];
      byName[k].push(m);
    }

    const yoyChanges = [];
    for (const [, items] of Object.entries(byName)) {
      const sorted = items.sort((a, b) => a.year - b.year);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1], curr = sorted[i];
        if (prev.value && curr.value) {
          const pct = ((curr.value - prev.value) / Math.abs(prev.value)) * 100;
          if (Math.abs(pct) > 10) {
            yoyChanges.push({ name: curr.name, category: curr.category, region: curr.region, from_year: prev.year, to_year: curr.year, from_val: prev.value, to_val: curr.value, pct_change: pct });
          }
        }
      }
    }

    const disparitySummary = withComparison.slice(0, 20).map(m => {
      const gap = m.value - m.comparison_value;
      return `"${m.name}" (${m.category}, ${m.region}): Métis=${m.value}, BC avg=${m.comparison_value}, gap=${gap > 0 ? '+' : ''}${gap.toFixed(1)}`;
    }).join('\n');

    const changeSummary = yoyChanges.sort((a, b) => Math.abs(b.pct_change) - Math.abs(a.pct_change)).slice(0, 15).map(c =>
      `"${c.name}" (${c.category}): ${c.from_year}→${c.to_year}: ${c.from_val}→${c.to_val} (${c.pct_change > 0 ? '+' : ''}${c.pct_change.toFixed(1)}%)`
    ).join('\n');

    const prompt = `You are a senior health analyst writing the weekly BC Métis Health Intelligence Platform anomaly narrative report. 

Write a professional, plain-language report (400-600 words) covering:
1. **Executive Summary** (2-3 sentences on the most critical findings)
2. **Significant Year-over-Year Changes** — highlight the most concerning increases or decreases
3. **Métis vs BC General Population Disparities** — identify the widest gaps and their implications
4. **Emerging Patterns** — any cross-category or cross-region trends worth watching
5. **Recommended Actions** — 3 specific, actionable recommendations for researchers or policy staff

Use clear headings. Be specific with numbers. Focus on health equity implications for Métis communities.

DATA:

Year-over-year changes (>10% change):
${changeSummary || "No significant YoY changes detected"}

Métis vs BC General Population disparities:
${disparitySummary || "No comparison data available"}

Total dataset: ${metrics.length} metrics across ${new Date().getFullYear() - 5}–${currentYear}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    // Save as a pinned AI insight
    await base44.asServiceRole.entities.AIInsight.create({
      title: `Weekly Anomaly Report — ${new Date().toLocaleDateString("en-CA")}`,
      content: result,
      type: "summary",
      generated_by: "AI Agent — Anomaly Narrative",
      pinned: true,
    });

    const duration = Date.now() - start;
    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: "completed",
      summary: `Weekly anomaly report generated. Analyzed ${yoyChanges.length} YoY changes and ${withComparison.length} disparity metrics.`,
      output: result,
      items_processed: metrics.length,
      items_actioned: 1,
      duration_ms: duration,
    });

    return Response.json({ success: true, report_length: result.length, duration_ms: duration });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});