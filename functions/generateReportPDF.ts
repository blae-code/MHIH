import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

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
    const report = await base44.entities.Report.filter({ id: reportId });
    if (!report || report.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const data = report[0];

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(data.title || 'Report', 20, yPosition);
    yPosition += 15;

    // Meta info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const metaText = [
      `Generated: ${new Date(data.generated_at).toLocaleDateString()}`,
      `Metrics: ${data.metric_ids?.length || 0}`,
      `Regions: ${data.regions?.join(', ') || 'All'}`
    ].join(' | ');
    doc.text(metaText, 20, yPosition);
    yPosition += 10;

    if (data.description) {
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const descriptionLines = doc.splitTextToSize(data.description, pageWidth - 40);
      doc.text(descriptionLines, 20, yPosition);
      yPosition += descriptionLines.length * 5 + 5;
    }

    // Add content if exists
    if (data.content) {
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      const contentLines = doc.splitTextToSize(data.content.substring(0, 500), pageWidth - 40);
      doc.text(contentLines, 20, yPosition);
    }

    const pdfBytes = doc.output('arraybuffer');

    // Update report status
    await base44.entities.Report.update(reportId, { status: 'exported' });

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${data.title || 'report'}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});