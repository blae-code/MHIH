import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const BASE_URL = "https://health-infobase.canada.ca/api";

// Available databases
const DATABASES = ["opioids", "cnisp-vri", "wastewater", "CYPC"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, database, table, column, query, limit } = body;

    // ── List all available databases ─────────────────────────────────────────
    if (action === "databases") {
      return Response.json({ success: true, databases: DATABASES });
    }

    // ── List tables in a database ────────────────────────────────────────────
    if (action === "tables") {
      if (!database) return Response.json({ error: "database required" }, { status: 400 });
      const res = await fetch(`${BASE_URL}/${database}`);
      if (!res.ok) throw new Error(`Health Infobase API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, tables: data.tables || [] });
    }

    // ── Get full table ───────────────────────────────────────────────────────
    if (action === "table") {
      if (!database || !table) return Response.json({ error: "database and table required" }, { status: 400 });
      const res = await fetch(`${BASE_URL}/${database}/table/${encodeURIComponent(table)}`);
      if (!res.ok) throw new Error(`Health Infobase API error: ${res.status}`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      const limited = limit ? rows.slice(0, limit) : rows;
      return Response.json({ success: true, count: rows.length, rows: limited, columns: rows.length > 0 ? Object.keys(rows[0]) : [] });
    }

    // ── Get single column ────────────────────────────────────────────────────
    if (action === "column") {
      if (!database || !table || !column) return Response.json({ error: "database, table, and column required" }, { status: 400 });
      const res = await fetch(`${BASE_URL}/${database}/table/${encodeURIComponent(table)}/column/${encodeURIComponent(column)}`);
      if (!res.ok) throw new Error(`Health Infobase API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, data });
    }

    // ── Custom SELECT query ──────────────────────────────────────────────────
    if (action === "query") {
      if (!database || !query) return Response.json({ error: "database and query required" }, { status: 400 });
      const url = `${BASE_URL}/${database}/query?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Health Infobase API error: ${res.status}`);
      const data = await res.json();
      if (data?.error) return Response.json({ error: data.error }, { status: 400 });
      return Response.json({ success: true, count: Array.isArray(data) ? data.length : 1, rows: data });
    }

    return Response.json({ error: "Unknown action. Use: databases, tables, table, column, query" }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});