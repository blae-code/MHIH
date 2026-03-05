import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Download, Eye } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createEvidenceSnapshot, exportEvidenceSnapshot, getEvidenceSnapshot } from "@/api/redriverModuleApi";
import { useApp } from "@/Layout";

function decodeBase64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function downloadBase64File(fileName, mimeType, base64) {
  const bytes = decodeBase64ToBytes(base64);
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function EvidenceSnapshotsPanel({ projectionMode = "projected", latestQuery = null }) {
  const { addLog } = /** @type {any} */ (useApp());
  const [title, setTitle] = useState("Red River Snapshot");
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [entityMissing, setEntityMissing] = useState(false);

  const loadSnapshots = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await base44.entities.EvidenceSnapshot.list("-created_date", 50);
      setSnapshots(rows || []);
      if (!selectedId && rows?.length) {
        setSelectedId(rows[0].snapshot_id || rows[0].id);
      }
      setEntityMissing(false);
    } catch (e) {
      const msg = e.message || "EvidenceSnapshot entity is unavailable";
      setError(msg);
      setEntityMissing(true);
      addLog("warning", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const canCreate = useMemo(() => {
    return Boolean(latestQuery?.metric_ids?.length);
  }, [latestQuery]);

  const handleCreateSnapshot = async () => {
    if (!canCreate) {
      setError("Run Metric Forge first to capture a query before creating a snapshot.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      const res = await createEvidenceSnapshot({
        title: title.trim() || "Red River Snapshot",
        query: latestQuery,
        projection_mode: projectionMode,
      });
      addLog("success", `Snapshot saved (${res.snapshot_id})`);
      setSelectedId(res.snapshot_id);
      await loadSnapshots();
    } catch (e) {
      const msg = e.message || "Snapshot creation failed";
      setError(msg);
      addLog("error", msg);
    } finally {
      setWorking(false);
    }
  };

  const handleOpenSnapshot = async () => {
    if (!selectedId) return;
    setWorking(true);
    setError("");
    try {
      const res = await getEvidenceSnapshot({
        snapshot_id: selectedId,
        projection_mode: projectionMode,
      });
      setSelectedSnapshot(res.snapshot);
      addLog("success", `Snapshot loaded (${selectedId})`);
    } catch (e) {
      const msg = e.message || "Failed to load snapshot";
      setError(msg);
      addLog("error", msg);
    } finally {
      setWorking(false);
    }
  };

  const handleExport = async (format) => {
    if (!selectedId) return;
    setWorking(true);
    setError("");
    try {
      const res = await exportEvidenceSnapshot({
        snapshot_id: selectedId,
        format,
        projection_mode: projectionMode,
      });
      downloadBase64File(res.file_name, res.mime_type, res.content_base64);
      addLog("success", `Snapshot exported (${format.toUpperCase()})`);
    } catch (e) {
      const msg = e.message || "Snapshot export failed";
      setError(msg);
      addLog("error", msg);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Evidence Snapshots</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Freeze and export deterministic query artifacts.
            </p>
          </div>
          <button
            onClick={loadSnapshots}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Snapshot title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded text-xs"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            />
            <button
              onClick={handleCreateSnapshot}
              disabled={working || entityMissing || !canCreate}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-semibold disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a" }}>
              {working ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              Create Snapshot
            </button>
            {!canCreate && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                No query context yet. Run a Metric Forge query first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Saved snapshots</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-2 py-2 rounded text-xs"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
              <option value="">Select snapshot</option>
              {snapshots.map((row) => {
                const id = row.snapshot_id || row.id;
                return (
                  <option key={id} value={id}>
                    {row.title || id}
                  </option>
                );
              })}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleOpenSnapshot}
                disabled={working || !selectedId}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded text-xs disabled:opacity-60"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                <Eye size={11} />
                View
              </button>
              <button
                onClick={() => handleExport("json")}
                disabled={working || !selectedId}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded text-xs disabled:opacity-60"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                <Download size={11} />
                JSON
              </button>
              <button
                onClick={() => handleExport("csv")}
                disabled={working || !selectedId}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded text-xs disabled:opacity-60"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                <Download size={11} />
                CSV
              </button>
              <button
                onClick={() => handleExport("pdf")}
                disabled={working || !selectedId}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded text-xs disabled:opacity-60"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                <Download size={11} />
                PDF
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-xs mt-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={11} className="animate-spin" />
            Loading snapshots...
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs px-3 py-2 rounded" style={{ background: "rgba(255,23,68,0.08)", border: "1px solid rgba(255,23,68,0.25)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      <div className="rounded-lg p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-muted)" }}>Snapshot preview</h4>
        {!selectedSnapshot ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Select a snapshot and click View to inspect frozen manifest data.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>{selectedSnapshot.title}</strong> · {selectedSnapshot.snapshot_id}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {selectedSnapshot.series_manifest?.total_series || 0} series · {selectedSnapshot.series_manifest?.total_points || 0} points · mode {selectedSnapshot.projection_mode}
            </div>
            <div className="max-h-44 overflow-auto rounded p-2" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              {(selectedSnapshot.data || []).slice(0, 6).map((row) => (
                <div key={`${row.metric_id}_${row.series_key}`} className="text-xs py-1" style={{ color: "var(--text-secondary)" }}>
                  {row.metric_name || row.metric_id} · {row.series_key}
                </div>
              ))}
              {(selectedSnapshot.data || []).length > 6 && (
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  +{(selectedSnapshot.data || []).length - 6} more series
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
