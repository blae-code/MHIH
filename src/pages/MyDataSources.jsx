import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  Database, Search, RefreshCw, Trash2, Edit2, CheckCircle, AlertCircle,
  Clock, Globe, Filter, ArrowUpDown, LayoutGrid, List, Plus, StickyNote,
  CalendarClock, Power, PowerOff, Tag, ChevronDown, ScrollText
} from "lucide-react";
import SourceDetailModal from "@/components/datasources/SourceDetailModal";
import SyncScheduleModal from "@/components/datasources/SyncScheduleModal";
import SyncLogsPanel from "@/components/datasources/SyncLogsPanel";

const CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];
const STATUSES = ["active","inactive","error","pending"];
const SYNC_FREQS = ["manual","daily","weekly","monthly"];
const SORT_OPTIONS = [
  { value: "updated_desc", label: "Recently Updated" },
  { value: "name_asc", label: "Name A→Z" },
  { value: "name_desc", label: "Name Z→A" },
  { value: "status", label: "Status" },
  { value: "category", label: "Category" },
  { value: "sync_frequency", label: "Sync Frequency" },
];

export default function MyDataSources() {
  const { addLog } = useApp();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(null);

  // Filters & sort
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSync, setFilterSync] = useState("all");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [viewMode, setViewMode] = useState("grid"); // grid | list

  // Modals
  const [detailSource, setDetailSource] = useState(null);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.DataSource.list("-updated_date", 200);
    setSources(data);
    addLog("success", `${data.length} data sources loaded`);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggleStatus = async (src) => {
    const newStatus = src.status === "inactive" ? "pending" : "inactive";
    await base44.entities.DataSource.update(src.id, { status: newStatus });
    addLog("success", `${src.name} ${newStatus === "inactive" ? "disabled" : "enabled"}`);
    load();
  };

  const handleDelete = async (src) => {
    if (!confirm(`Delete "${src.name}"? This cannot be undone.`)) return;
    await base44.entities.DataSource.delete(src.id);
    addLog("success", `Deleted: ${src.name}`);
    load();
  };

  const handleSync = async (src) => {
    setSyncing(src.id);
    addLog("info", `Syncing ${src.name}...`);
    try {
      const res = await base44.functions.invoke("scheduledDataSync", { source_id: src.id });
      const result = res.data?.results?.[0];
      if (result?.status === "failed") addLog("error", `Sync failed: ${src.name}`);
      else addLog("success", `Sync complete: ${src.name}`);
    } catch (e) { addLog("error", e.message); }
    setSyncing(null);
    load();
  };

  const handleSaveSchedule = async (freq) => {
    await base44.entities.DataSource.update(scheduleFor.id, { sync_frequency: freq });
    addLog("success", `Schedule updated: ${scheduleFor.name} → ${freq}`);
    setScheduleFor(null);
    load();
  };

  const filtered = useMemo(() => {
    let list = [...sources];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.metadata?.notes?.toLowerCase().includes(q));
    }
    if (filterStatus !== "all") list = list.filter(s => s.status === filterStatus);
    if (filterCategory !== "all") list = list.filter(s => s.category === filterCategory);
    if (filterSync !== "all") list = list.filter(s => (s.sync_frequency || "manual") === filterSync);

    list.sort((a, b) => {
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name_desc") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      if (sortBy === "category") return (a.category || "").localeCompare(b.category || "");
      if (sortBy === "sync_frequency") return (a.sync_frequency || "").localeCompare(b.sync_frequency || "");
      // updated_desc (default)
      return new Date(b.updated_date || 0) - new Date(a.updated_date || 0);
    });
    return list;
  }, [sources, search, filterStatus, filterCategory, filterSync, sortBy]);

  const stats = useMemo(() => ({
    total: sources.length,
    active: sources.filter(s => s.status === "active").length,
    error: sources.filter(s => s.status === "error").length,
    inactive: sources.filter(s => s.status === "inactive").length,
  }), [sources]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>My Data Sources</h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Manage, organize and configure all your imported data sources</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLogs(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <ScrollText size={12} /> Sync Logs
          </button>
          <button onClick={load}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b shrink-0"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
        {[
          { label: "Total", value: stats.total, color: "var(--text-secondary)" },
          { label: "Active", value: stats.active, color: "var(--color-success)" },
          { label: "Error", value: stats.error, color: "var(--color-error)" },
          { label: "Disabled", value: stats.inactive, color: "var(--text-muted)" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="text-lg font-bold" style={{ color: s.color, fontFamily: "var(--font-heading)" }}>{s.value}</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</span>
          </div>
        ))}
        <div className="flex-1" />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{filtered.length} shown</span>
      </div>

      {/* Toolbar: search + filters + sort + view toggle */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b shrink-0"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        {/* Search */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md flex-1 min-w-48"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <Search size={12} style={{ color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, description, notes..."
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        {/* Status filter */}
        <FilterSelect value={filterStatus} onChange={setFilterStatus}
          options={[{ value: "all", label: "All Statuses" }, ...STATUSES.map(s => ({ value: s, label: capitalize(s) }))]} />

        {/* Category filter */}
        <FilterSelect value={filterCategory} onChange={setFilterCategory}
          options={[{ value: "all", label: "All Categories" }, ...CATEGORIES.map(c => ({ value: c, label: c.replace(/_/g, " ") }))]} />

        {/* Sync freq filter */}
        <FilterSelect value={filterSync} onChange={setFilterSync}
          options={[{ value: "all", label: "All Sync" }, ...SYNC_FREQS.map(f => ({ value: f, label: capitalize(f) }))]} />

        {/* Sort */}
        <FilterSelect value={sortBy} onChange={setSortBy} icon={<ArrowUpDown size={11} />}
          options={SORT_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />

        {/* View mode */}
        <div className="flex rounded-md overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
          {["grid", "list"].map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className="px-2 py-1"
              style={{ background: viewMode === m ? "var(--bg-hover)" : "var(--bg-elevated)", color: viewMode === m ? "var(--accent-primary)" : "var(--text-muted)" }}>
              {m === "grid" ? <LayoutGrid size={13} /> : <List size={13} />}
            </button>
          ))}
        </div>
      </div>

      {/* Source list */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={16} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
            <Database size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{sources.length === 0 ? "No data sources imported yet." : "No sources match your filters."}</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(src => (
              <SourceCard key={src.id} src={src} syncing={syncing}
                onDetail={() => setDetailSource(src)}
                onSync={() => handleSync(src)}
                onSchedule={() => setScheduleFor(src)}
                onToggle={() => handleToggleStatus(src)}
                onDelete={() => handleDelete(src)} />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(src => (
              <SourceRow key={src.id} src={src} syncing={syncing}
                onDetail={() => setDetailSource(src)}
                onSync={() => handleSync(src)}
                onSchedule={() => setScheduleFor(src)}
                onToggle={() => handleToggleStatus(src)}
                onDelete={() => handleDelete(src)} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {detailSource && (
        <SourceDetailModal
          source={detailSource}
          onClose={() => setDetailSource(null)}
          onSaved={() => { setDetailSource(null); load(); }}
        />
      )}
      {scheduleFor && (
        <SyncScheduleModal source={scheduleFor} onSave={handleSaveSchedule} onClose={() => setScheduleFor(null)} />
      )}
      {showLogs && <SyncLogsPanel onClose={() => setShowLogs(false)} />}
    </div>
  );
}

function SourceCard({ src, syncing, onDetail, onSync, onSchedule, onToggle, onDelete }) {
  const isInactive = src.status === "inactive";
  return (
    <div className="metric-card flex flex-col gap-2 cursor-pointer transition-all"
      style={{ opacity: isInactive ? 0.6 : 1 }}
      onClick={onDetail}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0"
            style={{ background: "var(--bg-overlay)" }}>
            <Database size={13} style={{ color: isInactive ? "var(--text-muted)" : "var(--accent-primary)" }} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{src.name}</div>
            <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {src.category?.replace(/_/g, " ") || src.type}
            </div>
          </div>
        </div>
        <StatusBadge status={src.status} />
      </div>

      {src.description && (
        <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>{src.description}</p>
      )}
      {src.metadata?.notes && (
        <div className="flex items-start gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          <StickyNote size={10} className="mt-0.5 shrink-0" />
          <span className="line-clamp-1 italic">{src.metadata.notes}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1 mt-auto border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {src.last_synced ? `Synced ${new Date(src.last_synced).toLocaleDateString("en-CA")}` : "Never synced"}
          {src.sync_frequency && src.sync_frequency !== "manual" &&
            <span className="ml-1" style={{ color: "var(--accent-primary)" }}>· {src.sync_frequency}</span>}
        </div>
        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
          <ActionBtn title="Sync now" onClick={onSync} disabled={syncing === src.id}>
            <RefreshCw size={11} className={syncing === src.id ? "animate-spin" : ""} style={{ color: "var(--color-info)" }} />
          </ActionBtn>
          <ActionBtn title="Set schedule" onClick={onSchedule}>
            <CalendarClock size={11} style={{ color: "var(--accent-primary)" }} />
          </ActionBtn>
          <ActionBtn title={isInactive ? "Enable" : "Disable"} onClick={onToggle}>
            {isInactive ? <Power size={11} style={{ color: "var(--color-success)" }} /> : <PowerOff size={11} style={{ color: "var(--text-muted)" }} />}
          </ActionBtn>
          <ActionBtn title="Delete" onClick={onDelete}>
            <Trash2 size={11} style={{ color: "var(--color-error)" }} />
          </ActionBtn>
        </div>
      </div>
    </div>
  );
}

function SourceRow({ src, syncing, onDetail, onSync, onSchedule, onToggle, onDelete }) {
  const isInactive = src.status === "inactive";
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", opacity: isInactive ? 0.6 : 1 }}
      onMouseOver={e => e.currentTarget.style.borderColor = "var(--border-default)"}
      onMouseOut={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}
      onClick={onDetail}>
      <Database size={14} style={{ color: isInactive ? "var(--text-muted)" : "var(--accent-primary)", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{src.name}</span>
        {src.metadata?.notes && <span className="ml-2 text-xs italic" style={{ color: "var(--text-muted)" }}>{src.metadata.notes}</span>}
      </div>
      <span className="text-xs hidden sm:block" style={{ color: "var(--text-muted)", minWidth: 100 }}>
        {src.category?.replace(/_/g, " ") || "—"}
      </span>
      <span className="text-xs hidden md:block" style={{ color: "var(--text-muted)", minWidth: 80 }}>
        {src.sync_frequency || "manual"}
      </span>
      <StatusBadge status={src.status} />
      <div className="flex items-center gap-0.5 ml-1 shrink-0" onClick={e => e.stopPropagation()}>
        <ActionBtn title="Sync now" onClick={onSync} disabled={syncing === src.id}>
          <RefreshCw size={11} className={syncing === src.id ? "animate-spin" : ""} style={{ color: "var(--color-info)" }} />
        </ActionBtn>
        <ActionBtn title="Set schedule" onClick={onSchedule}>
          <CalendarClock size={11} style={{ color: "var(--accent-primary)" }} />
        </ActionBtn>
        <ActionBtn title={isInactive ? "Enable" : "Disable"} onClick={onToggle}>
          {isInactive ? <Power size={11} style={{ color: "var(--color-success)" }} /> : <PowerOff size={11} style={{ color: "var(--text-muted)" }} />}
        </ActionBtn>
        <ActionBtn title="Delete" onClick={onDelete}>
          <Trash2 size={11} style={{ color: "var(--color-error)" }} />
        </ActionBtn>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    active: { icon: <CheckCircle size={10} />, color: "var(--color-success)" },
    error: { icon: <AlertCircle size={10} />, color: "var(--color-error)" },
    inactive: { icon: <PowerOff size={10} />, color: "var(--text-muted)" },
    pending: { icon: <Clock size={10} />, color: "var(--color-warning)" },
  }[status] || { icon: <Clock size={10} />, color: "var(--text-muted)" };
  return (
    <div className="flex items-center gap-1" style={{ color: cfg.color }}>
      {cfg.icon}
      <span className="text-xs hidden sm:block">{capitalize(status)}</span>
    </div>
  );
}

function ActionBtn({ title, onClick, disabled, children }) {
  return (
    <button title={title} disabled={disabled} onClick={onClick}
      className="activity-icon" style={{ width: 24, height: 24 }}>
      {children}
    </button>
  );
}

function FilterSelect({ value, onChange, options, icon }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-md"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
      {icon && <span style={{ color: "var(--text-muted)" }}>{icon}</span>}
      <select value={value} onChange={e => onChange(e.target.value)}
        className="bg-transparent outline-none text-xs"
        style={{ color: "var(--text-secondary)", cursor: "pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }