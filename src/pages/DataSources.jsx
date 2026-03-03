import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Plus, RefreshCw, Trash2, Edit2, Database, Globe, CheckCircle, AlertCircle, Clock, CalendarClock, ScrollText, BookOpen } from "lucide-react";
import SyncScheduleModal from "@/components/datasources/SyncScheduleModal";
import SyncLogsPanel from "@/components/datasources/SyncLogsPanel";
import BCDataCatalogueBrowser from "@/components/datasources/BCDataCatalogueBrowser";

const SOURCE_TYPES = ["statcan","bc_health","fnha","manual_upload","api","other"];
const SYNC_FREQS = ["manual","daily","weekly","monthly"];

export default function DataSources() {
  const { addLog } = useApp();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", type: "statcan", url: "", description: "", category: "demographics", sync_frequency: "manual", status: "pending" });
  const [syncing, setSyncing] = useState(null);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [failedCount, setFailedCount] = useState(0);

  const load = () => {
    base44.entities.DataSource.list("-updated_date", 100)
      .then(data => { setSources(data); addLog("success", `${data.length} data sources loaded`); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    base44.entities.SyncJob.filter({ status: "failed" }, "-created_date", 1).then(jobs => setFailedCount(jobs.length)).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (editing) {
      await base44.entities.DataSource.update(editing.id, form);
      addLog("success", `Updated source: ${form.name}`);
    } else {
      await base44.entities.DataSource.create(form);
      addLog("success", `Added source: ${form.name}`);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", type: "statcan", url: "", description: "", category: "demographics", sync_frequency: "manual", status: "pending" });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.DataSource.delete(id);
    addLog("success", "Source removed");
    load();
  };

  const handleSync = async (src) => {
    setSyncing(src.id);
    addLog("info", `Syncing ${src.name}...`);
    try {
      const res = await base44.functions.invoke("scheduledDataSync", { source_id: src.id });
      const result = res.data?.results?.[0];
      if (result?.status === "failed") {
        addLog("error", `Sync failed: ${src.name} — ${result.error}`);
      } else {
        addLog("success", `Sync complete: ${src.name}`);
      }
    } catch (e) {
      addLog("error", `Sync error: ${e.message}`);
    }
    setSyncing(null);
    load();
    base44.entities.SyncJob.filter({ status: "failed" }, "-created_date", 1).then(jobs => setFailedCount(jobs.length)).catch(() => {});
  };

  const handleSaveSchedule = async (freq) => {
    await base44.entities.DataSource.update(scheduleFor.id, { sync_frequency: freq });
    addLog("success", `Schedule updated: ${scheduleFor.name} → ${freq}`);
    setScheduleFor(null);
    load();
  };

  const startEdit = (src) => {
    setEditing(src);
    setForm({ name: src.name, type: src.type, url: src.url || "", description: src.description || "", category: src.category || "demographics", sync_frequency: src.sync_frequency || "manual", status: src.status });
    setShowForm(true);
  };

  const statusIcon = (status) => {
    if (status === "active") return <CheckCircle size={13} style={{ color: "var(--color-success)" }} />;
    if (status === "error") return <AlertCircle size={13} style={{ color: "var(--color-error)" }} />;
    return <Clock size={13} style={{ color: "var(--text-muted)" }} />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Data Sources</h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Manage connections to Stats Canada, FNHA, BC Health, and other repositories</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLogs(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: failedCount > 0 ? "var(--color-error)" : "var(--text-secondary)" }}>
            <ScrollText size={12} />
            Sync Logs
            {failedCount > 0 && (
              <span className="px-1.5 rounded-full text-xs font-bold" style={{ background: "var(--color-error)", color: "#fff" }}>
                {failedCount}
              </span>
            )}
          </button>
          <button onClick={() => setShowCatalogue(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
            <BookOpen size={12} style={{ color: "var(--accent-primary)" }} /> BC Data Catalogue
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            <Plus size={12} /> Add Source
          </button>
        </div>
      </div>

      {/* Source cards */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={16} className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sources.map(src => (
              <div key={src.id} className="metric-card flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded flex items-center justify-center"
                      style={{ background: "var(--bg-overlay)" }}>
                      <Database size={14} style={{ color: "var(--accent-primary)" }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{src.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{src.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {statusIcon(src.status)}
                  </div>
                </div>
                {src.description && (
                  <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>{src.description}</p>
                )}
                {src.url && (
                  <a href={src.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs truncate"
                    style={{ color: "var(--color-info)" }}>
                    <Globe size={11} /> {src.url}
                  </a>
                )}
                <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="space-y-0.5">
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {src.last_synced ? `Synced ${new Date(src.last_synced).toLocaleDateString("en-CA")}` : "Never synced"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={9} style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs" style={{ color: src.sync_frequency && src.sync_frequency !== "manual" ? "var(--accent-primary)" : "var(--text-muted)" }}>
                        {src.sync_frequency || "manual"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSync(src)} disabled={syncing === src.id}
                      className="activity-icon" style={{ width: 26, height: 26 }}
                      title="Sync now">
                      <RefreshCw size={12} className={syncing === src.id ? "animate-spin" : ""} style={{ color: "var(--color-info)" }} />
                    </button>
                    <button onClick={() => setScheduleFor(src)} className="activity-icon" style={{ width: 26, height: 26 }} title="Set sync schedule">
                      <CalendarClock size={12} style={{ color: "var(--accent-primary)" }} />
                    </button>
                    <button onClick={() => startEdit(src)} className="activity-icon" style={{ width: 26, height: 26 }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(src.id)} className="activity-icon" style={{ width: 26, height: 26, color: "var(--color-error)" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {sources.length === 0 && (
              <div className="col-span-3 text-center py-16" style={{ color: "var(--text-muted)" }}>
                <Database size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No data sources configured yet.</p>
                <p className="text-xs mt-1">Add Stats Canada, FNHA, or other BC health data repositories.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sync schedule modal */}
      {scheduleFor && (
        <SyncScheduleModal source={scheduleFor} onSave={handleSaveSchedule} onClose={() => setScheduleFor(null)} />
      )}

      {/* Sync logs panel */}
      {showLogs && <SyncLogsPanel onClose={() => setShowLogs(false)} />}

      {/* BC Data Catalogue browser */}
      {showCatalogue && (
        <BCDataCatalogueBrowser
          onClose={() => setShowCatalogue(false)}
          onImport={async (sourceData) => {
            await base44.entities.DataSource.create(sourceData);
            addLog("success", `Imported from BC Data Catalogue: ${sourceData.name}`);
            load();
          }}
        />
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-xl p-6 space-y-4 shadow-2xl"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {editing ? "Edit Data Source" : "Add Data Source"}
            </h3>
            <FormField label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <FormSelect label="Type" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={SOURCE_TYPES} />
              <FormSelect label="Sync" value={form.sync_frequency} onChange={v => setForm(f => ({ ...f, sync_frequency: v }))} options={SYNC_FREQS} />
            </div>
            <FormField label="URL / Endpoint" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} />
            <FormField label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} multiline />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-3 py-1.5 rounded-md text-xs"
                style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                Cancel
              </button>
              <button onClick={handleSave}
                className="px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ background: "var(--accent-primary)", color: "#000" }}>
                {editing ? "Update" : "Add Source"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, multiline }) {
  const style = { background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", width: "100%", padding: "6px 10px", borderRadius: 6, fontSize: 12, outline: "none" };
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} style={style} />
        : <input value={value} onChange={e => onChange(e.target.value)} style={style} />
      }
    </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", width: "100%", padding: "6px 10px", borderRadius: 6, fontSize: 12, outline: "none" }}>
        {options.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
      </select>
    </div>
  );
}