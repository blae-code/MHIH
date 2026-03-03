import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Search, ExternalLink, Plus, RefreshCw, Pill, ChevronDown, ChevronRight } from "lucide-react";

const SEARCH_TYPES = [
  { id: "activeingredient", label: "Active Ingredient", placeholder: "e.g. metformin, aspirin, fentanyl" },
  { id: "drugproduct", label: "Brand Name", placeholder: "e.g. Tylenol, Advil, Ozempic" },
];

const QUICK_SEARCHES = [
  { label: "Metformin", type: "activeingredient", query: "metformin" },
  { label: "Fentanyl", type: "activeingredient", query: "fentanyl" },
  { label: "Naloxone", type: "activeingredient", query: "naloxone" },
  { label: "Buprenorphine", type: "activeingredient", query: "buprenorphine" },
  { label: "Cannabis", type: "activeingredient", query: "cannabis" },
  { label: "Ozempic", type: "drugproduct", query: "ozempic" },
];

export default function HealthCanadaDPDBrowser({ onClose, onImport }) {
  const [searchType, setSearchType] = useState("activeingredient");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState({});
  const [detailLoading, setDetailLoading] = useState(null);
  const [imported, setImported] = useState(new Set());

  const search = async (type, q) => {
    const t = type || searchType;
    const sq = q || query;
    if (!sq.trim()) return;
    setLoading(true);
    setResults(null);
    setError(null);
    setExpanded(null);
    try {
      const res = await base44.functions.invoke("healthCanadaDPD", { action: t, query: sq.trim() });
      setResults(res.data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const loadDetail = async (drug_code) => {
    if (detail[drug_code]) return;
    setDetailLoading(drug_code);
    try {
      const [statusRes, formRes, companyRes] = await Promise.all([
        base44.functions.invoke("healthCanadaDPD", { action: "status", drug_code }),
        base44.functions.invoke("healthCanadaDPD", { action: "form", drug_code }),
        base44.functions.invoke("healthCanadaDPD", { action: "company", drug_code }),
      ]);
      setDetail(prev => ({
        ...prev,
        [drug_code]: {
          status: statusRes.data?.results,
          form: formRes.data?.results,
          company: companyRes.data?.results,
        }
      }));
    } catch (e) { /* ignore */ }
    setDetailLoading(null);
  };

  const toggleExpand = (drug_code) => {
    if (expanded === drug_code) {
      setExpanded(null);
    } else {
      setExpanded(drug_code);
      loadDetail(drug_code);
    }
  };

  const handleImport = async (item) => {
    const drug_code = item.drug_code || item.DRUG_CODE;
    const key = drug_code;
    const ingredient = item.ingredient_name || item.INGREDIENT;
    const brand = item.brand_name || item.BRAND_NAME;
    const sourceData = {
      name: `DPD — ${brand || ingredient} (${drug_code})`,
      type: "api",
      url: `https://health-products.canada.ca/dpd-bdpp/info.do?lang=en&code=${drug_code}`,
      description: `Health Canada Drug Product Database entry. Brand: ${brand || "N/A"}, Ingredient: ${ingredient || "N/A"}, Strength: ${item.strength || "N/A"} ${item.strength_unit || ""}`,
      category: "other",
      sync_frequency: "manual",
      status: "active",
      metadata: {
        drug_code,
        brand_name: brand,
        ingredient,
        source: "health_canada_dpd",
      },
    };
    await onImport(sourceData);
    setImported(prev => new Set([...prev, key]));
  };

  const currentType = SEARCH_TYPES.find(t => t.id === searchType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ width: 860, maxHeight: "88vh", background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <div>
            <div className="flex items-center gap-2">
              <Pill size={15} style={{ color: "var(--accent-primary)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Health Canada — Drug Product Database (DPD)
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              health-products.canada.ca/api/drug — Licensed pharmaceutical products in Canada
            </p>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-5 py-3 border-b shrink-0 space-y-2"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          {/* Type selector */}
          <div className="flex gap-2">
            {SEARCH_TYPES.map(t => (
              <button key={t.id} onClick={() => setSearchType(t.id)}
                className="px-3 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: searchType === t.id ? "var(--accent-primary)" : "var(--bg-overlay)",
                  color: searchType === t.id ? "#000" : "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}>
                {t.label}
              </button>
            ))}
          </div>
          {/* Search input */}
          <form onSubmit={e => { e.preventDefault(); search(); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={currentType?.placeholder}
                className="w-full rounded-md text-xs pl-8 pr-3 py-2"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)", outline: "none" }}
              />
            </div>
            <button type="submit" disabled={loading || !query.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium"
              style={{ background: "var(--accent-primary)", color: "#000", opacity: loading || !query.trim() ? 0.6 : 1 }}>
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
              Search
            </button>
          </form>
          {/* Quick searches */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Quick:</span>
            {QUICK_SEARCHES.map(qs => (
              <button key={qs.query} onClick={() => { setSearchType(qs.type); setQuery(qs.query); search(qs.type, qs.query); }}
                className="px-2 py-0.5 rounded text-xs transition-colors"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                {qs.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {!results && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: "var(--text-muted)" }}>
              <Pill size={28} className="opacity-20" />
              <p className="text-xs">Search by active ingredient or brand name to browse DPD records</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-40 gap-2" style={{ color: "var(--text-muted)" }}>
              <RefreshCw size={15} className="animate-spin" />
              <span className="text-xs">Querying Health Canada DPD API...</span>
            </div>
          )}

          {error && (
            <div className="m-4 px-4 py-3 rounded text-xs" style={{ background: "rgba(185,38,45,0.12)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>
              {error}
            </div>
          )}

          {results && !loading && (
            <>
              <div className="px-5 py-2 border-b text-xs flex items-center gap-2"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)", background: "var(--bg-surface)" }}>
                <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>{results.count}</span> results
                {results.count > 100 && <span style={{ color: "var(--text-muted)" }}>— showing first 100</span>}
              </div>

              {results.results?.length === 0 && (
                <div className="flex items-center justify-center h-32 text-xs" style={{ color: "var(--text-muted)" }}>
                  No records found for "{query}"
                </div>
              )}

              <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {(results.results || []).slice(0, 100).map((item) => {
                  const code = item.drug_code || item.DRUG_CODE;
                  const isOpen = expanded === code;
                  const det = detail[code];
                  const isDetailLoading = detailLoading === code;
                  const isImp = imported.has(code);

                  return (
                    <div key={code} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      {/* Row */}
                      <div className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors"
                        style={{ background: isOpen ? "var(--bg-hover)" : "transparent" }}
                        onMouseOver={e => !isOpen && (e.currentTarget.style.background = "var(--bg-surface)")}
                        onMouseOut={e => !isOpen && (e.currentTarget.style.background = "transparent")}>

                        <button onClick={() => toggleExpand(code)} className="shrink-0" style={{ color: "var(--text-muted)" }}>
                          {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>

                        <div className="flex-1 min-w-0" onClick={() => toggleExpand(code)}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                              {item.brand_name || item.ingredient_name || item.BRAND_NAME || item.INGREDIENT || "—"}
                            </span>
                            {item.ingredient_name && item.brand_name && (
                              <span className="tag">{item.ingredient_name}</span>
                            )}
                            <span className="text-xs px-1.5 rounded" style={{ background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                              #{code}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {(item.class || item.CLASS) && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.class || item.CLASS}</span>}
                            {(item.strength) && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.strength} {item.strength_unit}/{item.dosage_unit}</span>}
                            {(item.descriptor || item.DESCRIPTOR) && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.descriptor || item.DESCRIPTOR}</span>}
                            {(item.pediatric_flag || item.PEDIATRIC_FLAG) === "Y" && (
                              <span className="text-xs px-1.5 rounded" style={{ background: "rgba(46,160,67,0.15)", color: "var(--color-success)", border: "1px solid var(--color-success)" }}>Pediatric</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a href={`https://health-products.canada.ca/dpd-bdpp/info.do?lang=en&code=${code}`}  
                            target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs" style={{ color: "var(--color-info)" }}>
                            <ExternalLink size={10} /> DPD
                          </a>
                          <button
                            onClick={e => { e.stopPropagation(); handleImport(item); }}
                            disabled={isImp}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                            style={{
                              background: isImp ? "var(--bg-overlay)" : "var(--accent-primary)",
                              color: isImp ? "var(--text-muted)" : "#000",
                            }}>
                            <Plus size={10} />
                            {isImp ? "Imported" : "Import"}
                          </button>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isOpen && (
                        <div className="px-10 pb-3 pt-1"
                          style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border-subtle)" }}>
                          {isDetailLoading ? (
                            <div className="flex items-center gap-2 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                              <RefreshCw size={11} className="animate-spin" /> Loading details...
                            </div>
                          ) : det ? (
                            <div className="grid grid-cols-3 gap-4 py-2">
                              <DetailBlock title="Status" items={det.status} field="STATUS" />
                              <DetailBlock title="Dosage Form" items={det.form} field="PHARMACEUTICAL_FORM" />
                              <DetailBlock title="Company" items={det.company} field="COMPANY_NAME" />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ title, items, field }) {
  const values = (items || []).map(i => i[field]).filter(Boolean);
  return (
    <div>
      <div className="text-xs font-semibold mb-1 uppercase tracking-widest" style={{ color: "var(--text-muted)", fontSize: 10 }}>{title}</div>
      {values.length === 0
        ? <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
        : values.map((v, i) => (
          <div key={i} className="text-xs" style={{ color: "var(--text-secondary)" }}>{v}</div>
        ))
      }
    </div>
  );
}