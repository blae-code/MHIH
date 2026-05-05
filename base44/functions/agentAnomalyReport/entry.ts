import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const start = Date.now();

    const task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: "Weekly Summary Report Agent",
      task_type: "anomaly_report",
      status: "running",
      triggered_by: "scheduled",
    });

    const metrics = await base44.asServiceRole.entities.HealthMetric.list('-year', 2000);
    const currentYear = new Date().getFullYear();

    if (metrics.length === 0) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, {
        status: "completed", summary: "No metrics found to report on.", items_processed: 0, items_actioned: 0, duration_ms: Date.now() - start
      });
      return Response.json({ success: true, message: "No data" });
    }

    // ── Year-over-year changes (>5% threshold for stakeholder relevance) ──
    const byName = {};
    for (const m of metrics) {
      if (!m.name) continue;
      const k = `${m.name.toLowerCase().trim()}|${m.region || 'BC'}`;
      if (!byName[k]) byName[k] = [];
      byName[k].push(m);
    }

    const yoyChanges = [];
    for (const [, items] of Object.entries(byName)) {
      const sorted = items.sort((a, b) => a.year - b.year);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1], curr = sorted[i];
        if (prev.value != null && curr.value != null && prev.value !== 0) {
          const pct = ((curr.value - prev.value) / Math.abs(prev.value)) * 100;
          if (Math.abs(pct) >= 5) {
            yoyChanges.push({
              name: curr.name, category: curr.category, region: curr.region,
              from_year: prev.year, to_year: curr.year,
              from_val: prev.value, to_val: curr.value,
              pct_change: pct, unit: curr.unit || ''
            });
          }
        }
      }
    }

    // ── Disparity analysis (Métis vs BC average) ──
    const withComparison = metrics.filter(m => m.comparison_value != null && m.value != null)
      .map(m => ({
        ...m,
        gap_abs: m.value - m.comparison_value,
        gap_pct: m.comparison_value !== 0 ? ((m.value - m.comparison_value) / Math.abs(m.comparison_value)) * 100 : 0
      }))
      .sort((a, b) => Math.abs(b.gap_pct) - Math.abs(a.gap_pct));

    // ── Regional breakdown ──
    const byRegion = {};
    for (const m of metrics) {
      const r = m.region || 'BC';
      if (!byRegion[r]) byRegion[r] = { count: 0, total: 0, categories: new Set() };
      byRegion[r].count++;
      if (m.value != null) byRegion[r].total += m.value;
      if (m.category) byRegion[r].categories.add(m.category);
    }

    // ── Category highlights ──
    const byCategory = {};
    for (const m of metrics) {
      if (!m.category) continue;
      if (!byCategory[m.category]) byCategory[m.category] = { count: 0, metrics: [] };
      byCategory[m.category].count++;
      if (m.value != null) byCategory[m.category].metrics.push(m);
    }

    // Build data summaries for the LLM
    const changeSummary = yoyChanges
      .sort((a, b) => Math.abs(b.pct_change) - Math.abs(a.pct_change))
      .slice(0, 20)
      .map(c => `• "${c.name}" (${c.category}, ${c.region || 'BC'}): ${c.from_year}→${c.to_year}: ${c.from_val}${c.unit} → ${c.to_val}${c.unit} (${c.pct_change > 0 ? '+' : ''}${c.pct_change.toFixed(1)}%)`)
      .join('\n');

    const disparitySummary = withComparison.slice(0, 15)
      .map(m => `• "${m.name}" (${m.category}, ${m.region}): Métis=${m.value}${m.unit||''}, BC avg=${m.comparison_value}${m.unit||''}, gap=${m.gap_abs > 0 ? '+' : ''}${m.gap_abs.toFixed(1)} (${m.gap_pct > 0 ? '+' : ''}${m.gap_pct.toFixed(0)}%)`)
      .join('\n');

    const regionSummary = Object.entries(byRegion)
      .map(([r, d]) => `• ${r}: ${d.count} metrics across ${[...d.categories].slice(0,4).join(', ')}`)
      .join('\n');

    const categorySummary = Object.entries(byCategory)
      .map(([cat, d]) => `• ${cat.replace(/_/g, ' ')}: ${d.count} data points`)
      .join('\n');

    const reportDate = new Date().toLocaleDateString("en-CA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const weekNum = Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 604800000);

    const prompt = `You are a senior health analyst at the BC Métis Health Intelligence Platform. 
Write the Week ${weekNum} (${reportDate}) Weekly Health Summary Report for distribution to Métis Nation BC stakeholders, policy advisors, and health researchers.

This report must be professional, plain-language, and ready for direct stakeholder communication (e.g., email briefings, board presentations, or inclusion in data exports).

Structure the report with these exact sections:

---
# BC Métis Health Intelligence Platform
## Weekly Summary Report — Week ${weekNum}, ${currentYear}
*Generated: ${reportDate}*

### Executive Summary
(2-3 sentences. Lead with the single most important finding. Mention overall data coverage.)

### Key Metric Changes This Period
(Top 5-8 notable year-over-year changes with specific numbers. Flag whether each change is concerning ↑ or improving ↓ for Métis health equity. Group by theme where possible.)

### Regional Highlights
(2-3 sentences per notable region. Focus on Northern BC and regions with the most significant changes or data gaps.)

### Category Deep-Dive
(One paragraph each for the top 3 categories with the most notable findings — e.g. mental health, chronic disease, maternal/child health.)

### Métis–BC Population Disparities
(Summarize the most significant health equity gaps. Use plain language. Note whether gaps are widening or narrowing based on trend data.)

### Emerging Trends to Watch
(Bullet list of 3-5 patterns that may require policy attention in coming weeks/months.)

### Recommended Actions
(3 specific, numbered recommendations — for health researchers, data team, and policy staff respectively.)

---

BASE DATA:

Year-over-year changes (≥5%):
${changeSummary || "Insufficient trend data for this period"}

Métis vs BC population disparities (sorted by gap magnitude):
${disparitySummary || "No comparison data available"}

Regional data coverage:
${regionSummary}

Category breakdown:
${categorySummary}

Total dataset: ${metrics.length} metrics | ${yoyChanges.length} significant changes detected | ${withComparison.length} disparity comparisons available

IMPORTANT: Use specific numbers and metric names from the data. Write in plain English suitable for non-technical stakeholders. Avoid jargon. Use "Métis communities" not "the population". Maintain a factual but health-equity-conscious tone.`;

    const reportContent = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    // Save as a pinned AI insight so it surfaces prominently
    const insight = await base44.asServiceRole.entities.AIInsight.create({
      title: `Weekly Summary Report — Week ${weekNum}, ${currentYear}`,
      content: reportContent,
      type: "summary",
      generated_by: "AI Agent — Weekly Summary Report",
      pinned: true,
      category: "all",
    });

    const duration = Date.now() - start;
    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: "completed",
      summary: `Week ${weekNum} stakeholder report generated. ${yoyChanges.length} metric changes analyzed across ${Object.keys(byRegion).length} regions and ${Object.keys(byCategory).length} categories.`,
      output: reportContent,
      items_processed: metrics.length,
      items_actioned: 1,
      duration_ms: duration,
    });

    return Response.json({ success: true, insight_id: insight.id, report_length: reportContent.length, duration_ms: duration });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});