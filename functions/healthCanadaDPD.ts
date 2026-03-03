import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const BASE_URL = "https://health-products.canada.ca/api/drug";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, query, lang = "en" } = body;

    // ── Search by active ingredient ──────────────────────────────────────────
    if (action === "activeingredient") {
      if (!query) return Response.json({ error: "query required" }, { status: 400 });
      const url = `${BASE_URL}/activeingredient/?ingredientname=${encodeURIComponent(query)}&lang=${lang}&type=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`DPD API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, count: Array.isArray(data) ? data.length : 0, results: data });
    }

    // ── Search by drug product name ──────────────────────────────────────────
    if (action === "drugproduct") {
      if (!query) return Response.json({ error: "query required" }, { status: 400 });
      const url = `${BASE_URL}/drugproduct/?brandname=${encodeURIComponent(query)}&lang=${lang}&type=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`DPD API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, count: Array.isArray(data) ? data.length : 0, results: data });
    }

    // ── Get drug company ─────────────────────────────────────────────────────
    if (action === "company") {
      const { drug_code } = body;
      if (!drug_code) return Response.json({ error: "drug_code required" }, { status: 400 });
      const url = `${BASE_URL}/company/?drug_code=${drug_code}&lang=${lang}&type=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`DPD API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, results: data });
    }

    // ── Get drug status ──────────────────────────────────────────────────────
    if (action === "status") {
      const { drug_code } = body;
      if (!drug_code) return Response.json({ error: "drug_code required" }, { status: 400 });
      const url = `${BASE_URL}/status/?drug_code=${drug_code}&lang=${lang}&type=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`DPD API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, results: data });
    }

    // ── Get drug form ────────────────────────────────────────────────────────
    if (action === "form") {
      const { drug_code } = body;
      if (!drug_code) return Response.json({ error: "drug_code required" }, { status: 400 });
      const url = `${BASE_URL}/form/?drug_code=${drug_code}&lang=${lang}&type=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`DPD API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, results: data });
    }

    // ── Get packaging info ───────────────────────────────────────────────────
    if (action === "packaging") {
      const { drug_code } = body;
      if (!drug_code) return Response.json({ error: "drug_code required" }, { status: 400 });
      const url = `${BASE_URL}/packaging/?drug_code=${drug_code}&lang=${lang}&type=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`DPD API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, results: data });
    }

    return Response.json({ error: "Unknown action. Use: activeingredient, drugproduct, company, status, form, packaging" }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});