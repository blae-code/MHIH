import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  Database, Search, RefreshCw, Trash2, CheckCircle, AlertCircle,
  Clock, ArrowUpDown, LayoutGrid, List, StickyNote,
  CalendarClock, Power, PowerOff, ScrollText, Sparkles
} from "lucide-react";
import SourceDetailModal from "@/components/datasources/SourceDetailModal";
import SyncScheduleModal from "@/components/datasources/SyncScheduleModal";
import SyncLogsPanel from "@/components/datasources/SyncLogsPanel";
import SourcesStatStrip from "@/components/datasources/SourcesStatStrip";
import ZoneHeader from "@/components/shell/ZoneHeader";
import ListFilterBar from "@/components/shell/ListFilterBar";

const CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];
const STATUSES = ["active","inactive","error","pending"];
const REGIONS = ["BC","Northern BC","Interior BC","Fraser","Vancouver Island","Vancouver Coastal","Provincial"];
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

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterSync, setFilterSync] = useState("all");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [viewMode, setViewMode] = useState("grid");

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
    if (filterRegion !== "all") list = list.filter(s => (s.metadata?.region || s.region) === filterRegion);
    if (filterSync !== "all") list = list.filter(s => (s.sync_frequency || "manual") === filterSync);

    list.sort((a, b) => {
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name_desc") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      if (sortBy === "category") return (a.category || "").localeCompare(b.category || "");
      if (sortBy === "sync_frequency") return (a.sync_frequency || "").localeCompare(b.sync_frequency || "");
      return new Date(b.updated_date || 0) - new Date(a.updated_date || 0);
    });
    return list;
  }, [sources, search, filterStatus, filterCategory, filterRegion, filterSync, sortBy]);

  // Top categories breakdown for the Insights zone
  const topCategories = useMemo(() => {
    const counts = {};
    sources.forEach(s => {
      if (s.category) counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [sources]);

  // Recently synced
  const recentlySynced = useMemo(() => {
    return [...sources]
      .filter(s => s.last_synced)
      .sort((a, b) => new Date(b.last_synced) - new Date(a.last_synced))
      .slice(0, 4);
  }, [sources]);

  // Sources needing attention
  const needsAttention = useMemo(() => {
    return sources.filter(s => s.status === "error" || s.status === "pending").slice(0, 4);
  }, [sources]);

  return (
    <div className="min-h-full relative" style={{ background: "var(--bg-surface)" }}>
      {/* Ambient page glow */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260, background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(254,221,0,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "radial-gradient(ellipse 50% 100% at 50% 100%, rgba(64,196,255,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <style>{`
        .sources-widget-card {
          border-radius: 10px;
          border: 1.5px solid;
          border-image: linear-gradient(135deg, rgba(254,221,0,0.4) 0%, rgba(64,196,255,0.3) 50%, rgba(254,221,0,0.2) 100%) 1;
          background: #0a1220;
          padding: 14px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(254,221,0,0.08), 0 0 20px rgba(254,221,0,0.05);
        }
        .sources-widget-card:hover {
          border-image: linear-gradient(135deg, rgba(254,221,0,0.6) 0%, rgba(64,196,255,0.5) 50%, rgba(254,221,0,0.4) 100%) 1;
          box-shadow: inset 0 1px 0 rgba(254,221,0,0.15), 0 0 32px rgba(254,221,0,0.15), 0 8px 24px rgba(0,0,0,0.4);
        }
        .sources-widget-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(254,221,0,0.02) 0%, transparent 100%);
          pointer-events: none;
        }
      `}</style>

      <div className="flex flex-col p-3 relative" style={{ zIndex: 1 }}>

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="rounded-xl px-5 py-3 mb-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--bg-surface) 0%, #091828 50%, var(--bg-elevated) 100%)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(254,221,0,0.1)"
          }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #FEDD00 0%, #40c4ff 60%, transparent 100%)" }} />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(254,221,0,0.15) 0%, rgba(254,221,0,0.05) 100%)", border: "1px solid rgba(254,221,0,0.25)", boxShadow: "0 0 16px rgba(254,221,0,0.1)" }}>
                <Database size={16} style={{ color: "var(--mnbc-yellow)" }} />
              </div>
              <div>
                <div className="dashboard-section-label" style={{ marginBottom: 0 }}>My Data Sources</div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Manage, organize, and sync all imported data sources</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowLogs(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                <ScrollText size={12} /> Sync Logs
              </button>
              <button onClick={load}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat strip ─────────────────────────────────────────────── */}
        <div className="mb-3">
          <SourcesStatStrip sources={sources} />
        </div>

        {/* ── 2-zone cockpit ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3 items-start">

          {/* ── Left zone: Sources ────────────────────────────────── */}
          <div className="flex flex-col gap-2.5">
            <ZoneHeader
              label="Sources"
              title="Source Library"
              count={`${filtered.length} / ${sources.length}`}
              hint="search · filter · sync"
            />

            {/* Filters */}
            <ListFilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search name, description, notes..."
              region={filterRegion}
              onRegionChange={setFilterRegion}
              regionOptions={REGIONS}
              category={filterCategory}
              onCategoryChange={setFilterCategory}
              categoryOptions={CATEGORIES}
              status={filterStatus}
              onStatusChange={setFilterStatus}
              statusOptions={STATUSES}
              extra={
                <>
                  <FilterSelect value={filterSync} onChange={setFilterSync}
                    options={[{ value: "all", label: "All Sync" }, ...SYNC_FREQS.map(f => ({ value: f, label: capitalize(f) }))]} />
                  <FilterSelect value={sortBy} onChange={setSortBy} icon={<ArrowUpDown size={11} />}
                    options={SORT_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />
                  <div className="flex rounded-md overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                    {["grid", "list"].map(m => (
                      <button key={m} onClick={() => setViewMode(m)}
                        className="px-2 py-1.5"
                        style={{ background: viewMode === m ? "rgba(254,221,0,0.12)" : "var(--bg-overlay)", color: viewMode === m ? "var(--accent-primary)" : "var(--text-muted)" }}>
                        {m === "grid" ? <LayoutGrid size={13} /> : <List size={13} />}
                      </button>
                    ))}
                  </div>
                </>
              }
            />

            {/* Source list */}
            <div className="sources-widget-card">
              <div className="relative z-10">
                {loading ? (
                  <div className="flex items-center justify-center h-40 gap-2" style={{ color: "var(--text-muted)" }}>
                    <RefreshCw size={16} className="animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
                    <Database size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{sources.length === 0 ? "No data sources imported yet." : "No sources match your filters."}</p>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  <div className="space-y-1.5">
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
            </div>
          </div>

          {/* ── Right zone: Insights ──────────────────────────────────── */}
          <div className="flex flex-col gap-2.5">
            <ZoneHeader
              label="Insights"
              title="Source Intelligence"
              count={`${topCategories.length} categories`}
              hint="health · activity · tips"
            />

            {/* Needs attention */}
            <div className="sources-widget-card">
              <div className="dashboard-section-label relative z-10 flex items-center gap-1.5">
                <AlertCircle size={11} style={{ color: "var(--color-error)" }} />
                Needs Attention
              </div>
              <div className="space-y-2 relative z-10">
                {needsAttention.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
                    All sources healthy — no issues.
                  </p>
                ) : (
                  needsAttention.map(s => (
                    <div key={s.id} className="p-2.5 rounded-md cursor-pointer transition-all"
                      style={{ background: "var(--bg-overlay)", border: `1px solid ${s.status === "error" ? "rgba(255,23,68,0.3)" : "rgba(255,171,64,0.25)"}` }}
                      onClick={() => setDetailSource(s)}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{s.name}</div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                            {s.category?.replace(/_/g, " ") || s.type}
                          </div>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top categories */}
            <div className="sources-widget-card">
              <div className="dashboard-section-label relative z-10">Top Categories</div>
              <div className="space-y-2 relative z-10">
                {topCategories.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
                    No categorized sources.
                  </p>
                ) : (
                  topCategories.map(([cat, count]) => {
                    const pct = sources.length ? (count / sources.length) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="capitalize" style={{ color: "var(--text-secondary)" }}>{cat.replace(/_/g, " ")}</span>
                          <span className="font-mono" style={{ color: "var(--accent-primary)" }}>{count}</span>
                        </div>
                        <div style={{ height: 4, background: "var(--bg-overlay)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #FEDD00 0%, #ffed4e 100%)", borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recently synced */}
            <div className="sources-widget-card">
              <div className="dashboard-section-label relative z-10">Recently Synced</div>
              <div className="space-y-2 relative z-10">
                {recentlySynced.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
                    No sync activity yet.
                  </p>
                ) : (
                  recentlySynced.map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-2 p-2 rounded-md"
                      style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate" style={{ color: "var(--accent-primary)" }}>{s.name}</div>
                        <div className="text-xs" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                          {s.sync_frequency || "manual"} · {s.records_inserted ?? "—"} records
                        </div>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                        {new Date(s.last_synced).toLocaleDateString("en-CA")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* How to use */}
            <div className="sources-widget-card">
              <div className="dashboard-section-label flex items-center gap-1.5 relative z-10">
                <Sparkles size={11} style={{ color: "var(--accent-primary)" }} />
                How to Use
              </div>
              <ul className="space-y-1.5 text-xs relative z-10" style={{ color: "var(--text-secondary)" }}>
                <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Click any source card to view details, edit settings, or preview imported records.</span></li>
                <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Use the <RefreshCw size={10} className="inline" style={{ color: "var(--color-info)" }} /> button to sync a source on demand.</span></li>
                <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Set a <CalendarClock size={10} className="inline" style={{ color: "var(--accent-primary)" }} /> schedule so a source auto-syncs daily, weekly, or monthly.</span></li>
                <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Toggle <Power size={10} className="inline" style={{ color: "var(--color-success)" }} /> to disable a source without deleting it.</span></li>
              </ul>
            </div>
          </div>

        </div>
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
      style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", opacity: isInactive ? 0.6 : 1 }}
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
    <div className="flex items-center gap-1 px-2 py-1.5 rounded-md"
      style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
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