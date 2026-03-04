import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CSV_PARSER_BASE = "https://csv-parser.api.gov.bc.ca";

// Known BC government health-related CSV datasets
const KNOWN_BC_CSVS = [
  { label: "Health Authority Boundaries", url: "https://catalogue.data.gov.bc.ca/dataset/7bc6018f-bb4f-4e5d-845e-c529e3d1ac3b/resource/3d2318d4-8f5d-4208-88f5-995420d7c58f/download/health_authority_boundaries.csv" },
  { label: "Local Health Area Boundaries", url: "https://catalogue.data.gov.bc.ca/dataset/ab60a21b-fb04-4c93-9cd0-8e9c9c7e2b7f/resource/e5e6f0c7-5e2f-4a7b-9dce-62a3f7b7e4a3/download/local_health_area_boundaries.csv" },
  { label: "BC Vital Statistics — Births", url: "https://www.bcstats.gov.bc.ca/Files/5440d1c0-0929-42f6-8af6-7d0acd18ab49/Births.csv" },
  { label: "BC Vital Statistics — Deaths", url: "https://www.bcstats.gov.bc.ca/Files/5440d1c0-0929-42f6-8af6-7d0acd18ab49/Deaths.csv" },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── CSV PARSER ──────────────────────────────────────────
    if (action === "parse_csv") {
      const { csvUrl, format = "json", sort, sort_dir, filters = {}, limit } = body;
      if (!csvUrl) return Response.json({ error: "csvUrl required" }, { status: 400 });

      const params = new URLSearchParams({ source: csvUrl, format });
      if (sort) params.set("sort", sort);
      if (sort_dir) params.set("sort_dir", sort_dir);
      for (const [k, v] of Object.entries(filters)) params.set(k, v);

      const apiUrl = `${CSV_PARSER_BASE}/?${params}`;
      const res = await fetch(apiUrl);
      if (!res.ok) return Response.json({ error: `CSV parser error: ${res.status}` }, { status: 502 });

      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = text; }

      const rows = Array.isArray(parsed) ? parsed : (parsed?.data || []);
      const sliced = limit ? rows.slice(0, limit) : rows;
      const columns = sliced.length > 0 ? Object.keys(sliced[0]) : [];

      return Response.json({ success: true, rows: sliced, columns, total: rows.length });
    }

    if (action === "known_csvs") {
      return Response.json({ success: true, datasets: KNOWN_BC_CSVS });
    }

    // ── BC GOV NEWS RSS ──────────────────────────────────────
    if (action === "health_news") {
      const { limit = 20 } = body;
      const res = await fetch("https://news.gov.bc.ca/ministries/health/feed", {
        headers: { Accept: "application/rss+xml, application/xml, text/xml" },
      });
      if (!res.ok) return Response.json({ error: `News feed error: ${res.status}` }, { status: 502 });

      const xml = await res.text();

      // Parse RSS items from XML text
      const items = [];
      const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const m of itemMatches) {
        const block = m[1];
        const get = (tag) => {
          const match = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
          return match ? (match[1] || match[2] || "").trim() : "";
        };
        items.push({
          title: get("title"),
          description: get("description"),
          link: get("link"),
          pubDate: get("pubDate"),
          guid: get("guid"),
        });
        if (items.length >= limit) break;
      }

      return Response.json({ success: true, items });
    }

    return Response.json({ error: "Unknown action. Use: parse_csv, known_csvs, health_news" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});