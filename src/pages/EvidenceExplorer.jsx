import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Link2, RefreshCw, Search, ShieldCheck } from "lucide-react";

export default function EvidenceExplorer() {
  const { addLog } = useApp();
  const [links, setLinks] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [l, m] = await Promise.all([
        base44.entities.EvidenceLink.list("-created_date", 1000).catch(() => []),
        base44.entities.HealthMetric.list("-year", 2000).catch(() => []),
      ]);
      setLinks(l || []);
      setMetrics(m || []);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const types = useMemo(() => ["all", ...new Set(links.map(l => l.link_type).filter(Boolean))], [links]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return links.filter(l => {
      if (filterType !== "all" && l.link_type !== filterType) return false;
      if (!q) return true;
      return [l.metric_name, l.source_name, l.link_type, l.model_version, l.memo_id, l.run_id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [links, query, filterType]);

  const metricById = useMemo(() => {
    const map = new Map();
    metrics.forEach(m => map.set(m.id, m));
    return map;
  }, [metrics]);

  return (
    <div className="p-5 h-full overflow-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Link2 size={14} style={{ color: "var(--accent-primary)" }} />
            Evidence Explorer
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Trace AI claims back to metrics, sources, lineage fields, and model versions.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap p-3 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", minWidth: 220 }}>
          <Search size={11} style={{ color: "var(--text-muted)" }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search links, runs, memos, source..." className="bg-transparent outline-none text-xs flex-1" style={{ color: "var(--text-primary)" }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-xs px-2 py-1 rounded outline-none" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
          {types.map(t => <option key={t} value={t}>{t === "all" ? "All Link Types" : t}</option>)}
        </select>
        <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>{filtered.length} links</span>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
        {loading ? (
          <div className="py-10 text-center text-xs" style={{ color: "var(--text-muted)" }}><RefreshCw size={12} className="inline animate-spin mr-1" /> Loading evidence links...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-xs" style={{ color: "var(--text-muted)" }}>No evidence links found.</div>
        ) : (
          <table className="w-full data-table text-xs">
            <thead>
              <tr>
                <th className="text-left">Type</th>
                <th className="text-left">Metric</th>
                <th className="text-left">Source</th>
                <th className="text-left">Model</th>
                <th className="text-right">Confidence</th>
                <th className="text-left">Lineage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 600).map(link => {
                const metric = metricById.get(link.metric_id);
                return (
                  <tr key={link.id}>
                    <td><span className="tag">{link.link_type || "unknown"}</span></td>
                    <td>
                      <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{link.metric_name || metric?.name || "—"}</div>
                      <div style={{ color: "var(--text-muted)" }}>{metric?.category?.replace(/_/g, " ") || "—"} · {metric?.region || "—"} · {metric?.year || "—"}</div>
                    </td>
                    <td>{link.source_name || metric?.data_source_name || "—"}</td>
                    <td>{link.model_version || "—"}</td>
                    <td className="text-right">{link.confidence_score != null ? `${(Number(link.confidence_score) * 100).toFixed(0)}%` : "—"}</td>
                    <td>
                      <div style={{ color: "var(--text-muted)" }}>run: {link.run_id ? String(link.run_id).slice(0, 8) : "—"}</div>
                      <div style={{ color: "var(--text-muted)" }}>memo: {link.memo_id ? String(link.memo_id).slice(0, 8) : "—"}</div>
                      {metric?.lineage_id && <div style={{ color: "var(--accent-primary)" }}>lineage: {String(metric.lineage_id).slice(0, 18)}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded p-3 text-xs" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)", color: "var(--text-secondary)" }}>
        <div className="font-semibold mb-1" style={{ color: "var(--accent-primary)" }}>Lineage Integrity Rule</div>
        Randomly sample 10 links per week and verify each claim traces to a concrete `metric_id`, `run_id`, and source record.
      </div>
    </div>
  );
}
