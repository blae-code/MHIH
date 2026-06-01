/**
 * DiscoveryPanel — review queue for AI-discovered SourceCandidate records.
 * Admins can approve (promotes to DataSource), reject, or open the source URL.
 */
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, RefreshCw, Check, X, ExternalLink, AlertCircle,
  Search, Calendar, Tag, ChevronDown, ChevronRight,
} from "lucide-react";

const RELEVANCE_COLOR = (score) => {
  if (score >= 80) return "#00e676";
  if (score >= 60) return "#FEDD00";
  if (score >= 40) return "#ffab40";
  return "#8bafd4";
};

export default function DiscoveryPanel({ onApproved }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [acting, setActing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    base44.entities.SourceCandidate.filter({ status: "pending" }, "-relevance_score", 50)
      .then(setCandidates)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDiscover = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("discoverSourceCandidates", { max_candidates: 12 });
      if (res.data?.success === false) {
        setError(res.data?.error || "Discovery failed");
      }
    } catch (e) {
      setError(e.message);
    }
    setRunning(false);
    load();
  };

  const handleApprove = async (c) => {
    setActing(c.id);
    try {
      const res = await base44.functions.invoke("approveSourceCandidate", { candidate_id: c.id });
      if (res.data?.success === false && res.status !== 409) {
        setError(res.data?.error || "Approve failed");
      } else {
        onApproved?.();
      }
    } catch (e) {
      setError(e.message);
    }
    setActing(null);
    load();
  };

  const handleReject = async (c) => {
    setActing(c.id);
    try {
      await base44.entities.SourceCandidate.update(c.id, { status: "rejected" });
    } catch (e) {
      setError(e.message);
    }
    setActing(null);
    load();
  };

  return (
    <div className="src-widget-card">
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="dashboard-section-label flex items-center gap-1.5" style={{ margin: 0 }}>
            <Sparkles size={11} style={{ color: "#FEDD00" }} />
            AI Discovery Queue
            {candidates.length > 0 && (
              <span className="ml-1 px-1.5 rounded-full font-bold" style={{ background: "#FEDD00", color: "#04245a", fontSize: 9 }}>
                {candidates.length}
              </span>
            )}
          </div>
          <button
            onClick={handleDiscover}
            disabled={running}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
            style={{
              background: running ? "var(--bg-overlay)" : "linear-gradient(135deg, rgba(254,221,0,0.15) 0%, rgba(254,221,0,0.05) 100%)",
              border: "1px solid rgba(254,221,0,0.3)",
              color: "#FEDD00",
              opacity: running ? 0.6 : 1,
            }}
            title="Search the web for new publications now (uses AI credits)"
          >
            <RefreshCw size={10} className={running ? "animate-spin" : ""} />
            {running ? "Searching..." : "Scan Now"}
          </button>
        </div>

        {error && (
          <div className="mb-2 p-2 rounded-md flex items-start gap-1.5 text-xs" style={{ background: "rgba(255,23,68,0.08)", border: "1px solid rgba(255,23,68,0.3)", color: "var(--color-error)" }}>
            <AlertCircle size={11} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6 gap-2" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs">Loading queue...</span>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-6" style={{ color: "var(--text-muted)" }}>
            <Search size={20} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No pending candidates.</p>
            <p className="text-xs mt-1 opacity-70">Click "Scan Now" to discover new sources.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {candidates.map(c => {
              const isOpen = expanded === c.id;
              const color = RELEVANCE_COLOR(c.relevance_score);
              return (
                <div
                  key={c.id}
                  className="rounded-md transition-all"
                  style={{
                    background: "var(--bg-overlay)",
                    border: `1px solid ${color}33`,
                  }}
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : c.id)}
                    className="w-full px-2.5 py-2 flex items-start gap-2 text-left"
                  >
                    {isOpen
                      ? <ChevronDown size={11} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                      : <ChevronRight size={11} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-semibold line-clamp-2" style={{ color: "var(--text-primary)" }}>
                          {c.name}
                        </div>
                        <span
                          className="shrink-0 px-1.5 py-0.5 rounded font-bold font-mono"
                          style={{ background: `${color}22`, color, fontSize: 10, border: `1px solid ${color}55` }}
                          title="AI relevance score (0–100)"
                        >
                          {c.relevance_score}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {c.publisher && (
                          <span className="text-xs truncate" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                            {c.publisher}
                          </span>
                        )}
                        {c.publication_date && (
                          <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                            <Calendar size={8} /> {c.publication_date}
                          </span>
                        )}
                        {c.suggested_category && (
                          <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                            <Tag size={8} /> {c.suggested_category.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-2.5 pb-2.5 pt-1 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                      {c.summary && (
                        <p className="text-xs mb-2" style={{ color: "var(--text-secondary)", lineHeight: 1.45 }}>
                          {c.summary}
                        </p>
                      )}
                      {c.relevance_reason && (
                        <div className="text-xs mb-2 italic" style={{ color: "var(--text-muted)", fontSize: 10.5 }}>
                          <span className="font-semibold not-italic" style={{ color: "var(--accent-primary)" }}>Why: </span>
                          {c.relevance_reason}
                        </div>
                      )}
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs truncate mb-2"
                        style={{ color: "var(--color-info)" }}
                      >
                        <ExternalLink size={9} /> {c.url}
                      </a>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApprove(c)}
                          disabled={acting === c.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold"
                          style={{ background: "var(--color-success)", color: "#04245a", opacity: acting === c.id ? 0.5 : 1 }}
                        >
                          <Check size={10} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(c)}
                          disabled={acting === c.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs"
                          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--color-error)", opacity: acting === c.id ? 0.5 : 1 }}
                        >
                          <X size={10} /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}