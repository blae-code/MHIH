import React from "react";
import { SlidersHorizontal, Search, X, MapPin, Tag, Activity } from "lucide-react";

/**
 * ListFilterBar — unified filter strip for every list page.
 *
 * Provides three core dropdowns:
 *   • region            (e.g. "BC", "Northern BC", "Fraser", "Provincial")
 *   • category          (metric / source category)
 *   • status            (data source status: active / inactive / error / pending)
 *
 * Plus an optional search field and any extra trailing controls (sort, view-toggle, bulk-delete).
 * Each filter is independent — pass `null` (or omit) to hide that filter.
 *
 * Props:
 *   • search, onSearchChange, searchPlaceholder
 *   • region, onRegionChange, regionOptions       (array of strings — "all" auto-included)
 *   • category, onCategoryChange, categoryOptions
 *   • status, onStatusChange, statusOptions
 *   • onClear (called when any active filter is reset via the Clear button)
 *   • extra (ReactNode rendered on the right side of the filter strip)
 *
 * Each select gets a coloured ring when active so the user can see at a glance
 * which dimensions are filtering.
 */
export default function ListFilterBar({
  // Search
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,

  // Region
  region,
  onRegionChange,
  regionOptions,

  // Category
  category,
  onCategoryChange,
  categoryOptions,

  // Status
  status,
  onStatusChange,
  statusOptions,

  // Reset + extras
  onClear,
  extra,
}) {
  const hasActiveFilters =
    (showSearch && !!search) ||
    (regionOptions && region && region !== "all") ||
    (categoryOptions && category && category !== "all") ||
    (statusOptions && status && status !== "all");

  const handleClear = () => {
    if (showSearch && onSearchChange) onSearchChange("");
    if (regionOptions && onRegionChange) onRegionChange("all");
    if (categoryOptions && onCategoryChange) onCategoryChange("all");
    if (statusOptions && onStatusChange) onStatusChange("all");
    if (onClear) onClear();
  };

  return (
    <div className="cockpit-widget-card sources-widget-card src-widget-card repo-widget-card" style={{ padding: 10 }}>
      <div className="flex items-center gap-2 flex-wrap relative z-10">
        <div className="flex items-center gap-1.5 text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
          <SlidersHorizontal size={12} />
          <span>Filters</span>
        </div>

        {showSearch && (
          <div className="relative" style={{ minWidth: 200 }}>
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              className="w-full text-xs pl-8 pr-8 py-1.5 rounded-lg outline-none transition-all"
              style={{
                background: "var(--bg-overlay)",
                border: `1px solid ${search ? "rgba(254,221,0,0.4)" : "var(--border-subtle)"}`,
                color: "var(--text-primary)",
              }}
              placeholder={searchPlaceholder}
              value={search ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            {search && (
              <button onClick={() => onSearchChange?.("")} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                <X size={11} />
              </button>
            )}
          </div>
        )}

        {regionOptions && (
          <FilterDropdown
            icon={<MapPin size={11} />}
            value={region}
            onChange={onRegionChange}
            allLabel="All Regions"
            options={regionOptions}
            color="#40c4ff"
            minWidth={140}
          />
        )}

        {categoryOptions && (
          <FilterDropdown
            icon={<Tag size={11} />}
            value={category}
            onChange={onCategoryChange}
            allLabel="All Categories"
            options={categoryOptions}
            color="#FEDD00"
            minWidth={150}
            humanize
          />
        )}

        {statusOptions && (
          <FilterDropdown
            icon={<Activity size={11} />}
            value={status}
            onChange={onStatusChange}
            allLabel="All Statuses"
            options={statusOptions}
            color="#00e676"
            minWidth={130}
            capitalize
          />
        )}

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
            style={{ background: "rgba(255,23,68,0.08)", color: "var(--color-error)", border: "1px solid rgba(255,23,68,0.2)" }}
          >
            <X size={10} /> Clear
          </button>
        )}

        {extra && <div className="flex items-center gap-2 ml-auto">{extra}</div>}
      </div>
    </div>
  );
}

function FilterDropdown({ icon, value, onChange, allLabel, options, color, minWidth, humanize, capitalize }) {
  const active = value && value !== "all";
  return (
    <div className="flex items-center gap-1 rounded-lg px-2"
      style={{
        background: "var(--bg-overlay)",
        border: `1px solid ${active ? color + "66" : "var(--border-subtle)"}`,
        minWidth,
        transition: "border-color 0.15s",
      }}>
      <span style={{ color: active ? color : "var(--text-muted)" }}>{icon}</span>
      <select
        className="bg-transparent outline-none text-xs flex-1 py-1.5"
        style={{ color: active ? color : "var(--text-secondary)", cursor: "pointer" }}
        value={value ?? "all"}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {humanize
              ? o.replace(/_/g, " ")
              : capitalize
                ? o.charAt(0).toUpperCase() + o.slice(1)
                : o}
          </option>
        ))}
      </select>
    </div>
  );
}