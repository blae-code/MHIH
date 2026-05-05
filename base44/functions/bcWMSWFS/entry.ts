import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const WFS_BASE = "https://openmaps.gov.bc.ca/geo/pub/ows";
const CATALOGUE_BASE = "https://catalogue.data.gov.bc.ca/api/3/action";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // Search BC Data Catalogue for WFS/WMS layers
    if (action === "search_layers") {
      const query = body.query || "";
      const limit = body.limit || 20;
      const url = `${CATALOGUE_BASE}/package_search?q=${encodeURIComponent(query)}&fq=res_format:wms&rows=${limit}&include_private=false`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Catalogue API error: ${res.status}`);
      const data = await res.json();
      const results = (data.result?.results || []).map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        title: pkg.title,
        notes: pkg.notes,
        organization: pkg.organization?.title,
        metadata_modified: pkg.metadata_modified,
        resources: (pkg.resources || []).map(r => ({
          id: r.id,
          name: r.name,
          format: r.format,
          url: r.url,
          object_name: r.object_name,
        })).filter(r => ["wms", "wfs"].includes((r.format || "").toLowerCase())),
        tags: (pkg.tags || []).map(t => t.display_name),
      })).filter(p => p.resources.length > 0);
      return Response.json({ success: true, count: results.length, results });
    }

    // WFS GetFeature — fetch actual geographic features as GeoJSON
    if (action === "get_features") {
      const { typeName, count = 20, cql_filter, bbox, srsName = "EPSG:4326" } = body;
      if (!typeName) throw new Error("typeName is required (e.g. pub:WHSE_BASEMAPPING.NTS_BC_AREA_MUNICIPALITIES_SP)");

      const params = new URLSearchParams({
        service: "WFS",
        version: "2.0.0",
        request: "GetFeature",
        typeName,
        count: String(count),
        outputFormat: "json",
        srsName,
      });
      if (cql_filter) params.set("CQL_FILTER", cql_filter);
      if (bbox) params.set("BBOX", bbox);

      const res = await fetch(`${WFS_BASE}?${params.toString()}`);
      if (!res.ok) throw new Error(`WFS error: ${res.status}`);
      const data = await res.json();
      return Response.json({
        success: true,
        totalFeatures: data.totalFeatures,
        numberReturned: data.numberReturned || (data.features?.length || 0),
        features: data.features || [],
        crs: data.crs,
      });
    }

    // WFS DescribeFeatureType — get schema/properties of a layer
    if (action === "describe_layer") {
      const { typeName } = body;
      if (!typeName) throw new Error("typeName is required");
      const params = new URLSearchParams({
        service: "WFS",
        version: "2.0.0",
        request: "DescribeFeatureType",
        typeName,
        outputFormat: "application/json",
      });
      const res = await fetch(`${WFS_BASE}?${params.toString()}`);
      if (!res.ok) throw new Error(`WFS DescribeFeatureType error: ${res.status}`);
      const data = await res.json();
      const properties = data.featureTypes?.[0]?.properties || [];
      return Response.json({ success: true, typeName, properties });
    }

    // WMS GetMap — returns a map tile URL (client renders it)
    if (action === "get_map_url") {
      const { layers, bbox = "-139,48,-114,60", width = 800, height = 600, srs = "EPSG:4326", cql_filter } = body;
      if (!layers) throw new Error("layers is required (e.g. pub:WHSE_BASEMAPPING.NTS_BC_AREA_MUNICIPALITIES_SP)");
      const params = new URLSearchParams({
        SERVICE: "WMS",
        VERSION: "1.1.1",
        REQUEST: "GetMap",
        FORMAT: "image/png",
        TRANSPARENT: "true",
        LAYERS: layers,
        SRS: srs,
        WIDTH: String(width),
        HEIGHT: String(height),
        BBOX: bbox,
      });
      if (cql_filter) params.set("CQL_FILTER", cql_filter);
      return Response.json({
        success: true,
        url: `${WFS_BASE}?${params.toString()}`,
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});