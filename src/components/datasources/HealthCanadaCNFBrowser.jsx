import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Search, ChevronDown, ChevronRight, Plus, Check, Loader2, FlaskConical } from "lucide-react";

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

export default function HealthCanadaCNFBrowser({ onClose, onImport }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [nutrients, setNutrients] = useState({});
  const [loadingNutrients, setLoadingNutrients] = useState(null);
  const [imported, setImported] = useState({});

  const search = async (q) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setResults([]);
    setExpanded(null);
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
      metadata: {
        food_code: code,
        food_description: food.food_description,
        food_group: food.food_group_name,
        source: "health_canada_cnf",
      },
    };
    await onImport(sourceData);
    setImported(prev => ({ ...prev, [code]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="flex flex-col w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", maxHeight: "85vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2">
            <FlaskConical size={15} style={{ color: "var(--accent-primary)" }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Health Canada — Canadian Nutrient File</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Search foods and view nutritional composition data</div>
            </div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              <Search size={13} style={{ color: "var(--text-muted)" }} />
              <input
                className="flex-1 bg-transparent outline-none text-xs"
                style={{ color: "var(--text-primary)" }}
                placeholder="Search food by name or code..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
              />
            </div>
            <button onClick={() => search()}
              className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: "var(--accent-primary)", color: "#000" }}>
              Search
            </button>
          </div>
          {/* Quick searches */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_SEARCHES.map(qs => (
              <button key={qs.query}
                onClick={() => { setQuery(qs.query); search(qs.query); }}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                {qs.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Searching CNF...</span>
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="text-center py-12 text-xs" style={{ color: "var(--text-muted)" }}>
              Search for a food to see nutritional data from the Canadian Nutrient File.
            </div>
          )}
          {results.map(food => {
            const code = food.food_code;
            const isExpanded = expanded === code;
            const foodNutrients = nutrients[code] || [];
            const isImported = imported[code];

            return (
              <div key={code} className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-opacity-50 cursor-pointer"
                  style={{ background: isExpanded ? "var(--bg-overlay)" : "transparent" }}
                  onMouseOver={e => { if (!isExpanded) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseOut={e => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}>
                  <button onClick={() => toggleExpand(food)} className="shrink-0" style={{ color: "var(--text-muted)" }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <div className="flex-1 min-w-0" onClick={() => toggleExpand(food)}>
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
                  <button
                    onClick={() => !isImported && handleImport(food)}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs"
                    style={{
                      background: isImported ? "rgba(46,160,67,0.15)" : "var(--bg-overlay)",
                      color: isImported ? "var(--color-success)" : "var(--accent-primary)",
                      border: `1px solid ${isImported ? "var(--color-success)" : "var(--border-default)"}`,
                    }}>
                    {isImported ? <><Check size={11} /> Added</> : <><Plus size={11} /> Add</>}
                  </button>
                </div>

                {/* Expanded: nutrient table */}
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

        {/* Footer */}
        <div className="px-4 py-2 border-t shrink-0 flex items-center justify-between"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {results.length > 0 ? `${results.length} results` : "Source: Health Canada Canadian Nutrient File (CNF)"}
          </span>
          <a href="https://food-nutrition.canada.ca/cnf-fce/index-eng.jsp" target="_blank" rel="noopener noreferrer"
            className="text-xs" style={{ color: "var(--color-info)" }}>
            CNF Home →
          </a>
        </div>
      </div>
    </div>
  );
}