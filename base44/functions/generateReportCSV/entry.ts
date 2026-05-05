import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await req.json();

    if (!reportId) {
      return Response.json({ error: 'Missing reportId' }, { status: 400 });
    }

    // Fetch the report
    const reportData = await base44.entities.Report.filter({ id: reportId });
    if (!reportData || reportData.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = reportData[0];

    // Fetch the metrics for this report
    let metrics = [];
    if (report.metric_ids && report.metric_ids.length > 0) {
      const query = { id: { $in: report.metric_ids } };
      metrics = await base44.entities.HealthMetric.filter(query);
    }

    // Generate CSV
    const csvHeaders = ['Metric Name', 'Category', 'Region', 'Year', 'Value', 'Unit', 'Confidence'];
    const csvRows = metrics.map(m => [
      m.name || '',
      m.category || '',
      m.region || '',
      m.year || '',
      m.value || '',
      m.unit || '',
      m.confidence_level || ''
    ]);

    const csv = [
      `"${report.title}"`,
      `Generated: ${new Date(report.generated_at).toLocaleDateString()}`,
      '',
      csvHeaders.map(h => `"${h}"`).join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Update report status
    await base44.entities.Report.update(reportId, { status: 'exported' });

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${report.title || 'report'}.csv"`
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});