import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { assertScopes } from './_shared/auth/assertScopes.ts';
import { createRequestId, ApiError, jsonError, jsonSuccess } from './_shared/http/errorEnvelope.ts';
import { assertRateLimit } from './_shared/http/rateLimit.ts';
import { logApiAudit } from './_shared/http/audit.ts';
import { exportEvidenceSnapshotRequestSchema, parseOrThrow } from './_shared/redriverValidators.ts';
import { loadSnapshotForMode } from './_shared/snapshots/loadSnapshot.ts';

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function utf8ToBase64(value: string) {
  return bytesToBase64(new TextEncoder().encode(value));
}

function toCsv(snapshot: any) {
  const rows = [
    ['metric_id', 'series_key', 'year', 'value', 'suppression_applied', 'suppression_reason'],
  ];
  for (const series of snapshot.data || []) {
    for (const point of series.points || []) {
      rows.push([
        String(series.metric_id || ''),
        String(series.series_key || ''),
        String(point.year ?? ''),
        String(point.value ?? ''),
        String(Boolean(point.suppression_applied)),
        String(point.suppression_reason || ''),
      ]);
    }
  }
  return rows
    .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

async function toPdfBase64(snapshot: any) {
  const { jsPDF } = await import('npm:jspdf@2.5.2');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  doc.setFontSize(15);
  doc.text(snapshot.title || 'Evidence Snapshot', 40, 48);

  doc.setFontSize(10);
  const metadata = [
    `Snapshot ID: ${snapshot.snapshot_id}`,
    `Projection mode: ${snapshot.projection_mode}`,
    `Created at: ${snapshot.created_at}`,
    `Series: ${snapshot.series_manifest?.total_series ?? 0}`,
    `Points: ${snapshot.series_manifest?.total_points ?? 0}`,
  ];
  doc.text(metadata, 40, 72);

  let y = 140;
  const topSeries = (snapshot.data || []).slice(0, 8);
  doc.setFontSize(11);
  doc.text('Series summary', 40, y);
  y += 18;
  doc.setFontSize(9);
  for (const item of topSeries) {
    const line = `${item.metric_name || item.metric_id} | ${item.series_key} | points=${(item.points || []).length}`;
    doc.text(line.slice(0, 110), 40, y);
    y += 14;
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
  }

  const charts = snapshot.artifacts?.charts || [];
  for (const chart of charts) {
    const dataUrl = String(chart?.png_data_url || '');
    if (!dataUrl.startsWith('data:image')) continue;
    if (y > 500) {
      doc.addPage();
      y = 50;
    }
    doc.setFontSize(10);
    doc.text(String(chart?.title || 'Chart'), 40, y);
    y += 12;
    try {
      doc.addImage(dataUrl, 'PNG', 40, y, 520, 280);
      y += 295;
    } catch {
      doc.setFontSize(9);
      doc.text('Chart image could not be embedded.', 40, y);
      y += 16;
    }
  }

  const arr = doc.output('arraybuffer');
  return bytesToBase64(new Uint8Array(arr));
}

Deno.serve(async (req) => {
  const requestId = createRequestId();
  const base44 = createClientFromRequest(req);
  let principalId = 'anonymous';
  let principalType = 'unknown';
  let principalScopes: string[] = [];

  try {
    const principal = await assertScopes(req, ['rr_os:snapshots']);
    principalId = principal.principal_id;
    principalType = principal.principal_type;
    principalScopes = principal.scopes;
    assertRateLimit({ bucket: 'rr_snapshot_export', principalId, limit: 10 });

    const body = await req.json().catch(() => ({}));
    const input = parseOrThrow(exportEvidenceSnapshotRequestSchema, body);
    const projectionMode = input.projection_mode || 'projected';
    const loaded = await loadSnapshotForMode({
      base44,
      snapshotId: input.snapshot_id,
      projectionMode,
      principalScopes,
    });
    const snapshot = loaded.snapshot;

    let mimeType = 'application/json';
    let fileName = `${snapshot.snapshot_id}.json`;
    let contentBase64 = '';

    if (input.format === 'json') {
      contentBase64 = utf8ToBase64(JSON.stringify(snapshot, null, 2));
      mimeType = 'application/json';
      fileName = `${snapshot.snapshot_id}.json`;
    } else if (input.format === 'csv') {
      contentBase64 = utf8ToBase64(toCsv(snapshot));
      mimeType = 'text/csv';
      fileName = `${snapshot.snapshot_id}.csv`;
    } else if (input.format === 'pdf') {
      try {
        contentBase64 = await toPdfBase64(snapshot);
      } catch (error) {
        throw new ApiError(
          'Failed to generate PDF export',
          500,
          'pdf_export_failed',
          { cause: String((error as any)?.message || error) },
        );
      }
      mimeType = 'application/pdf';
      fileName = `${snapshot.snapshot_id}.pdf`;
    }

    await logApiAudit(base44, {
      action: 'rr_os_snapshot_export',
      principalId,
      principalType,
      requestId,
      endpoint: 'api_exportEvidenceSnapshot',
      status: 'success',
      details: {
        snapshot_id: input.snapshot_id,
        format: input.format,
        projection_mode: projectionMode,
      },
    });

    return jsonSuccess(
      {
        format: input.format,
        file_name: fileName,
        mime_type: mimeType,
        content_base64: contentBase64,
      },
      requestId,
    );
  } catch (error) {
    await logApiAudit(base44, {
      action: 'rr_os_snapshot_export',
      principalId,
      principalType,
      requestId,
      endpoint: 'api_exportEvidenceSnapshot',
      status: 'error',
      details: { message: String((error as any)?.message || error) },
    });
    return jsonError(error, requestId);
  }
});
