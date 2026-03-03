import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Search, ChevronDown, ChevronRight, ExternalLink, Plus, RefreshCw, Table, Database, Play } from "lucide-react";

const DATABASES = [
  { id: "opioids", label: "Opioids", desc: "Opioid toxicity deaths & hospitalizations by province, substance, and time period" },
  { id: "cnisp-vri", label: "CNISP VRI", desc: "Canadian Nosocomial Infection Surveillance Program - Ventilator-related infections" },
  { id: "wastewater", label: "Wastewater", desc: "Wastewater surveillance data for disease tracking across Canada" },
  { id: "CYPC", label: "CYPC", desc: "Children and Youth in Psychiatric Care data" },
];

export default function HealthInfobaseBrowser({ onClose, onImport }) {
  const [selectedDb, setSelectedDb] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [preview, setPreview] = useState(null);
  const [customQuery, setCustomQuery] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imported, setImported] = useState(new Set());
  const [tab, setTab] = useState("browse"); // browse | query

  const selectDb = async (db) => {
    setSelectedDb(db);
    setSelectedTable(null);
    setPreview(null);
    setTables([]);
    setError(null);
    setLoading(true);
    try {
      const res = await base44.functions.invoke("healthInfobase", { action: "tables", database: db.id });
      setTables(res.data.tables || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const loadPreview = async (tableName) => {
    setSelectedTable(tableName);
    setPreview(null);
    setError(null);
    setLoading(true);
    try {
      const res = await base44.functions.invoke("healthInfobase", {
        action: "table",
        database: selectedDb.id,
        table: tableName,
        limit: 10,
      });
      setPreview(res.data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const runQuery = async () => {
    if (!selectedDb || !customQuery.trim()) return;
    setQueryLoading(true);
    setQueryResult(null);
    setError(null);
    try {
      const res = await base44.functions.invoke("healthInfobase", {
        action: "query",
        database: selectedDb.id,
        query: customQuery.trim(),
      });
      setQueryResult(res.data);
    } catch (e) {
      setError(e.message);
    }
    setQueryLoading(false);
  };

  const handleImport = async (tableName) => {
    const key = `${selectedDb.id}/${tableName}`;
    const sourceData = {
      name: `Health Infobase — ${selectedDb.label}: ${tableName}`,
      type: "api",
      url: `https://health-infobase.canada.ca/api/${selectedDb.id}/table/${tableName}`,
      description: `${selectedDb.desc} — Table: ${tableName}`,
      category: "other",
      sync_frequency: "manual",
      status: "active",
      metadata: { database: selectedDb.id, table: tableName, source: "health_infobase" },
    };
    await onImport(sourceData);
    setImported(prev => new Set([...prev, key]));
  };

  const isImported = (tableName) => imported.has(`${selectedDb?.id}/${tableName}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ width: 860, maxHeight: "88vh", background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <div>
            <div className="flex items-center gap-2">
              <Database size={15} style={{ color: "var(--accent-primary)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Health Infobase API <span className="text-xs px-1.5 py-0.5 rounded ml-1" style={{ background: "var(--bg-overlay)", color: "var(--mnbc-yellow)", border: "1px solid var(--border-subtle)" }}>BETA</span>
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Public Health Agency of Canada — health-infobase.canada.ca/api
            </p>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {["browse", "query"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2 text-xs font-medium capitalize transition-colors"
              style={{
                color: tab === t ? "var(--accent-primary)" : "var(--text-muted)",
                borderBottom: tab === t ? "2px solid var(--accent-primary)" : "2px solid transparent",
              }}>
              {t === "browse" ? "Browse Tables" : "Custom Query"}
            </button>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: DB list */}
          <div className="flex flex-col shrink-0 border-r overflow-y-auto"
            style={{ width: 200, borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Databases
            </div>
            {DATABASES.map(db => (
              <button key={db.id} onClick={() => selectDb(db)}
                className="w-full text-left px-3 py-2.5 text-xs transition-colors border-b"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: selectedDb?.id === db.id ? "var(--bg-hover)" : "transparent",
                  color: selectedDb?.id === db.id ? "var(--accent-primary)" : "var(--text-secondary)",
                }}>
                <div className="font-medium">{db.label}</div>
                <div className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)", fontSize: 10 }}>{db.desc}</div>
              </button>
            ))}
          </div>

          {/* Right: Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedDb ? (
              <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: "var(--text-muted)" }}>
                <Database size={32} className="opacity-30" />
                <p className="text-xs">Select a database to browse its tables</p>
              </div>
            ) : tab === "browse" ? (
              <div className="flex flex-1 overflow-hidden">
                {/* Tables list */}
                <div className="flex flex-col shrink-0 border-r overflow-y-auto"
                  style={{ width: 200, borderColor: "var(--border-subtle)" }}>
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-widest border-b" style={{ color: "var(--text-muted)", borderColor: "var(--border-subtle)" }}>
                    Tables
                  </div>
                  {loading && !selectedTable ? (
                    <div className="flex items-center justify-center p-6">
                      <RefreshCw size={14} className="animate-spin" style={{ color: "var(--text-muted)" }} />
                    </div>
                  ) : tables.map(tbl => (
                    <button key={tbl} onClick={() => loadPreview(tbl)}
                      className="w-full text-left px-3 py-2 text-xs transition-colors border-b flex items-center gap-2"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: selectedTable === tbl ? "var(--bg-hover)" : "transparent",
                        color: selectedTable === tbl ? "var(--text-primary)" : "var(--text-secondary)",
                      }}>
                      <Table size={11} style={{ color: selectedTable === tbl ? "var(--accent-primary)" : "var(--text-muted)", flexShrink: 0 }} />
                      <span className="truncate">{tbl}</span>
                    </button>
                  ))}
                </div>

                {/* Preview */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {!selectedTable ? (
                    <div className="flex items-center justify-center h-full text-xs" style={{ color: "var(--text-muted)" }}>
                      Select a table to preview
                    </div>
                  ) : loading ? (
                    <div className="flex items-center justify-center h-full gap-2" style={{ color: "var(--text-muted)" }}>
                      <RefreshCw size={14} className="animate-spin" /> Loading...
                    </div>
                  ) : error ? (
                    <div className="p-4 text-xs" style={{ color: "var(--color-error)" }}>{error}</div>
                  ) : preview ? (
                    <>
                      {/* Preview header */}
                      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0"
                        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
                        <div>
                          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{selectedTable}</span>
                          <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                            {preview.count?.toLocaleString()} rows · {preview.columns?.length} columns · showing first 10
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={`https://health-infobase.canada.ca/api/${selectedDb.id}/table/${selectedTable}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs" style={{ color: "var(--color-info)" }}>
                            <ExternalLink size={10} /> View full
                          </a>
                          <button
                            onClick={() => handleImport(selectedTable)}
                            disabled={isImported(selectedTable)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium"
                            style={{
                              background: isImported(selectedTable) ? "var(--bg-overlay)" : "var(--accent-primary)",
                              color: isImported(selectedTable) ? "var(--text-muted)" : "#000",
                            }}>
                            <Plus size={11} />
                            {isImported(selectedTable) ? "Imported" : "Import Source"}
                          </button>
                        </div>
                      </div>

                      {/* Table preview */}
                      <div className="flex-1 overflow-auto">
                        {preview.rows?.length > 0 ? (
                          <table className="data-table w-full text-xs" style={{ minWidth: 600 }}>
                            <thead>
                              <tr>
                                {preview.columns?.filter(c => !c.endsWith("_FR")).map(col => (
                                  <th key={col} className="text-left px-3 py-2 whitespace-nowrap" style={{ position: "sticky", top: 0, background: "var(--bg-elevated)", zIndex: 1 }}>
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {preview.rows.map((row, i) => (
                                <tr key={i}>
                                  {preview.columns?.filter(c => !c.endsWith("_FR")).map(col => (
                                    <td key={col} className="px-3 py-1.5 whitespace-nowrap max-w-xs truncate" title={String(row[col] ?? "")}>
                                      {String(row[col] ?? "")}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="p-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>No data returned</div>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              /* Custom query tab */
              <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Run a custom SELECT query against <span style={{ color: "var(--accent-primary)" }}>{selectedDb.label}</span>. Example: <code style={{ color: "var(--text-secondary)", background: "var(--bg-overlay)", padding: "1px 5px", borderRadius: 3 }}>SELECT * FROM opioids WHERE PRUID = '59' LIMIT 20</code>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={customQuery}
                    onChange={e => setCustomQuery(e.target.value)}
                    placeholder={`SELECT * FROM ${tables[0] || "table_name"} LIMIT 20`}
                    rows={3}
                    className="flex-1 rounded-md text-xs font-mono"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)", padding: "8px 10px", outline: "none", resize: "vertical" }}
                  />
                  <button onClick={runQuery} disabled={queryLoading || !customQuery.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium self-start"
                    style={{ background: "var(--accent-primary)", color: "#000", opacity: queryLoading || !customQuery.trim() ? 0.6 : 1 }}>
                    {queryLoading ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                    Run
                  </button>
                </div>

                {error && <div className="text-xs px-3 py-2 rounded" style={{ background: "rgba(185,38,45,0.15)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>{error}</div>}

                {queryResult && (
                  <div className="flex-1 overflow-auto rounded-md border" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="px-3 py-1.5 text-xs border-b" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)", background: "var(--bg-surface)" }}>
                      {queryResult.count} rows returned
                    </div>
                    {queryResult.rows?.length > 0 && (() => {
                      const cols = Object.keys(queryResult.rows[0]).filter(c => !c.endsWith("_FR"));
                      return (
                        <table className="data-table w-full text-xs">
                          <thead>
                            <tr>{cols.map(c => <th key={c} className="text-left px-3 py-2 whitespace-nowrap" style={{ position: "sticky", top: 0, background: "var(--bg-elevated)", zIndex: 1 }}>{c}</th>)}</tr>
                          </thead>
                          <tbody>
                            {queryResult.rows.map((row, i) => (
                              <tr key={i}>{cols.map(c => <td key={c} className="px-3 py-1.5 whitespace-nowrap">{String(row[c] ?? "")}</td>)}</tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}