import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const start = Date.now();

    const task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: "Insight Generator",
      task_type: "insight_generation",
      status: "running",
      triggered_by: "scheduled",
    });

    const metrics = await base44.asServiceRole.entities.HealthMetric.list('-year', 500);
    if (metrics.length === 0) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, { status: "completed", summary: "No metrics found to analyze.", items_processed: 0, items_actioned: 0, duration_ms: Date.now() - start });
      return Response.json({ success: true, insights_created: 0 });
    }

    // Build a rich data summary for the LLM
    const byCategory = {};
    const byRegion = {};
    const byYear = {};
    for (const m of metrics) {
      if (m.category) { byCategory[m.category] = byCategory[m.category] || []; byCategory[m.category].push(m); }
      if (m.region) { byRegion[m.region] = byRegion[m.region] || []; byRegion[m.region].push(m); }
      if (m.year) { byYear[m.year] = byYear[m.year] || []; byYear[m.year].push(m); }
    }

    const categorySummary = Object.entries(byCategory).map(([cat, items]) => {
      const avg = items.reduce((s, m) => s + (m.value || 0), 0) / items.length;
      const sorted = [...items].sort((a, b) => b.value - a.value);
      return `${cat}: ${items.length} metrics, avg value ${avg.toFixed(2)}, highest: "${sorted[0]?.name}" (${sorted[0]?.value}), lowest: "${sorted[sorted.length-1]?.name}" (${sorted[sorted.length-1]?.value})`;
    }).join('\n');

    const yearSummary = Object.entries(byYear).sort(([a],[b]) => b-a).slice(0,5).map(([yr, items]) => {
      const avg = items.reduce((s, m) => s + (m.value || 0), 0) / items.length;
      return `Year ${yr}: ${items.length} metrics, avg ${avg.toFixed(2)}`;
    }).join('\n');

    const prompt = `You are a health data analyst for the BC Métis Health Intelligence Platform (MHIP). 
Analyze the following health metrics summary and generate 3 distinct, specific, actionable AI insights for Métis health researchers and policy makers.

DATASET SUMMARY (${metrics.length} total metrics):

By Category:
${categorySummary}

By Year (recent):
${yearSummary}

For each insight, provide:
1. A specific, descriptive title
2. A detailed paragraph (150-250 words) covering: what the data shows, why it matters for Métis health equity, and what action or further investigation is recommended
3. The insight type (choose one: trend_analysis, anomaly, comparison, recommendation, summary)
4. Most relevant categories (1-3)

Focus on: disparities vs BC general population, concerning trends, data gaps, and policy-relevant findings.
Be specific — name actual categories, values, and regions where possible.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                type: { type: "string" },
                categories: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    let created = 0;
    for (const ins of (result.insights || [])) {
      await base44.asServiceRole.entities.AIInsight.create({
        title: ins.title,
        content: ins.content,
        type: ins.type || "summary",
        related_metrics: ins.categories || [],
        generated_by: "AI Agent — Insight Generator",
        pinned: false,
        category: ins.categories?.[0] || "general",
      });
      created++;
    }

    const duration = Date.now() - start;
    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: "completed",
      summary: `Generated ${created} new AI insights from ${metrics.length} metrics.`,
      items_processed: metrics.length,
      items_actioned: created,
      duration_ms: duration,
    });

    return Response.json({ success: true, insights_created: created, duration_ms: duration });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});