import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Database, Filter, UploadCloud } from "lucide-react";
import { listDatasets, listMetrics, syncCatalog } from "@/api/redriverModuleApi";
import { useApp } from "@/Layout";

export default function MetricCatalogPanel() {
  const { addLog, user } = /** @type {any} */ (useApp());
  const [datasets, setDatasets] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [datasetFilter, setDatasetFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [dsRes, mtRes] = await Promise.all([
        listDatasets({ includeDeprecated: false }),
        listMetrics({ status: "active" }),
      ]);
      setDatasets(dsRes.datasets || []);
      setMetrics(mtRes.metrics || []);
    } catch (e) {
      const msg = e.message || "Failed to load catalog";
      setError(msg);
      addLog("error", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(metrics.map((m) => m.category).filter(Boolean))].sort();
  }, [metrics]);

  const filteredMetrics = useMemo(() => {
    return metrics.filter((m) => {
      const datasetOk = datasetFilter === "all" || (m.dataset_ids || []).includes(datasetFilter);
      const categoryOk = categoryFilter === "all" || m.category === categoryFilter;
      return datasetOk && categoryOk;
    });
  }, [metrics, datasetFilter, categoryFilter]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncCatalog({ dry_run: false });
      addLog("success", `Catalog synced (${res.counts?.metrics_upserted || 0} metrics, ${res.counts?.datasets_upserted || 0} datasets)`);
      await load();
    } catch (e) {
      addLog("error", e.message || "Catalog sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Database size={14} style={{ color: "var(--accent-primary)" }} />
            Metric Catalog
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Canonical metric definitions and dataset manifests for Red River OS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
              {syncing ? <RefreshCw size={11} className="animate-spin" /> : <UploadCloud size={11} />}
              Sync Catalog
            </button>
          )}
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <Filter size={12} style={{ color: "var(--text-muted)" }} />
        <select value={datasetFilter} onChange={(e) => setDatasetFilter(e.target.value)} className="text-xs px-2 py-1 rounded" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
          <option value="all">All Datasets</option>
          {datasets.map((d) => (
            <option key={d.dataset_id} value={d.dataset_id}>{d.name}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="text-xs px-2 py-1 rounded" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
          ))}
        </select>
        <div className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
          {filteredMetrics.length} metrics
        </div>
      </div>

      {error && (
        <div className="text-xs px-3 py-2 rounded" style={{ background: "rgba(255,23,68,0.08)", color: "var(--color-error)", border: "1px solid rgba(255,23,68,0.25)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          <RefreshCw size={12} className="animate-spin" /> Loading catalog...
        </div>
      ) : (
        <div className="rounded-lg overflow-auto" style={{ border: "1px solid var(--border-subtle)", maxHeight: 420 }}>
          <table className="w-full data-table text-xs">
            <thead>
              <tr>
                <th className="text-left">Metric</th>
                <th className="text-left">Category</th>
                <th className="text-left">Datasets</th>
                <th className="text-left">Direction</th>
                <th className="text-right">Version</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.map((m) => (
                <tr key={m.metric_id}>
                  <td>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{m.name}</div>
                    <div style={{ color: "var(--text-muted)" }}>{m.metric_id}</div>
                  </td>
                  <td>{m.category?.replace(/_/g, " ")}</td>
                  <td>{(m.dataset_ids || []).join(", ") || "—"}</td>
                  <td>{String(m.direction || "neutral").replace(/_/g, " ")}</td>
                  <td className="text-right">{m.version || 1}</td>
                </tr>
              ))}
              {!filteredMetrics.length && (
                <tr>
                  <td colSpan={5} className="text-center" style={{ color: "var(--text-muted)" }}>No metrics found for selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
