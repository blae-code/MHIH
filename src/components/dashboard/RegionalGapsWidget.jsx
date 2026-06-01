/**
 * RegionalGapsWidget — highlights regional data gaps so analysts can prioritize
 * which metrics or datasets to acquire next to complete the health mapping.
 *
 * Data: reads from the DataGap entity. Groups open + in-progress gaps by region,
 * scores each region by total priority weight, and surfaces the top missing
 * indicators per region. Closed/filled gaps are excluded.
 *
 * Action paths:
 *   - "Find a source" → DataSources page (filtered by category if available)
 *   - "Add metric"    → DataRepository page
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  MapPin, AlertTriangle, ChevronRight, Search, Plus,
  RefreshCw, Target,
} from "lucide-react";

const PRIORITY_COLOR = (score) => {
  if (score >= 75) return "#ff4d4f";
  if (score >= 50) return "#ffab40";
  if (score >= 25) return "#FEDD00";
  return "#40c4ff";
};

const PRIORITY_LABEL = (score) => {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
};

function formatCategory(c) {
  if (!c) return "—";
  return c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

export default function RegionalGapsWidget() {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRegion, setExpandedRegion] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pull open + in-progress gaps; filled gaps are not actionable here.
      const all = await base44.entities.DataGap.list("-priority_score", 200);
      setGaps((all || []).filter(g => g.status !== "filled"));
    } catch (e) {
      setError(e.message || "Failed to load data gaps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Group by region → list of gaps + roll-up priority weight
  const regionGroups = useMemo(() => {
    const byRegion = {};
    for (const g of gaps) {
      const region = g.region || "Unassigned";
      if (!byRegion[region]) byRegion[region] = { region, gaps: [], totalScore: 0, criticalCount: 0 };
      byRegion[region].gaps.push(g);
      byRegion[region].totalScore += Number(g.priority_score || 0);
      if ((g.priority_score || 0) >= 75) byRegion[region].criticalCount += 1;
    }
    return Object.values(byRegion)
      .map(r => ({
        ...r,
        gaps: r.gaps.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0)),
        avgScore: r.gaps.length ? r.totalScore / r.gaps.length : 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [gaps]);

  const totalOpen = gaps.length;
  const totalCritical = gaps.filter(g => (g.priority_score || 0) >= 75).length;

  return (
    <div className="dashboard-widget-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div>
          <div className="dashboard-section-label">Acquisition Priorities</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.8 }}>
            Regional data gaps — what to acquire next
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalCritical > 0 && (
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold"
              style={{
                background: "rgba(255,77,79,0.12)",
                border: "1px solid rgba(255,77,79,0.4)",
                color: "#ff4d4f",
                fontSize: 10,
              }}
              title="Gaps with priority score ≥ 75"
            >
              <AlertTriangle size={9} />
              {totalCritical} critical
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            title="Refresh"
            className="activity-icon"
            style={{ width: 24, height: 24, opacity: loading ? 0.5 : 1 }}
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-8 relative z-10" style={{ color: "var(--text-muted)" }}>
          <RefreshCw size={14} className="animate-spin mr-2" />
          <span className="text-xs">Loading gaps...</span>
        </div>
      ) : error ? (
        <div className="text-xs py-6 text-center relative z-10" style={{ color: "var(--color-error)" }}>
          {error}
        </div>
      ) : regionGroups.length === 0 ? (
        <div className="text-xs py-8 text-center relative z-10" style={{ color: "var(--text-muted)" }}>
          <Target size={20} style={{ color: "var(--text-muted)", opacity: 0.4, margin: "0 auto 8px" }} />
          <div>No open data gaps recorded.</div>
          <div style={{ opacity: 0.6, marginTop: 4 }}>
            Run a gap analysis from the AI Insights page to populate this widget.
          </div>
        </div>
      ) : (
        <div className="space-y-2 relative z-10">
          {regionGroups.slice(0, 6).map((r) => {
            const isExpanded = expandedRegion === r.region;
            const color = PRIORITY_COLOR(r.avgScore);
            return (
              <div
                key={r.region}
                className="rounded-md overflow-hidden"
                style={{
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--border-subtle)",
                  borderLeft: `2.5px solid ${color}`,
                }}
              >
                {/* Region header — clickable to expand */}
                <button
                  type="button"
                  onClick={() => setExpandedRegion(isExpanded ? null : r.region)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-left transition-colors"
                  style={{ background: isExpanded ? "var(--bg-hover)" : "transparent" }}
                  onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                >
                  <MapPin size={11} style={{ color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-xs font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {r.region}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                      {r.gaps.length} gap{r.gaps.length === 1 ? "" : "s"}
                      {r.criticalCount > 0 && (
                        <> · <span style={{ color: "#ff4d4f", fontWeight: 600 }}>{r.criticalCount} critical</span></>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="px-1.5 py-0.5 rounded font-semibold tabular-nums"
                      style={{
                        fontSize: 9.5,
                        background: color + "22",
                        color,
                        border: `1px solid ${color}55`,
                      }}
                      title={`Average priority ${r.avgScore.toFixed(0)} / 100`}
                    >
                      {r.avgScore.toFixed(0)}
                    </span>
                    <ChevronRight
                      size={11}
                      style={{
                        color: "var(--text-muted)",
                        transform: isExpanded ? "rotate(90deg)" : "none",
                        transition: "transform 0.15s",
                      }}
                    />
                  </div>
                </button>

                {/* Expanded gap list */}
                {isExpanded && (
                  <div
                    className="px-2.5 py-2 space-y-1.5"
                    style={{
                      background: "var(--bg-surface)",
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    {r.gaps.slice(0, 5).map((g) => {
                      const gColor = PRIORITY_COLOR(g.priority_score || 0);
                      const gLabel = PRIORITY_LABEL(g.priority_score || 0);
                      return (
                        <div
                          key={g.id}
                          className="flex items-start gap-2 p-2 rounded"
                          style={{
                            background: "var(--bg-overlay)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div
                            className="w-1 h-full self-stretch rounded-full shrink-0 mt-0.5"
                            style={{ background: gColor, minHeight: 28 }}
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-xs font-medium leading-snug"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {g.missing_indicator}
                            </div>
                            <div
                              className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap"
                              style={{ color: "var(--text-muted)", fontSize: 10 }}
                            >
                              <span>{formatCategory(g.category)}</span>
                              {g.year && <><span>·</span><span>{g.year}</span></>}
                              <span
                                className="px-1 rounded font-semibold"
                                style={{
                                  background: gColor + "22",
                                  color: gColor,
                                  fontSize: 9,
                                }}
                              >
                                {gLabel} · {g.priority_score || 0}
                              </span>
                            </div>
                            {g.priority_reason && (
                              <div
                                className="text-xs mt-1 line-clamp-2 leading-snug"
                                style={{ color: "var(--text-secondary)", fontSize: 10.5 }}
                              >
                                {g.priority_reason}
                              </div>
                            )}
                            {g.suggested_source && (
                              <div
                                className="text-xs mt-1"
                                style={{ color: "var(--color-info)", fontSize: 10 }}
                              >
                                Suggested source: {g.suggested_source}
                              </div>
                            )}
                            {/* Action links */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <Link
                                to={createPageUrl("DataSources")}
                                className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors"
                                style={{
                                  background: "rgba(64,196,255,0.1)",
                                  border: "1px solid rgba(64,196,255,0.3)",
                                  color: "#40c4ff",
                                  fontSize: 9.5,
                                  textDecoration: "none",
                                }}
                                title="Find or connect a data source for this gap"
                              >
                                <Search size={9} />
                                Find a source
                              </Link>
                              <Link
                                to={createPageUrl("DataRepository")}
                                className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors"
                                style={{
                                  background: "rgba(254,221,0,0.08)",
                                  border: "1px solid rgba(254,221,0,0.25)",
                                  color: "var(--accent-primary)",
                                  fontSize: 9.5,
                                  textDecoration: "none",
                                }}
                                title="Add the missing metric to the repository"
                              >
                                <Plus size={9} />
                                Add metric
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {r.gaps.length > 5 && (
                      <div
                        className="text-xs text-center pt-1"
                        style={{ color: "var(--text-muted)", fontSize: 10 }}
                      >
                        +{r.gaps.length - 5} more gap{r.gaps.length - 5 === 1 ? "" : "s"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {regionGroups.length > 6 && (
            <div className="text-xs text-center pt-1" style={{ color: "var(--text-muted)", fontSize: 10 }}>
              {regionGroups.length - 6} more region{regionGroups.length - 6 === 1 ? "" : "s"} with open gaps
            </div>
          )}
        </div>
      )}

      {/* Footer summary */}
      {!loading && !error && regionGroups.length > 0 && (
        <div
          className="flex items-center justify-between mt-3 pt-2 relative z-10"
          style={{ borderTop: "1px solid var(--border-subtle)", fontSize: 10, color: "var(--text-muted)" }}
        >
          <span>
            {totalOpen} open gap{totalOpen === 1 ? "" : "s"} across {regionGroups.length} region{regionGroups.length === 1 ? "" : "s"}
          </span>
          <Link
            to={createPageUrl("AIInsights")}
            className="flex items-center gap-1 hover:underline"
            style={{ color: "var(--accent-primary)", textDecoration: "none" }}
          >
            Run gap analysis <ChevronRight size={10} />
          </Link>
        </div>
      )}
    </div>
  );
}