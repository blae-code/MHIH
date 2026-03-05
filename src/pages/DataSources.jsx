import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  Plus, RefreshCw, Trash2, Database, Globe, CheckCircle, AlertCircle,
  Clock, ScrollText, BookOpen, Search, SlidersHorizontal, Grid3x3,
  List, ToggleLeft, ToggleRight, ChevronDown, StickyNote, Tag,
  CalendarClock, ArrowUpDown
} from "lucide-react";
import SyncScheduleModal from "@/components/datasources/SyncScheduleModal";
import SyncLogsPanel from "@/components/datasources/SyncLogsPanel";
import SourceEditModal from "@/components/datasources/SourceEditModal";
import BCDataCatalogueBrowser from "@/components/datasources/BCDataCatalogueBrowser";
import OpenGovCanadaBrowser from "@/components/datasources/OpenGovCanadaBrowser";
import StatsCanWDSBrowser from "@/components/datasources/StatsCanWDSBrowser";
import HealthInfobaseBrowser from "@/components/datasources/HealthInfobaseBrowser";
import HealthCanadaDPDBrowser from "@/components/datasources/HealthCanadaDPDBrowser";
import HealthCanadaCNFBrowser from "@/components/datasources/HealthCanadaCNFBrowser";
import BCWMSWFSBrowser from "@/components/datasources/BCWMSWFSBrowser";
import ArcGISHubBCBrowser from "@/components/datasources/ArcGISHubBCBrowser";
import DataBCToolsBrowser from "@/components/datasources/DataBCToolsBrowser";

const CATEGORIES = ["all","chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];
const STATUSES = ["all","active","inactive","pending","error"];
const SORT_OPTIONS = [
  { value: "updated_desc", label: "Recently Updated" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "created_desc", label: "Newest First" },
  { value: "status", label: "By Status" },
  { value: "category", label: "By Category" },
];

const STATUS_COLORS = {
  active: "var(--color-success)",
  error: "var(--color-error)",
  inactive: "var(--text-muted)",
  pending: "var(--color-warning)",
};

export default function DataSources() {
  const { addLog } = useApp();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSource, setEditingSource] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [failedCount, setFailedCount] = useState(0);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Browsers
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [showOpenGov, setShowOpenGov] = useState(false);
  const [showStatsCanWDS, setShowStatsCanWDS] = useState(false);
  const [showHealthInfobase, setShowHealthInfobase] = useState(false);
  const [showDPD, setShowDPD] = useState(false);
  const [showCNF, setShowCNF] = useState(false);
  const [showWMSWFS, setShowWMSWFS] = useState(false);
  const [showArcGISHub, setShowArcGISHub] = useState(false);
  const [showDataBCTools, setShowDataBCTools] = useState(false);

  // Filters / sorting
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("updated_desc");

  const load = () => {
    base44.entities.DataSource.list("-updated_date", 200)
      .then(data => { setSources(data); addLog("success", `${data.length} data sources loaded`); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    base44.entities.SyncJob.filter({ status: "failed" }, "-created_date", 50)
      .then(jobs => setFailedCount(jobs.length)).catch(() => {});
  }, []);

  const handleSave = async (form) => {
    if (editingSource) {
      await base44.entities.DataSource.update(editingSource.id, form);
      addLog("success", `Updated: ${form.name}`);
    } else {
      await base44.entities.DataSource.create(form);
      addLog("success", `Added: ${form.name}`);
    }
    setShowEditModal(false);
    setEditingSource(null);
    load();
  };

  const handleDelete = async (src) => {
    await base44.entities.DataSource.delete(src.id);
    addLog("success", `Deleted: ${src.name}`);
    setDeleteConfirm(null);
    load();
  };

  const handleToggleStatus = async (src) => {
    const newStatus = src.status === "active" ? "inactive" : "active";
    await base44.entities.DataSource.update(src.id, { status: newStatus });
    addLog("info", `${src.name} → ${newStatus}`);
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
  };

  const handleSaveSchedule = async (freq) => {
    await base44.entities.DataSource.update(scheduleFor.id, { sync_frequency: freq });
    addLog("success", `Schedule: ${scheduleFor.name} → ${freq}`);
    setScheduleFor(null);
    load();
  };

  // Computed + filtered list
  const filtered = useMemo(() => {
    let list = [...sources];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.type?.toLowerCase().includes(q) ||
        s.notes?.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "all") list = list.filter(s => s.category === filterCategory);
    if (filterStatus !== "all") list = list.filter(s => s.status === filterStatus);
    list.sort((a, b) => {
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name_desc") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "created_desc") return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      if (sortBy === "category") return (a.category || "").localeCompare(b.category || "");
      return new Date(b.updated_date) - new Date(a.updated_date); // updated_desc
    });
    return list;
  }, [sources, search, filterCategory, filterStatus, sortBy]);

  const importSource = async (sourceData, logMsg) => {
    await base44.entities.DataSource.create(sourceData);
    addLog("success", logMsg);
    load();
  };

  const selectStyle = { background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", padding: "5px 8px", borderRadius: 6, fontSize: 11, outline: "none" };

  return (
    <div className="flex flex-col h-full">
      {/* ── HEADER ── */}
      <div className="shrink-0 border-b relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--bg-surface) 0%, #0d1f2a 50%, var(--bg-elevated) 100%)", borderColor: "var(--border-default)", boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(64,196,255,0.08)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #40c4ff 0%, #00e676 50%, transparent 100%)" }} />
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="dashboard-section-label" style={{ marginBottom: 2 }}>Data Sources</div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {sources.length} sources · {sources.filter(s => s.status === "active").length} active
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button onClick={() => setShowLogs(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: failedCount > 0 ? "var(--color-error)" : "var(--text-secondary)" }}>
              <ScrollText size={12} />
              Sync Logs
              {failedCount > 0 && (
                <span className="px-1.5 rounded-full text-xs font-bold" style={{ background: "var(--color-error)", color: "#fff" }}>{failedCount}</span>
              )}
            </button>
            {/* Browser buttons */}
            {[
              ["DataBC Tools", () => setShowDataBCTools(true)],
              ["ArcGIS Hub BC", () => setShowArcGISHub(true)],
              ["BC WMS/WFS", () => setShowWMSWFS(true)],
              ["CNF", () => setShowCNF(true)],
              ["DPD", () => setShowDPD(true)],
              ["Health Infobase", () => setShowHealthInfobase(true)],
              ["StatsCan WDS", () => setShowStatsCanWDS(true)],
              ["Open Gov", () => setShowOpenGov(true)],
              ["BC Catalogue", () => setShowCatalogue(true)],
            ].map(([label, fn]) => (
              <button key={label} onClick={fn}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                <BookOpen size={11} style={{ color: "var(--accent-primary)" }} /> {label}
              </button>
            ))}
            <button onClick={() => { setEditingSource(null); setShowEditModal(true); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold"
              style={{ background: "var(--accent-primary)", color: "#000" }}>
              <Plus size={12} /> Add Source
            </button>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="flex items-center gap-2 px-4 py-2 border-t flex-wrap" style={{ borderColor: "var(--border-subtle)" }}>
          {/* Search */}
          <div className="flex items-center gap-1.5 rounded-md px-2 py-1 flex-1 min-w-[180px]"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <Search size={11} style={{ color: "var(--text-muted)" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search sources, notes, categories..."
              className="bg-transparent outline-none text-xs flex-1"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          {/* Category */}
          <div className="flex items-center gap-1">
            <Tag size={11} style={{ color: "var(--text-muted)" }} />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={selectStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          {/* Status */}
          <div className="flex items-center gap-1">
            <SlidersHorizontal size={11} style={{ color: "var(--text-muted)" }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
              {STATUSES.map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>)}
            </select>
          </div>
          {/* Sort */}
          <div className="flex items-center gap-1">
            <ArrowUpDown size={11} style={{ color: "var(--text-muted)" }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {/* View toggle */}
          <div className="flex items-center rounded-md overflow-hidden ml-auto" style={{ border: "1px solid var(--border-subtle)" }}>
            {[["grid", Grid3x3], ["list", List]].map(([mode, Icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className="flex items-center justify-center"
                style={{
                  width: 28, height: 28,
                  background: viewMode === mode ? "var(--bg-hover)" : "var(--bg-overlay)",
                  color: viewMode === mode ? "var(--text-primary)" : "var(--text-muted)",
                }}>
                <Icon size={13} />
              </button>
            ))}
          </div>
          {/* Results count */}
          <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
            {filtered.length} of {sources.length}
          </span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={16} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40" style={{ color: "var(--text-muted)" }}>
            <Database size={28} className="mb-3 opacity-30" />
            <p className="text-sm">{sources.length === 0 ? "No data sources yet." : "No sources match your filters."}</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(src => (
              <SourceCard key={src.id} src={src} syncing={syncing}
                onEdit={() => { setEditingSource(src); setShowEditModal(true); }}
                onSync={() => handleSync(src)}
                onToggle={() => handleToggleStatus(src)}
                onSchedule={() => setScheduleFor(src)}
                onDelete={() => setDeleteConfirm(src)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(src => (
              <SourceRow key={src.id} src={src} syncing={syncing}
                onEdit={() => { setEditingSource(src); setShowEditModal(true); }}
                onSync={() => handleSync(src)}
                onToggle={() => handleToggleStatus(src)}
                onSchedule={() => setScheduleFor(src)}
                onDelete={() => setDeleteConfirm(src)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {showEditModal && (
        <SourceEditModal
          source={editingSource}
          onSave={handleSave}
          onClose={() => { setShowEditModal(false); setEditingSource(null); }}
        />
      )}

      {scheduleFor && (
        <SyncScheduleModal source={scheduleFor} onSave={handleSaveSchedule} onClose={() => setScheduleFor(null)} />
      )}

      {showLogs && <SyncLogsPanel onClose={() => setShowLogs(false)} />}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
          <div className="w-80 rounded-xl p-5 shadow-2xl"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Delete Source?</div>
            <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
              "{deleteConfirm.name}" will be permanently removed. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 rounded-md text-xs"
                style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold"
                style={{ background: "var(--color-error)", color: "#fff" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Browsers */}
      {showStatsCanWDS && <StatsCanWDSBrowser onClose={() => setShowStatsCanWDS(false)} onImport={d => importSource(d, `Imported from StatsCan WDS: ${d.name}`)} />}
      {showDataBCTools && <DataBCToolsBrowser onClose={() => setShowDataBCTools(false)} onImport={d => importSource(d, `Imported: ${d.name}`)} />}
      {showArcGISHub && <ArcGISHubBCBrowser onClose={() => setShowArcGISHub(false)} onImport={d => importSource(d, `Imported from ArcGIS Hub BC: ${d.name}`)} />}
      {showWMSWFS && <BCWMSWFSBrowser onClose={() => setShowWMSWFS(false)} onImport={d => importSource(d, `Imported BC WMS/WFS layer: ${d.name}`)} />}
      {showCNF && <HealthCanadaCNFBrowser onClose={() => setShowCNF(false)} onImport={d => importSource(d, `Imported from Health Canada CNF: ${d.name}`)} />}
      {showDPD && <HealthCanadaDPDBrowser onClose={() => setShowDPD(false)} onImport={d => importSource(d, `Imported from Health Canada DPD: ${d.name}`)} />}
      {showHealthInfobase && <HealthInfobaseBrowser onClose={() => setShowHealthInfobase(false)} onImport={d => importSource(d, `Imported from Health Infobase: ${d.name}`)} />}
      {showOpenGov && <OpenGovCanadaBrowser onClose={() => setShowOpenGov(false)} onImport={d => importSource(d, `Imported from Open Gov Canada: ${d.name}`)} />}
      {showCatalogue && <BCDataCatalogueBrowser onClose={() => setShowCatalogue(false)} onImport={d => importSource(d, `Imported from BC Data Catalogue: ${d.name}`)} />}
    </div>
  );
}

function SourceCard({ src, syncing, onEdit, onSync, onToggle, onSchedule, onDelete }) {
  const isActive = src.status === "active";
  const isDisabled = src.status === "inactive";

  return (
    <div className="metric-card flex flex-col gap-2.5" style={{ opacity: isDisabled ? 0.65 : 1 }}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
            style={{ background: "var(--bg-overlay)" }}>
            <Database size={14} style={{ color: STATUS_COLORS[src.status] || "var(--text-muted)" }} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{src.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="tag" style={{ fontSize: 10 }}>{src.type?.replace(/_/g, " ")}</span>
              {src.category && src.category !== "other" && (
                <span className="tag" style={{ fontSize: 10, background: "var(--accent-muted)", color: "var(--accent-primary)", borderColor: "var(--border-default)" }}>
                  {src.category.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[src.status] || "var(--text-muted)" }} />
          <span className="text-xs capitalize" style={{ color: STATUS_COLORS[src.status] || "var(--text-muted)" }}>{src.status}</span>
        </div>
      </div>

      {/* Description */}
      {src.description && (
        <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>{src.description}</p>
      )}

      {/* Notes */}
      {src.notes && (
        <div className="flex items-start gap-1.5 rounded px-2 py-1.5"
          style={{ background: "var(--accent-muted)", border: "1px solid var(--border-default)" }}>
          <StickyNote size={10} style={{ color: "var(--accent-primary)", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs line-clamp-2" style={{ color: "var(--accent-text)" }}>{src.notes}</p>
        </div>
      )}

      {/* URL */}
      {src.url && (
        <a href={src.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs truncate"
          style={{ color: "var(--color-info)" }}>
          <Globe size={10} /> {src.url}
        </a>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1.5 border-t mt-auto" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="text-xs space-y-0.5">
          <div style={{ color: "var(--text-muted)" }}>
            {src.last_synced ? `Synced ${new Date(src.last_synced).toLocaleDateString("en-CA")}` : "Never synced"}
          </div>
          <div className="flex items-center gap-1">
            <Clock size={9} style={{ color: "var(--text-muted)" }} />
            <span style={{ color: src.sync_frequency && src.sync_frequency !== "manual" ? "var(--accent-primary)" : "var(--text-muted)" }}>
              {src.sync_frequency || "manual"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onSync} disabled={!!syncing} title="Sync now" className="activity-icon" style={{ width: 26, height: 26 }}>
            <RefreshCw size={12} className={syncing === src.id ? "animate-spin" : ""} style={{ color: "var(--color-info)" }} />
          </button>
          <button onClick={onSchedule} title="Set schedule" className="activity-icon" style={{ width: 26, height: 26 }}>
            <CalendarClock size={12} style={{ color: "var(--accent-primary)" }} />
          </button>
          <button onClick={onToggle} title={isActive ? "Disable" : "Enable"} className="activity-icon" style={{ width: 26, height: 26 }}>
            {isActive
              ? <ToggleRight size={14} style={{ color: "var(--color-success)" }} />
              : <ToggleLeft size={14} style={{ color: "var(--text-muted)" }} />}
          </button>
          <button onClick={onEdit} title="Edit" className="activity-icon" style={{ width: 26, height: 26 }}>
            <SlidersHorizontal size={12} />
          </button>
          <button onClick={onDelete} title="Delete" className="activity-icon" style={{ width: 26, height: 26, color: "var(--color-error)" }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SourceRow({ src, syncing, onEdit, onSync, onToggle, onSchedule, onDelete }) {
  const isActive = src.status === "active";
  const isDisabled = src.status === "inactive";

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg group"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        opacity: isDisabled ? 0.65 : 1,
      }}>
      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
        style={{ background: "var(--bg-overlay)" }}>
        <Database size={12} style={{ color: STATUS_COLORS[src.status] || "var(--text-muted)" }} />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-4 gap-3 items-center">
        <div className="col-span-2 min-w-0">
          <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{src.name}</div>
          {src.notes && (
            <div className="flex items-center gap-1 mt-0.5">
              <StickyNote size={9} style={{ color: "var(--accent-primary)" }} />
              <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{src.notes}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="tag" style={{ fontSize: 10 }}>{src.category?.replace(/_/g, " ") || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[src.status] || "var(--text-muted)" }} />
          <span className="text-xs capitalize" style={{ color: STATUS_COLORS[src.status] || "var(--text-muted)" }}>{src.status}</span>
          <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>{src.sync_frequency || "manual"}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onSync} disabled={!!syncing} className="activity-icon" style={{ width: 24, height: 24 }}>
          <RefreshCw size={11} className={syncing === src.id ? "animate-spin" : ""} style={{ color: "var(--color-info)" }} />
        </button>
        <button onClick={onSchedule} className="activity-icon" style={{ width: 24, height: 24 }}>
          <CalendarClock size={11} style={{ color: "var(--accent-primary)" }} />
        </button>
        <button onClick={onToggle} className="activity-icon" style={{ width: 24, height: 24 }}>
          {isActive
            ? <ToggleRight size={13} style={{ color: "var(--color-success)" }} />
            : <ToggleLeft size={13} style={{ color: "var(--text-muted)" }} />}
        </button>
        <button onClick={onEdit} className="activity-icon" style={{ width: 24, height: 24 }}>
          <SlidersHorizontal size={11} />
        </button>
        <button onClick={onDelete} className="activity-icon" style={{ width: 24, height: 24, color: "var(--color-error)" }}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}