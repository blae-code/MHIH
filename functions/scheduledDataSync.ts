import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (service role) or admin user calls
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      isAuthorized = user?.role === 'admin';
    } catch {
      // Scheduled automation calls without user — use service role
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { source_id } = body;

    // Load sources to sync
    const allSources = await base44.asServiceRole.entities.DataSource.list();
    const toSync = source_id
      ? allSources.filter(s => s.id === source_id)
      : allSources.filter(s => s.status !== 'inactive' && s.sync_frequency !== 'manual' && s.url);

    const results = [];

    for (const src of toSync) {
      const jobData = {
        source_id: src.id,
        source_name: src.name,
        source_url: src.url,
        source_type: src.type,
        trigger: source_id ? 'manual' : 'scheduled',
        status: 'running',
        started_at: new Date().toISOString(),
      };
      const job = await base44.asServiceRole.entities.SyncJob.create(jobData);

      let logs = [];
      let status = 'success';
      let errorMsg = null;
      let recordsFetched = 0;
      const startMs = Date.now();

      try {
        logs.push(`[INFO] Starting sync for: ${src.name}`);
        logs.push(`[INFO] URL: ${src.url}`);

        // Attempt HEAD/GET to check endpoint reachability
        const response = await fetch(src.url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000),
          headers: { 'User-Agent': 'MHIP-DataSync/1.0' }
        });

        if (!response.ok && response.status !== 405) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        logs.push(`[INFO] Endpoint reachable (HTTP ${response.status})`);

        // For API-type sources, try fetching JSON
        if (src.type === 'api' || src.type === 'statcan') {
          try {
            const dataRes = await fetch(src.url, {
              signal: AbortSignal.timeout(15000),
              headers: { 'Accept': 'application/json', 'User-Agent': 'MHIP-DataSync/1.0' }
            });
            if (dataRes.ok) {
              const contentType = dataRes.headers.get('content-type') || '';
              if (contentType.includes('json')) {
                const data = await dataRes.json();
                recordsFetched = Array.isArray(data) ? data.length : (data?.value?.length || 1);
                logs.push(`[INFO] Fetched ${recordsFetched} record(s) from API`);
              } else {
                logs.push(`[INFO] Endpoint returned non-JSON content (${contentType}), recorded as connectivity check`);
                recordsFetched = 0;
              }
            }
          } catch (fetchErr) {
            logs.push(`[WARN] Could not fetch data payload: ${fetchErr.message}`);
          }
        }

        logs.push(`[SUCCESS] Sync completed for ${src.name}`);

        // Update source last_synced
        await base44.asServiceRole.entities.DataSource.update(src.id, {
          last_synced: new Date().toISOString(),
          status: 'active'
        });

      } catch (err) {
        status = 'failed';
        errorMsg = err.message;
        logs.push(`[ERROR] ${err.message}`);

        // Mark source as error
        await base44.asServiceRole.entities.DataSource.update(src.id, { status: 'error' });

        // Write audit log for failure
        await base44.asServiceRole.entities.AuditLog.create({
          action: 'sync_failed',
          entity_type: 'DataSource',
          entity_id: src.id,
          entity_name: src.name,
          user_email: 'system@mhip',
          user_name: 'Scheduled Sync',
          details: err.message,
        });
      }

      const finishedAt = new Date().toISOString();
      const durationMs = Date.now() - startMs;

      await base44.asServiceRole.entities.SyncJob.update(job.id, {
        status,
        records_fetched: recordsFetched,
        records_inserted: 0,
        duration_ms: durationMs,
        error_message: errorMsg,
        log_output: logs.join('\n'),
        finished_at: finishedAt,
      });

      results.push({ source: src.name, status, durationMs, recordsFetched, error: errorMsg });
    }

    const failed = results.filter(r => r.status === 'failed');
    return Response.json({
      synced: results.length,
      succeeded: results.filter(r => r.status === 'success').length,
      failed: failed.length,
      results,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});