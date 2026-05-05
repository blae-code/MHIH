import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all active report configurations
    const configs = await base44.entities.ReportConfig.filter({ status: 'active' });

    if (configs.length === 0) {
      return Response.json({ 
        status: 'success', 
        message: 'No active report configurations',
        processed: 0
      });
    }

    const today = new Date();
    const processed = [];

    for (const config of configs) {
      let shouldGenerate = false;

      if (config.schedule === 'daily') {
        shouldGenerate = true;
      } else if (config.schedule === 'weekly' && today.getDay().toString() === config.schedule_day) {
        shouldGenerate = true;
      } else if (config.schedule === 'monthly' && today.getDate().toString() === config.schedule_day) {
        shouldGenerate = true;
      }

      if (shouldGenerate) {
        try {
          // Create report from config
          const report = await base44.entities.Report.create({
            title: config.title,
            description: config.description,
            metric_ids: config.metric_ids,
            regions: config.regions,
            chart_types: config.chart_types,
            config_id: config.id,
            status: 'generated',
            generated_at: new Date().toISOString()
          });

          // Send emails to recipients
          if (config.recipients && config.recipients.length > 0) {
            for (const recipient of config.recipients) {
              await base44.integrations.Core.SendEmail({
                to: recipient,
                subject: `Scheduled Report: ${config.title}`,
                body: `Your scheduled report "${config.title}" has been generated and is ready for download.`
              });
            }
          }

          // Update config's last_generated
          await base44.entities.ReportConfig.update(config.id, {
            last_generated: new Date().toISOString()
          });

          processed.push({ configId: config.id, status: 'success' });
        } catch (error) {
          console.error(`Failed to generate report for config ${config.id}:`, error);
          processed.push({ configId: config.id, status: 'error', error: error.message });
        }
      }
    }

    return Response.json({ 
      status: 'success',
      message: `Processed ${processed.length} report configurations`,
      processed
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});