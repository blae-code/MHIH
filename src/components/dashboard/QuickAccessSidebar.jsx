/**
 * QuickAccessSidebar
 *
 * Narrow left-rail navigator on the Dashboard. Lets the user jump in one click
 * between regional health datasets and active data gaps.
 *
 * - Regional datasets: derived from currently loaded metrics + sources, grouped
 *   by region, with a counts badge.
 * - Active data gaps: pulled from the `DataGap` entity, filtered to open or
 *   in-progress, sorted by priority.
 *
 * Selecting an item navigates the user to the relevant module:
 *   - Region   → DataRepository pre-filtered by region
 *   - Gap      → Recommendations / DataPrep with a focus param
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { MapPin, AlertTriangle, ChevronRight, Database, ListFilter, RefreshCw } from "lucide-react";

const REGION_ORDER = [
  "BC",
  "Provincial",
  "Northern BC",
  "Interior BC",
  "Fraser",
  "Vancouver Island",
  "Vancouver Coastal",
];

function severityColor(score) {
  if (score == null) return "var(--text-muted)";
  if (score >= 80) return "var(--color-error)";
  if (score >= 60) return "var(--color-warning)";
  return "var(--color-info)";
}

export default function QuickAccessSidebar({ metrics = [], sources = [] }) {
  const [gaps, setGaps] = useState([]);
  const [loadingGaps, setLoadingGaps] = useState(true);
  const [filter, setFilter] = useState(""); // "" = all, otherwise region

  useEffect(() => {
    let cancelled = false;
    setLoadingGaps(true);
    base44.entities.DataGap
      .filter({ status: "open" }, "-priority_score", 50)
      .then((rows) => { if (!cancelled) setGaps(rows || []); })
      .catch(() => { if (!cancelled) setGaps([]); })
      .finally(() => { if (!cancelled) setLoadingGaps(false); });
    return () => { cancelled = true; };
  }, []);

  // Group metrics by region → { region, metricCount, sourceCount }
  const regions = useMemo(() => {
    const map = new Map();
    for (const m of metrics) {
      const r = m.region || "Unspecified";
      if (!map.has(r)) map.set(r, { region: r, metricCount: 0, sourceIds: new Set() });
      const slot = map.get(r);
      slot.metricCount += 1;
      if (m.data_source_id) slot.sourceIds.add(m.data_source_id);
    }
    // Layer in sources that have a region attribute but no metrics yet
    for (const s of sources) {
      const r = s.region || null;
      if (!r) continue;
      if (!map.has(r)) map.set(r, { region: r, metricCount: 0, sourceIds: new Set() });
      map.get(r).sourceIds.add(s.id);
    }
    const rows = Array.from(map.values()).map((r) => ({
      region: r.region,
      metricCount: r.metricCount,
      sourceCount: r.sourceIds.size,
    }));
    rows.sort((a, b) => {
      const ai = REGION_ORDER.indexOf(a.region);
      const bi = REGION_ORDER.indexOf(b.region);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return b.metricCount - a.metricCount;
    });
    return rows;
  }, [metrics, sources]);

  const filteredGaps = useMemo(() => {
    if (!filter) return gaps;
    return gaps.filter((g) => g.region === filter);
  }, [gaps, filter]);

  return (
    <aside
      className="flex flex-col rounded-lg overflow-hidden"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        minHeight: 320,
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "linear-gradient(180deg, rgba(254,221,0,0.04) 0%, transparent 100%)",
        }}
      >
        <ListFilter size={12} style={{ color: "var(--accent-primary)" }} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-primary)", letterSpacing: "0.08em" }}
        >
          Quick Access
        </span>
      </div>

      {/* Regional Datasets */}
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <MapPin size={11} style={{ color: "var(--color-info)" }} />
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", letterSpacing: "0.08em", fontSize: 10 }}
            >
              Regional Datasets
            </span>
          </div>
          {filter && (
            <button
              onClick={() => setFilter("")}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
              title="Clear region filter"
            >
              clear
            </button>
          )}
        </div>
        {regions.length === 0 ? (
          <div className="text-xs py-3 text-center" style={{ color: "var(--text-muted)" }}>
            No regional datasets loaded.
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {regions.map((r) => {
              const isActive = filter === r.region;
              return (
                <div key={r.region} className="flex items-center gap-1">
                  <Link
                    to={`${createPageUrl("DataRepository")}?region=${encodeURIComponent(r.region)}`}
                    className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors"
                    style={{
                      background: isActive ? "rgba(254,221,0,0.08)" : "transparent",
                      border: `1px solid ${isActive ? "rgba(254,221,0,0.3)" : "transparent"}`,
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    title={`Browse ${r.region} datasets`}
                  >
                    <span className="flex-1 truncate" style={{ fontWeight: 500 }}>{r.region}</span>
                    <span
                      className="shrink-0 tabular-nums"
                      style={{ color: "var(--text-muted)", fontSize: 10 }}
                      title={`${r.metricCount} metrics · ${r.sourceCount} sources`}
                    >
                      {r.metricCount} · {r.sourceCount}
                    </span>
                    <ChevronRight size={10} style={{ color: "var(--text-muted)", opacity: 0.6 }} />
                  </Link>
                  <button
                    onClick={() => setFilter(isActive ? "" : r.region)}
                    className="shrink-0 px-1.5 py-1 rounded"
                    style={{
                      color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
                      border: "1px solid var(--border-subtle)",
                    }}
                    title={isActive ? "Stop filtering gaps by this region" : "Filter gaps below by this region"}
                  >
                    <Database size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)" }} />

      {/* Active Data Gaps */}
      <div className="px-3 py-2.5 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={11} style={{ color: "var(--color-warning)" }} />
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", letterSpacing: "0.08em", fontSize: 10 }}
            >
              Active Data Gaps
            </span>
          </div>
          <span
            className="text-xs tabular-nums"
            style={{ color: "var(--text-muted)" }}
          >
            {filteredGaps.length}
          </span>
        </div>

        {loadingGaps ? (
          <div className="flex items-center justify-center py-6 text-xs" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={11} className="animate-spin mr-1.5" /> Loading...
          </div>
        ) : filteredGaps.length === 0 ? (
          <div className="text-xs py-3 text-center" style={{ color: "var(--text-muted)" }}>
            {filter ? `No open gaps in ${filter}.` : "No active gaps tracked."}
          </div>
        ) : (
          <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 320 }}>
            {filteredGaps.slice(0, 30).map((g) => (
              <Link
                key={g.id}
                to={`${createPageUrl("Recommendations")}?gap_id=${encodeURIComponent(g.id)}`}
                className="flex items-start gap-2 px-2 py-1.5 rounded text-xs transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                title={g.priority_reason || g.missing_indicator}
              >
                <span
                  className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full"
                  style={{ background: severityColor(Number(g.priority_score)) }}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {g.missing_indicator || "Untitled gap"}
                  </div>
                  <div
                    className="truncate"
                    style={{ color: "var(--text-muted)", fontSize: 10 }}
                  >
                    {[g.category?.replace(/_/g, " "), g.region, g.year].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <span
                  className="shrink-0 tabular-nums"
                  style={{ color: severityColor(Number(g.priority_score)), fontSize: 10, fontWeight: 600 }}
                >
                  {g.priority_score != null ? Math.round(Number(g.priority_score)) : "—"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}