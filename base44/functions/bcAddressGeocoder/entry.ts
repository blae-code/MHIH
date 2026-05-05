import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const BASE_URL = "https://geocoder.api.gov.bc.ca";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, address, lat, lon, maxResults = 10 } = body;

    if (action === "search") {
      if (!address?.trim()) throw new Error("Address is required");
      const url = `${BASE_URL}/addresses.json?addressString=${encodeURIComponent(address)}&maxResults=${maxResults}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Geocoder API error: ${res.status}`);
      const data = await res.json();
      return Response.json({
        success: true,
        count: data.features?.length || 0,
        results: data.features || [],
      });
    }

    if (action === "reverse") {
      if (lat === undefined || lon === undefined) throw new Error("Latitude and longitude required");
      const url = `${BASE_URL}/nearest.json?point=${encodeURIComponent(`POINT(${lon} ${lat})`)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Geocoder API error: ${res.status}`);
      const data = await res.json();
      return Response.json({
        success: true,
        result: data.features?.[0] || null,
      });
    }

    if (action === "enrich_records") {
      // Enrich multiple records with geocoding data
      const records = body.records || [];
      const addressField = body.addressField || "address";
      const results = [];

      for (const record of records) {
        const recordAddress = record[addressField];
        if (!recordAddress) {
          results.push({ ...record, geocoded: false, error: "No address field" });
          continue;
        }

        try {
          const url = `${BASE_URL}/addresses.json?addressString=${encodeURIComponent(recordAddress)}&maxResults=1`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const match = data.features?.[0];
            if (match?.geometry?.coordinates) {
              const props = match.properties || {};
              results.push({
                ...record,
                geocoded: true,
                longitude: match.geometry.coordinates[0],
                latitude: match.geometry.coordinates[1],
                full_address: props.fullAddress,
                locality: props.localityName,
                province_code: props.provinceCode,
                score: props.score,
              });
            } else {
              results.push({ ...record, geocoded: false, error: "No match found" });
            }
          } else {
            results.push({ ...record, geocoded: false, error: "API error" });
          }
        } catch (e) {
          results.push({ ...record, geocoded: false, error: e.message });
        }
      }

      return Response.json({
        success: true,
        total: records.length,
        enriched: results.filter(r => r.geocoded).length,
        results,
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});