import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Play, Filter } from "lucide-react";
import { listMetrics, queryMetricSeries } from "@/api/redriverModuleApi";
import { useApp } from "@/Layout";

function currentYear() {
  return new Date().getFullYear();
}

export default function MetricForgePanel({ projectionMode = "projected", onQueryComplete = null }) {
  const { addLog } = /** @type {any} */ (useApp());
  const [metrics, setMetrics] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [region, setRegion] = useState("all");
  const [yearFrom, setYearFrom] = useState(String(currentYear() - 5));
  const [yearTo, setYearTo] = useState(String(currentYear()));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const loadMetrics = async () => {
    setLoadingMetrics(true);
    setError("");
    try {
      const res = await listMetrics({ status: "active" });
      const rows = Array.isArray(res.metrics) ? res.metrics : [];
      setMetrics(rows);
      if (!selectedMetrics.length && rows.length) {
        setSelectedMetrics([rows[0].metric_id]);
      }
    } catch (e) {
      const msg = e.message || "Failed to load metric catalog";
      setError(msg);
      addLog("error", msg);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const regions = useMemo(() => {
    const set = new Set(["all"]);
    for (const metric of metrics) {
      const dims = Array.isArray(metric.dimensions) ? metric.dimensions : [];
      const regionDim = dims.find((d) => d?.key === "region");
      const allowed = Array.isArray(regionDim?.allowed_values) ? regionDim.allowed_values : [];
      for (const value of allowed) {
        if (value != null && String(value).trim()) {
          set.add(String(value));
        }
      }
    }
    return Array.from(set);
  }, [metrics]);

  const toggleMetric = (metricId) => {
    setSelectedMetrics((prev) => (
      prev.includes(metricId) ? prev.filter((id) => id !== metricId) : [...prev, metricId]
    ));
  };

  const runQuery = async () => {
    if (!selectedMetrics.length) {
      setError("Select at least one metric to run a query.");
      return;
    }
    if (Number(yearFrom) > Number(yearTo)) {
      setError("Start year must be less than or equal to end year.");
      return;
    }

    setRunning(true);
    setError("");
    try {
      const query = {
        metric_ids: selectedMetrics,
        filters: region === "all" ? {} : { region },
        time: {
          from: Number(yearFrom),
          to: Number(yearTo),
        },
        projection_mode: projectionMode,
      };
      const res = await queryMetricSeries(query);
      setResult(res);
      addLog("success", `Metric Forge query complete (${res.manifest?.total_points || 0} points)`);
      onQueryComplete?.({ query, result: res });
    } catch (e) {
      const msg = e.message || "Metric query failed";
      setError(msg);
      addLog("error", msg);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Metric Forge</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Query catalog metrics with projection-safe controls.
            </p>
          </div>
          <button
            onClick={loadMetrics}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <RefreshCw size={11} />
            Reload
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Metrics</label>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {selectedMetrics.length} selected
              </span>
            </div>
            <div className="max-h-44 overflow-auto rounded-lg p-2" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              {loadingMetrics ? (
                <div className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <RefreshCw size={11} className="animate-spin" />
                  Loading metrics...
                </div>
              ) : (
                metrics.map((metric) => (
                  <label key={metric.metric_id} className="flex items-center gap-2 py-1.5 px-1 rounded cursor-pointer hover:bg-[var(--bg-hover)]">
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.metric_id)}
                      onChange={() => toggleMetric(metric.metric_id)}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{metric.name}</div>
                      <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{metric.metric_id}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs uppercase font-semibold" style={{ color: "var(--text-muted)" }}>
              <Filter size={11} /> Filters
            </div>
            <label className="text-xs block" style={{ color: "var(--text-muted)" }}>Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
              {regions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>

            <label className="text-xs block" style={{ color: "var(--text-muted)" }}>Year from</label>
            <input
              type="number"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            />

            <label className="text-xs block" style={{ color: "var(--text-muted)" }}>Year to</label>
            <input
              type="number"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            />

            <button
              onClick={runQuery}
              disabled={running || loadingMetrics}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-semibold disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a" }}>
              {running ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              Run Query
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-xs px-3 py-2 rounded" style={{ background: "rgba(255,23,68,0.08)", border: "1px solid rgba(255,23,68,0.25)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      <div className="rounded-lg p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Query Results</h4>
          {result?.manifest && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {result.manifest.total_series || 0} series · {result.manifest.total_points || 0} points
            </span>
          )}
        </div>

        {!result ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Run a query to preview projection-safe metric series.
          </p>
        ) : (
          <div className="space-y-2">
            {(result.series || []).slice(0, 6).map((seriesRow) => (
              <div key={`${seriesRow.metric_id}_${seriesRow.series_key}`} className="rounded p-2" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  {seriesRow.metric_name || seriesRow.metric_id}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {seriesRow.series_key} · {(seriesRow.points || []).length} points
                </div>
              </div>
            ))}
            {(result.series || []).length > 6 && (
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                +{(result.series || []).length - 6} additional series
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
