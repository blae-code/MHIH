import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const BASE_URL = "https://food-nutrition.canada.ca/api/canadian-nutrient-file";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, food_code, nutrient_id, lang = "en" } = body;

    if (action === "search_food") {
      // Search foods by name using food list endpoint
      const { query = "" } = body;
      const url = `${BASE_URL}/food/?lang=${lang}&type=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`CNF API error: ${res.status}`);
      const data = await res.json();
      // Filter by query if provided
      const filtered = query
        ? data.filter(f =>
            (f.food_description || "").toLowerCase().includes(query.toLowerCase()) ||
            (f.food_code?.toString() || "").includes(query)
          ).slice(0, 50)
        : data.slice(0, 50);
      return Response.json({ success: true, count: filtered.length, results: filtered });
    }

    if (action === "food_detail") {
      const url = `${BASE_URL}/food/?lang=${lang}&type=json&id=${food_code}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`CNF API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, data: Array.isArray(data) ? data[0] : data });
    }

    if (action === "nutrient_amounts") {
      // Get all nutrients for a food
      const url = `${BASE_URL}/nutrientamount/?lang=${lang}&type=json&id=${food_code}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`CNF API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, count: data.length, results: data });
    }

    if (action === "nutrient_names") {
      const url = nutrient_id
        ? `${BASE_URL}/nutrientname/?lang=${lang}&type=json&id=${nutrient_id}`
        : `${BASE_URL}/nutrientname/?lang=${lang}&type=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`CNF API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, results: Array.isArray(data) ? data : [data] });
    }

    if (action === "nutrient_groups") {
      const url = `${BASE_URL}/nutrientgroup/?lang=${lang}&type=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`CNF API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, results: data });
    }

    if (action === "food_groups") {
      const url = `${BASE_URL}/foodgroup/?lang=${lang}&type=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`CNF API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, results: data });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});