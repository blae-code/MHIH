import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Map, Loader2, X, Download, ChevronDown, ChevronRight, ExternalLink, Search, Layers } from "lucide-react";

const QUICK_SEARCHES = [
  "health authority", "Indigenous", "First Nations", "population", "census", "hospital",
  "boundaries", "roads", "parks", "water", "environment",
];

export default function BCWMSWFSBrowser({ onClose, onImport }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [layerDetails, setLayerDetails] = useState({});
  const [imported, setImported] = useState({});
  const [featurePreview, setFeaturePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(null);

  const search = async (q) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await base44.functions.invoke("bcWMSWFS", { action: "search_layers", query: searchQuery, limit: 20 });
      setResults(res.data?.results || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => setExpanded(expanded === id ? null : id);

  const describeLayer = async (typeName, pkgId) => {
    if (layerDetails[typeName]) return;
    try {
      const res = await base44.functions.invoke("bcWMSWFS", { action: "describe_layer", typeName });
      if (res.data?.success) {
        setLayerDetails(prev => ({ ...prev, [typeName]: res.data.properties }));
      }
    } catch {}
  };

  const previewFeatures = async (typeName) => {
    setPreviewLoading(typeName);
    setFeaturePreview(null);
    try {
      const res = await base44.functions.invoke("bcWMSWFS", { action: "get_features", typeName, count: 5 });
      if (res.data?.success) setFeaturePreview({ typeName, ...res.data });
    } finally {
      setPreviewLoading(null);
    }
  };

  const handleImport = async (pkg, resource) => {
    const key = resource.id;
    const sourceData = {
      name: pkg.title,
      type: "bc_health",
      url: resource.url,
      description: pkg.notes ? pkg.notes.slice(0, 300) : `BC BCGW WMS/WFS layer — ${resource.name}`,
      category: "other",
      status: "active",
      sync_frequency: "manual",
      metadata: {
        object_name: resource.object_name,
        format: resource.format,
        catalogue_id: pkg.id,
        tags: pkg.tags,
        organization: pkg.organization,
        resource_id: resource.id,
      },
    };
    await onImport(sourceData);
    setImported(prev => ({ ...prev, [key]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="flex flex-col w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2">
            <Layers size={15} style={{ color: "var(--accent-primary)" }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>BC WMS/WFS Layer Browser</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>BC Geographic Warehouse — openmaps.gov.bc.ca</div>
            </div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 px-3 py-1.5 rounded-md text-xs outline-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              placeholder="Search BC geographic layers (e.g. health authority, Indigenous, population)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
            />
            <button onClick={() => search()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: "var(--accent-primary)", color: "#000" }}>
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
              Search
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {QUICK_SEARCHES.map(q => (
              <button key={q} onClick={() => { setQuery(q); search(q); }}
                className="px-2 py-0.5 rounded text-xs"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Searching BC Data Catalogue for WMS/WFS layers...</span>
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="text-center py-12 text-xs" style={{ color: "var(--text-muted)" }}>
              No WMS/WFS layers found for "{query}"
            </div>
          )}

          {!loading && results.length === 0 && !query && (
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
              <Map size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Search the BC Geographic Warehouse for WMS/WFS layers.</p>
              <p className="text-xs mt-1">Try "health authority" or "Indigenous" to find relevant geographic data.</p>
            </div>
          )}

          <div className="space-y-2">
            {results.map(pkg => (
              <div key={pkg.id} className="rounded-md overflow-hidden"
                style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                <div className="flex items-start justify-between px-3 py-2.5 cursor-pointer"
                  style={{ background: expanded === pkg.id ? "var(--bg-overlay)" : "transparent" }}
                  onClick={() => toggleExpand(pkg.id)}>
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    {expanded === pkg.id ? <ChevronDown size={14} style={{ color: "var(--text-muted)", marginTop: 2, flexShrink: 0 }} />
                      : <ChevronRight size={14} style={{ color: "var(--text-muted)", marginTop: 2, flexShrink: 0 }} />}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{pkg.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {pkg.organization} • {pkg.resources.length} layer{pkg.resources.length !== 1 ? "s" : ""}
                      </div>
                      {pkg.notes && (
                        <div className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                          {pkg.notes.replace(/<[^>]+>/g, "").slice(0, 150)}
                        </div>
                      )}
                      {pkg.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pkg.tags.slice(0, 5).map(t => (
                            <span key={t} className="tag" style={{ fontSize: 10 }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {expanded === pkg.id && (
                  <div className="px-3 pb-3 pt-1 border-t space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
                    {pkg.resources.map(resource => {
                      const typeName = resource.object_name ? `pub:${resource.object_name}` : null;
                      return (
                        <div key={resource.id} className="p-2 rounded"
                          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs px-1.5 rounded"
                                  style={{ background: "var(--bg-overlay)", color: "var(--accent-primary)", border: "1px solid var(--border-subtle)", fontSize: 10 }}>
                                  {resource.format?.toUpperCase()}
                                </span>
                                <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{resource.name}</span>
                              </div>
                              {resource.object_name && (
                                <div className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                                  {typeName}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a href={resource.url} target="_blank" rel="noopener noreferrer"
                                className="activity-icon" style={{ width: 24, height: 24 }}>
                                <ExternalLink size={11} />
                              </a>
                              {typeName && (
                                <button onClick={() => { describeLayer(typeName, pkg.id); previewFeatures(typeName); }}
                                  disabled={previewLoading === typeName}
                                  className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                                  {previewLoading === typeName ? <Loader2 size={10} className="animate-spin" /> : <Map size={10} />}
                                  Preview
                                </button>
                              )}
                              <button onClick={() => handleImport(pkg, resource)}
                                disabled={imported[resource.id]}
                                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                                style={{ background: imported[resource.id] ? "var(--color-success)" : "var(--accent-primary)", color: "#000", opacity: imported[resource.id] ? 0.7 : 1 }}>
                                <Download size={10} />
                                {imported[resource.id] ? "Imported" : "Import"}
                              </button>
                            </div>
                          </div>

                          {/* Layer properties */}
                          {typeName && layerDetails[typeName] && (
                            <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                              <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Fields</div>
                              <div className="flex flex-wrap gap-1">
                                {layerDetails[typeName].slice(0, 15).map(p => (
                                  <span key={p.name} className="tag" style={{ fontSize: 10 }}>{p.name}</span>
                                ))}
                                {layerDetails[typeName].length > 15 && (
                                  <span className="tag" style={{ fontSize: 10 }}>+{layerDetails[typeName].length - 15} more</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Feature preview */}
                          {featurePreview?.typeName === typeName && (
                            <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                              <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                                Sample features ({featurePreview.numberReturned} of {featurePreview.totalFeatures?.toLocaleString()} total)
                              </div>
                              <div className="overflow-x-auto">
                                {featurePreview.features?.slice(0, 3).map((f, i) => (
                                  <div key={i} className="text-xs p-1 mb-1 rounded" style={{ background: "var(--bg-overlay)", fontFamily: "monospace", fontSize: 10 }}>
                                    {Object.entries(f.properties || {}).slice(0, 6).map(([k, v]) => (
                                      <span key={k} className="mr-2">{k}: <span style={{ color: "var(--accent-primary)" }}>{String(v ?? "—").slice(0, 30)}</span></span>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t shrink-0 text-xs"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)", color: "var(--text-muted)" }}>
          Data from BC Geographic Warehouse via openmaps.gov.bc.ca — WFS GetFeature supports CQL_FILTER, BBOX, and count
        </div>
      </div>
    </div>
  );
}