import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, ChevronDown, ChevronRight, Plus, Check, Loader2, FlaskConical, Eye, ArrowUpDown } from "lucide-react";
import SmartSearchBar from "./SmartSearchBar";
import DataSourcePreview from "./DataSourcePreview";
import AIRecommendations from "./AIRecommendations";

const QUICK_SEARCHES = [
  { label: "Bannock", query: "bannock" },
  { label: "Wild Rice", query: "wild rice" },
  { label: "Bison", query: "bison" },
  { label: "Salmon", query: "salmon" },
  { label: "Fiddleheads", query: "fiddlehead" },
  { label: "Blueberries", query: "blueberry" },
  { label: "Venison", query: "venison" },
  { label: "Moose", query: "moose" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
];

export default function HealthCanadaCNFBrowser({ onClose, onImport }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [nutrients, setNutrients] = useState({});
  const [loadingNutrients, setLoadingNutrients] = useState(null);
  const [imported, setImported] = useState({});
  const [previewItem, setPreviewItem] = useState(null);
  const [sortBy, setSortBy] = useState("relevance");
  const [groupFilter, setGroupFilter] = useState("All");
  const [recentSearches, setRecentSearches] = useState([]);

  const search = async (q) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setResults([]);
    setExpanded(null);
    setRecentSearches(prev => [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 5));
    const res = await base44.functions.invoke("healthCanadaCNF", { action: "search_food", query: searchQuery });
    setResults(res.data?.results || []);
    setLoading(false);
  };

  const toggleExpand = async (food) => {
    const code = food.food_code;
    if (expanded === code) { setExpanded(null); return; }
    setExpanded(code);
    if (!nutrients[code]) {
      setLoadingNutrients(code);
      const res = await base44.functions.invoke("healthCanadaCNF", { action: "nutrient_amounts", food_code: code });
      setNutrients(prev => ({ ...prev, [code]: res.data?.results || [] }));
      setLoadingNutrients(null);
    }
  };

  const handleImport = async (food) => {
    const code = food.food_code;
    const sourceData = {
      name: `CNF — ${food.food_description} (${code})`,
      type: "api",
      url: `https://food-nutrition.canada.ca/api/canadian-nutrient-file/food/?lang=en&type=json&id=${code}`,
      description: `Canadian Nutrient File food entry. Group: ${food.food_group_name || "N/A"}, Source: ${food.food_source_name || "N/A"}`,
      category: "other",
      sync_frequency: "manual",
      status: "active",
      metadata: { food_code: code, food_description: food.food_description, food_group: food.food_group_name, source: "health_canada_cnf" },
    };
    await onImport(sourceData);
    setImported(prev => ({ ...prev, [code]: true }));
  };

  // Derive groups from results for filter chips
  const groups = ["All", ...Array.from(new Set(results.map(r => r.food_group_name).filter(Boolean))).sort()];

  const filtered = results
    .filter(r => groupFilter === "All" || r.food_group_name === groupFilter)
    .sort((a, b) => {
      if (sortBy === "name_asc") return (a.food_description || "").localeCompare(b.food_description || "");
      if (sortBy === "name_desc") return (b.food_description || "").localeCompare(a.food_description || "");
      return 0;
    });

  const filterBar = (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1">
        <ArrowUpDown size={11} style={{ color: "var(--text-muted)" }} />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sort:</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="text-xs outline-none px-1.5 py-0.5 rounded"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {groups.length > 2 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Group:</span>
          {groups.map(g => (
            <button key={g} onClick={() => setGroupFilter(g)}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: groupFilter === g ? "var(--accent-muted)" : "var(--bg-overlay)",
                color: groupFilter === g ? "var(--accent-primary)" : "var(--text-muted)",
                border: `1px solid ${groupFilter === g ? "var(--accent-primary)" : "var(--border-subtle)"}`,
              }}>{g}</button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="flex flex-col w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", maxHeight: "85vh" }}>

        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2">
            <FlaskConical size={15} style={{ color: "var(--accent-primary)" }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Health Canada — Canadian Nutrient File</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Search foods · AI-powered autocomplete</div>
            </div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          <SmartSearchBar
            value={query}
            onChange={setQuery}
            onSearch={search}
            placeholder="Search food by name (e.g. 'salmon', 'wild rice', 'bannock')..."
            quickSearches={QUICK_SEARCHES}
            aiContext="Health Canada Canadian Nutrient File — traditional Indigenous foods, game meats, berries, fish"
            filterSlot={results.length > 0 ? filterBar : null}
            recentSearches={recentSearches}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* AI Recommendations */}
          {(results.length > 0 || Object.keys(imported).length > 0 || recentSearches.length > 0) && (
            <div className="px-4 pt-3">
              <AIRecommendations
                context={{
                  currentQuery: query,
                  recentSearches,
                  importedNames: Object.keys(imported).map(k => `food:${k}`),
                  activeFilters: [groupFilter !== "All" ? `group:${groupFilter}` : ""].filter(Boolean),
                  sourceName: "Health Canada Canadian Nutrient File",
                }}
                onSearchSuggestion={q => { setQuery(q); search(q); }}
              />
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Searching CNF...</span>
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="text-center py-12 text-xs" style={{ color: "var(--text-muted)" }}>
              Search for a food — AI will suggest related terms as you type.
            </div>
          )}
          {filtered.map(food => {
            const code = food.food_code;
            const isExpanded = expanded === code;
            const foodNutrients = nutrients[code] || [];
            const isImported = imported[code];

            return (
              <div key={code} className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center gap-3 px-4 py-2.5"
                  style={{ background: isExpanded ? "var(--bg-overlay)" : "transparent" }}>
                  <button onClick={() => toggleExpand(food)} className="shrink-0" style={{ color: "var(--text-muted)" }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(food)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                        {food.food_description}
                      </span>
                      <span className="text-xs px-1.5 rounded" style={{ background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                        #{code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {food.food_group_name && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{food.food_group_name}</span>}
                      {food.food_source_name && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{food.food_source_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setPreviewItem({
                      title: food.food_description,
                      organization: "Health Canada",
                      description: `Food Group: ${food.food_group_name || "N/A"} · Source: ${food.food_source_name || "N/A"} · Code: ${code}`,
                      tags: [food.food_group_name, food.food_source_name].filter(Boolean),
                      url: `https://food-nutrition.canada.ca/api/canadian-nutrient-file/food/?lang=en&type=json&id=${code}`,
                      format: "JSON",
                    })} className="activity-icon" style={{ width: 24, height: 24 }} title="Preview & AI analysis">
                      <Eye size={12} style={{ color: "var(--text-muted)" }} />
                    </button>
                    <button
                      onClick={() => !isImported && handleImport(food)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                      style={{
                        background: isImported ? "rgba(46,160,67,0.15)" : "var(--bg-overlay)",
                        color: isImported ? "var(--color-success)" : "var(--accent-primary)",
                        border: `1px solid ${isImported ? "var(--color-success)" : "var(--border-default)"}`,
                      }}>
                      {isImported ? <><Check size={11} /> Added</> : <><Plus size={11} /> Add</>}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-3" style={{ background: "var(--bg-overlay)" }}>
                    {loadingNutrients === code ? (
                      <div className="flex items-center gap-2 py-3" style={{ color: "var(--text-muted)" }}>
                        <Loader2 size={13} className="animate-spin" />
                        <span className="text-xs">Loading nutrients...</span>
                      </div>
                    ) : foodNutrients.length > 0 ? (
                      <div className="mt-2">
                        <div className="text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                          Nutritional Composition ({foodNutrients.length} nutrients)
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 max-h-52 overflow-y-auto">
                          {foodNutrients.map((n, i) => (
                            <div key={i} className="flex justify-between items-center py-0.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                              <span className="text-xs truncate" style={{ color: "var(--text-secondary)", maxWidth: "70%" }}>
                                {n.nutrient_name_english || n.nutrient_web_name || `Nutrient ${n.nutrient_id}`}
                              </span>
                              <span className="text-xs font-mono shrink-0" style={{ color: "var(--accent-primary)" }}>
                                {n.nutrient_value != null ? `${n.nutrient_value} ${n.unit || ""}` : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                        <a href={`https://food-nutrition.canada.ca/cnf-fce/food-aliment.do?lang=en&id=${code}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs"
                          style={{ color: "var(--color-info)" }}>
                          View on CNF website →
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs py-2" style={{ color: "var(--text-muted)" }}>No nutrient data available.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-4 py-2 border-t shrink-0 flex items-center justify-between"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filtered.length > 0 ? `${filtered.length} of ${results.length} results` : "Source: Health Canada CNF"}
          </span>
          <a href="https://food-nutrition.canada.ca/cnf-fce/index-eng.jsp" target="_blank" rel="noopener noreferrer"
            className="text-xs" style={{ color: "var(--color-info)" }}>
            CNF Home →
          </a>
        </div>
      </div>

      {previewItem && (
        <DataSourcePreview
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}