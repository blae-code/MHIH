import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ArcGIS Hub OGC API endpoints for BC government portals
const PORTALS = {
  geobc: {
    label: "Discover GeoBC",
    base: "https://discover-geobc-bcgov03.hub.arcgis.com/api/search/v1",
    org: "xeMpV7tU1t4KD3Ei",
  },
  // Global ArcGIS Open Data — filter to BC government items
  opendata: {
    label: "ArcGIS Open Data (BC)",
    base: "https://opendata.arcgis.com/api/search/v1",
  },
};

const BC_ORG_IDS = [
  "xeMpV7tU1t4KD3Ei", // GeoBC
  "ubm4tcTYICKBpist", // BC Ministry orgs
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, portal = "geobc", query = "", limit = 20, startindex = 0, itemId } = body;

    if (action === "search") {
      // Search items in the chosen portal
      const cfg = PORTALS[portal] || PORTALS.geobc;
      let url;

      if (portal === "opendata") {
        // For global ArcGIS Open Data, add BC-specific filters
        const q = encodeURIComponent((query || "British Columbia") + " BC");
        url = `${cfg.base}/collections/all/items?q=${q}&limit=${limit}&startindex=${startindex}&filter=access%3Dpublic`;
      } else {
        // GeoBC hub — no q filter required, just search
        const q = encodeURIComponent(query || "");
        url = `${cfg.base}/collections/all/items?${q ? `q=${q}&` : ""}limit=${limit}&startindex=${startindex}`;
      }

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const text = await res.text();
        return Response.json({ error: `Portal error: ${res.status}`, detail: text }, { status: 502 });
      }
      const data = await res.json();

      const items = (data.features || []).map(f => {
        const p = f.properties;
        return {
          id: f.id,
          title: p.title || "(untitled)",
          type: p.type || "",
          snippet: p.snippet || "",
          description: (p.description || "").replace(/<[^>]+>/g, "").slice(0, 400),
          url: p.url || "",
          thumbnail: p.thumbnail ? buildThumbnailUrl(p.orgId, f.id, p.thumbnail) : null,
          tags: p.tags || [],
          owner: p.owner || "",
          source: p.source || p.accessInformation || "",
          modified: p.modified ? new Date(p.modified).toISOString() : null,
          orgId: p.orgId || "",
          numViews: p.numViews || 0,
          licenseInfo: (p.licenseInfo || "").replace(/<[^>]+>/g, "").slice(0, 200),
        };
      });

      return Response.json({
        success: true,
        portal: cfg.label,
        totalMatched: data.numberMatched || items.length,
        items,
      });
    }

    if (action === "get_item") {
      // Fetch full item details from ArcGIS REST API
      if (!itemId) return Response.json({ error: "itemId required" }, { status: 400 });
      const url = `https://www.arcgis.com/sharing/rest/content/items/${itemId}?f=json`;
      const res = await fetch(url);
      const data = await res.json();
      return Response.json({ success: true, item: data });
    }

    if (action === "get_feature_service") {
      // Query an ArcGIS Feature Service layer
      const { serviceUrl, outFields = "*", where = "1=1", resultRecordCount = 5 } = body;
      if (!serviceUrl) return Response.json({ error: "serviceUrl required" }, { status: 400 });

      const layerUrl = serviceUrl.endsWith("/FeatureServer") ? `${serviceUrl}/0` : serviceUrl;
      const params = new URLSearchParams({
        f: "geojson",
        where,
        outFields,
        resultRecordCount: String(resultRecordCount),
        returnGeometry: "false",
      });
      const res = await fetch(`${layerUrl}/query?${params}`);
      if (!res.ok) return Response.json({ error: `Service error: ${res.status}` }, { status: 502 });
      const data = await res.json();
      return Response.json({
        success: true,
        featureCount: (data.features || []).length,
        features: data.features || [],
        fields: data.fields || [],
      });
    }

    return Response.json({ error: "Unknown action. Use: search, get_item, get_feature_service" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});

function buildThumbnailUrl(orgId, itemId, thumbnailPath) {
  if (!thumbnailPath) return null;
  return `https://www.arcgis.com/sharing/rest/content/items/${itemId}/info/${thumbnailPath}`;
}