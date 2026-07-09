import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as XLSX from 'npm:xlsx@0.18.5';

const MAX_ROWS = 10000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_b64, file_name } = await req.json();
    if (!file_b64) return Response.json({ error: 'file_b64 is required' }, { status: 400 });

    // Decode base64 → bytes
    const binary = atob(file_b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const workbook = XLSX.read(bytes, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return Response.json({ error: 'No sheets found in the file' }, { status: 400 });

    const sheet = workbook.Sheets[sheetName];
    // defval: "" keeps empty cells so all rows share the same keys
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
    if (!rawRows.length) return Response.json({ error: 'No data rows found in the first sheet' }, { status: 400 });

    const truncated = rawRows.length > MAX_ROWS;
    const rows = rawRows.slice(0, MAX_ROWS).map((r) => {
      const clean = {};
      for (const [k, v] of Object.entries(r)) {
        clean[String(k).trim()] = v === null || v === undefined ? "" : v;
      }
      return clean;
    });
    const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];

    return Response.json({
      file_name: file_name ?? null,
      sheet_name: sheetName,
      sheet_names: workbook.SheetNames,
      columns,
      rows,
      total_rows: rawRows.length,
      truncated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});