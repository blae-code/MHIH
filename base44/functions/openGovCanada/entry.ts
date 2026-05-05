import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CKAN_BASE = "https://open.canada.ca/data/en/api/3/action";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { action, query, id, limit = 20 } = await req.json();

    if (action === "search") {
      const url = `${CKAN_BASE}/package_search?q=${encodeURIComponent(query)}&rows=${limit}`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!res.ok) throw new Error(`Open Gov Canada search failed: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "API returned error");

      const datasets = (data.result?.results || []).map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        title: pkg.title || pkg.title_translated?.en || pkg.name,
        notes: pkg.notes || pkg.notes_translated?.en || "",
        organization: pkg.organization?.title || pkg.owner_org,
        tags: (pkg.tags || []).map(t => t.display_name || t.name),
        num_resources: pkg.num_resources,
        metadata_modified: pkg.metadata_modified,
        url: `https://open.canada.ca/data/en/dataset/${pkg.name}`,
        resources: (pkg.resources || []).slice(0, 5).map(r => ({
          id: r.id,
          name: r.name || r.name_translated?.en || r.id,
          format: r.format,
          url: r.url,
        })),
      }));

      return Response.json({ success: true, count: data.result.count, datasets });
    }

    if (action === "show") {
      const url = `${CKAN_BASE}/package_show?id=${encodeURIComponent(id)}`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!res.ok) throw new Error(`Open Gov Canada show failed: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "API returned error");

      const pkg = data.result;
      return Response.json({
        success: true,
        dataset: {
          id: pkg.id,
          name: pkg.name,
          title: pkg.title || pkg.title_translated?.en || pkg.name,
          notes: pkg.notes || pkg.notes_translated?.en || "",
          organization: pkg.organization?.title || pkg.owner_org,
          tags: (pkg.tags || []).map(t => t.display_name || t.name),
          license: pkg.license_title,
          metadata_modified: pkg.metadata_modified,
          url: `https://open.canada.ca/data/en/dataset/${pkg.name}`,
          resources: (pkg.resources || []).map(r => ({
            id: r.id,
            name: r.name || r.name_translated?.en || r.id,
            format: r.format,
            url: r.url,
            description: r.description || r.description_translated?.en || "",
            size: r.size,
          })),
        },
      });
    }

    return Response.json({ error: "Unknown action. Use 'search' or 'show'." }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});