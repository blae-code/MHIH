/**
 * GoogleBigQueryBrowser — modal for browsing & importing tables from BigQuery
 * via the shared `googleBigQuery` backend function.
 *
 * Flow: pick project → pick dataset → pick table → preview/import or run custom SQL.
 */

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  X, Database, Loader2, ChevronRight, Play, Download,
  FolderTree, Table as TableIcon, AlertCircle, Search,
} from "lucide-react";

export default function GoogleBigQueryBrowser({ onClose, onImport }) {
  const [step, setStep] = useState("projects"); // projects | datasets | tables | query
  const [projects, setProjects] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [tables, setTables] = useState([]);
  const [project, setProject] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [table, setTable] = useState(null);
  const [tableDetail, setTableDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [maxRows, setMaxRows] = useState(1000);
  const [filter, setFilter] = useState("");

  // Custom SQL mode
  const [sql, setSql] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [running, setRunning] = useState(false);

  const call = async (payload) => {
    const res = await base44.functions.invoke("googleBigQuery", payload);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  // Load projects on open
  useEffect(() => {
    setLoading(true); setError("");
    call({ action: "listProjects" })
      .then(d => setProjects(d.projects || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const openProject = async (p) => {
    setProject(p); setDataset(null); setTable(null); setTableDetail(null);
    setStep("datasets"); setLoading(true); setError("");
    try {
      const d = await call({ action: "listDatasets", projectId: p.projectId });
      setDatasets(d.datasets || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const openDataset = async (d) => {
    setDataset(d); setTable(null); setTableDetail(null);
    setStep("tables"); setLoading(true); setError("");
    try {
      const r = await call({ action: "listTables", projectId: project.projectId, datasetId: d.datasetId });
      setTables(r.tables || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const openTable = async (t) => {
    setTable(t); setLoading(true); setError(""); setTableDetail(null);
    try {
      const detail = await call({
        action: "getTable",
        projectId: project.projectId,
        datasetId: dataset.datasetId,
        tableId: t.tableId,
      });
      setTableDetail(detail);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleImport = async () => {
    setImporting(true); setError("");
    try {
      const result = await call({
        action: "importTable",
        projectId: project.projectId,
        datasetId: dataset.datasetId,
        tableId: table.tableId,
        maxRows,
      });
      onImport?.({
        name: `BigQuery · ${dataset.datasetId}.${table.tableId}`,
        type: "api",
        category: "other",
        status: "active",
        description: `${result.rowsImported} rows imported from BigQuery`,
        metadata: { provider: "googlebigquery", ...result },
      });
      onClose?.();
    } catch (e) { setError(e.message); }
    setImporting(false);
  };

  const runSql = async () => {
    if (!project || !sql.trim()) return;
    setRunning(true); setError(""); setQueryResult(null);
    try {
      const r = await call({ action: "runQuery", projectId: project.projectId, sql, maxRows });
      setQueryResult(r);
    } catch (e) { setError(e.message); }
    setRunning(false);
  };

  const filteredList = (arr, key) =>
    !filter.trim() ? arr : arr.filter(x => (x[key] || "").toLowerCase().includes(filter.toLowerCase()));

  // ── render helpers ──────────────────────────────────────────────────
  const Crumb = ({ label, onClick, active }) => (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="text-xs px-2 py-1 rounded transition-colors"
      style={{
        color: active ? "var(--text-primary)" : "var(--text-muted)",
        background: active ? "var(--bg-hover)" : "transparent",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(3px)" }}>
      <div
        className="w-full max-w-5xl rounded-2xl flex flex-col"
        style={{
          maxHeight: "85vh",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #4285F422 0%, #4285F40a 100%)", border: "1px solid #4285F455" }}>
              <Database size={16} style={{ color: "#4285F4" }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Google BigQuery</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Browse projects, datasets, and tables · read-only</div>
            </div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 30, height: 30 }}>
            <X size={14} />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-5 py-2 border-b flex-wrap" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <Crumb label="Projects" onClick={() => { setStep("projects"); setProject(null); setDataset(null); setTable(null); }} active={step === "projects"} />
          {project && <>
            <ChevronRight size={11} style={{ color: "var(--text-muted)" }} />
            <Crumb label={project.projectId} onClick={() => openProject(project)} active={step === "datasets"} />
          </>}
          {dataset && <>
            <ChevronRight size={11} style={{ color: "var(--text-muted)" }} />
            <Crumb label={dataset.datasetId} onClick={() => openDataset(dataset)} active={step === "tables"} />
          </>}
          {table && <>
            <ChevronRight size={11} style={{ color: "var(--text-muted)" }} />
            <Crumb label={table.tableId} active />
          </>}
          <div className="flex-1" />
          {project && (
            <button
              onClick={() => setStep("query")}
              className="text-xs px-2.5 py-1 rounded flex items-center gap-1.5"
              style={{
                background: step === "query" ? "rgba(64,196,255,0.15)" : "var(--bg-overlay)",
                border: `1px solid ${step === "query" ? "rgba(64,196,255,0.4)" : "var(--border-subtle)"}`,
                color: step === "query" ? "var(--color-info)" : "var(--text-secondary)",
              }}
            >
              <Play size={10} /> Run SQL
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-lg" style={{ background: "rgba(255,23,68,0.08)", border: "1px solid rgba(255,23,68,0.25)" }}>
              <AlertCircle size={14} style={{ color: "var(--color-error)", flexShrink: 0, marginTop: 1 }} />
              <div className="text-xs" style={{ color: "var(--color-error)" }}>{error}</div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={18} className="animate-spin" />
            </div>
          )}

          {/* PROJECTS */}
          {!loading && step === "projects" && (
            <div className="space-y-2">
              {projects.length === 0 ? (
                <div className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>
                  No projects found. Ensure the connected account has BigQuery access.
                </div>
              ) : projects.map(p => (
                <button key={p.id} onClick={() => openProject(p)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(66,133,244,0.5)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}>
                  <FolderTree size={14} style={{ color: "#4285F4" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.friendlyName || p.projectId}</div>
                    <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{p.projectId}</div>
                  </div>
                  <ChevronRight size={13} style={{ color: "var(--text-muted)" }} />
                </button>
              ))}
            </div>
          )}

          {/* DATASETS */}
          {!loading && step === "datasets" && (
            <>
              <ListFilter value={filter} onChange={setFilter} placeholder="Filter datasets..." />
              <div className="space-y-1.5">
                {filteredList(datasets, "datasetId").map(d => (
                  <button key={d.id} onClick={() => openDataset(d)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                    <FolderTree size={13} style={{ color: "var(--text-secondary)" }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{d.datasetId}</div>
                      {d.location && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{d.location}</div>}
                    </div>
                    <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />
                  </button>
                ))}
                {datasets.length === 0 && <EmptyState msg="No datasets in this project." />}
              </div>
            </>
          )}

          {/* TABLES */}
          {!loading && step === "tables" && !table && (
            <>
              <ListFilter value={filter} onChange={setFilter} placeholder="Filter tables..." />
              <div className="space-y-1.5">
                {filteredList(tables, "tableId").map(t => (
                  <button key={t.id} onClick={() => openTable(t)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                    <TableIcon size={13} style={{ color: "#00e676" }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.tableId}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{t.type}</div>
                    </div>
                    <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />
                  </button>
                ))}
                {tables.length === 0 && <EmptyState msg="No tables in this dataset." />}
              </div>
            </>
          )}

          {/* TABLE DETAIL */}
          {!loading && step === "tables" && table && tableDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Rows" value={Number(tableDetail.numRows || 0).toLocaleString()} />
                <Stat label="Size" value={formatBytes(tableDetail.numBytes)} />
                <Stat label="Columns" value={tableDetail.schema.length} />
              </div>

              {tableDetail.description && (
                <div className="text-xs p-3 rounded-lg" style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)" }}>
                  {tableDetail.description}
                </div>
              )}

              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Schema</div>
                <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                  <table className="w-full text-xs">
                    <thead style={{ background: "var(--bg-surface)" }}>
                      <tr>
                        <th className="text-left px-3 py-1.5 font-semibold" style={{ color: "var(--text-muted)" }}>Column</th>
                        <th className="text-left px-3 py-1.5 font-semibold" style={{ color: "var(--text-muted)" }}>Type</th>
                        <th className="text-left px-3 py-1.5 font-semibold" style={{ color: "var(--text-muted)" }}>Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableDetail.schema.map((f, i) => (
                        <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                          <td className="px-3 py-1.5 font-mono" style={{ color: "var(--text-primary)" }}>{f.name}</td>
                          <td className="px-3 py-1.5" style={{ color: "var(--color-info)" }}>{f.type}</td>
                          <td className="px-3 py-1.5" style={{ color: "var(--text-muted)" }}>{f.mode || "NULLABLE"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  Max rows
                  <input
                    type="number" min={1} max={10000} value={maxRows}
                    onChange={e => setMaxRows(Math.max(1, Math.min(10000, +e.target.value || 1000)))}
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", padding: "4px 8px", borderRadius: 6, fontSize: 11, width: 100 }}
                  />
                </label>
                <div className="flex-1" />
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a", opacity: importing ? 0.6 : 1 }}
                >
                  {importing ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  Import to Data Foundation
                </button>
              </div>
            </div>
          )}

          {/* CUSTOM SQL */}
          {!loading && step === "query" && project && (
            <div className="space-y-3">
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Running against project <span style={{ color: "var(--color-info)" }}>{project.projectId}</span>. Read-only — only SELECT statements are supported.
              </div>
              <textarea
                value={sql}
                onChange={e => setSql(e.target.value)}
                placeholder={`SELECT * FROM \`${project.projectId}.dataset.table\` LIMIT 100`}
                className="w-full font-mono"
                style={{
                  background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)", borderRadius: 8, padding: 12, fontSize: 12, minHeight: 140, outline: "none", resize: "vertical",
                }}
              />
              <div className="flex items-center gap-3">
                <label className="text-xs flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  Max rows
                  <input
                    type="number" min={1} max={10000} value={maxRows}
                    onChange={e => setMaxRows(Math.max(1, Math.min(10000, +e.target.value || 1000)))}
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", padding: "4px 8px", borderRadius: 6, fontSize: 11, width: 100 }}
                  />
                </label>
                <div className="flex-1" />
                <button
                  onClick={runSql} disabled={running || !sql.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "var(--color-info)", color: "#04245a", opacity: running || !sql.trim() ? 0.6 : 1 }}
                >
                  {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Run query
                </button>
              </div>

              {queryResult && (
                <div className="rounded-lg overflow-auto" style={{ border: "1px solid var(--border-subtle)", maxHeight: 360 }}>
                  <table className="w-full text-xs">
                    <thead style={{ background: "var(--bg-surface)", position: "sticky", top: 0 }}>
                      <tr>
                        {queryResult.fields.map((f, i) => (
                          <th key={i} className="text-left px-3 py-1.5 font-semibold whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                            {f.name} <span style={{ color: "var(--color-info)", fontWeight: 400 }}>· {f.type}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, ri) => (
                        <tr key={ri} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                          {queryResult.fields.map((f, ci) => (
                            <td key={ci} className="px-3 py-1.5 font-mono whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                              {String(row[f.name] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-3 py-1.5 text-xs" style={{ color: "var(--text-muted)", background: "var(--bg-surface)", borderTop: "1px solid var(--border-subtle)" }}>
                    {queryResult.rows.length} rows · {formatBytes(queryResult.bytesProcessed)} processed
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListFilter({ value, onChange, placeholder }) {
  return (
    <div className="relative mb-3">
      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full"
        style={{
          background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)", borderRadius: 6, padding: "6px 10px 6px 30px", fontSize: 12, outline: "none",
        }}
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

function EmptyState({ msg }) {
  return <div className="text-center py-8 text-xs" style={{ color: "var(--text-muted)" }}>{msg}</div>;
}

function formatBytes(b) {
  const n = Number(b || 0);
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}