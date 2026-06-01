import React, { useState, useEffect, useMemo, useRef } from "react";
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
import SourcesStatStrip from "@/components/datasources/SourcesStatStrip";
import DiscoveryPanel from "@/components/datasources/DiscoveryPanel";
import RecentSyncsTile from "@/components/datasources/RecentSyncsTile";
import TopCategoriesTile from "@/components/datasources/TopCategoriesTile";
import HowToUseTile from "@/components/datasources/HowToUseTile";
import ZoneHeader from "@/components/shell/ZoneHeader";
import ListFilterBar from "@/components/shell/ListFilterBar";

const CATEGORIES = ["all","chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];
const CATEGORY_OPTIONS = CATEGORIES.filter(c => c !== "all");
const STATUSES = ["all","active","inactive","pending","error"];
const STATUS_OPTIONS = STATUSES.filter(s => s !== "all");
const REGIONS = ["BC","Northern BC","Interior BC","Fraser","Vancouver Island","Vancouver Coastal","Provincial"];
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
  const [viewMode, setViewMode] = useState("grid");
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
  const [browseMenuOpen, setBrowseMenuOpen] = useState(false);
  const browseRef = useRef(null);

  // Filters / sorting
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [sortBy, setSortBy] = useState("updated_desc");

  const loadFailedCount = () => {
    // Count failed sync jobs in the last 24h — recent failure pressure, not lifetime noise.
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    base44.entities.SyncJob.filter({ status: "failed" }, "-created_date", 200)
      .then(jobs => {
        const recent = jobs.filter(j => {
          const t = j.started_at ? new Date(j.started_at).getTime() : new Date(j.created_date).getTime();
          return t >= cutoff;
        });
        setFailedCount(recent.length);
      })
      .catch(() => {});
  };

  const load = () => {
    setLoading(true);
    base44.entities.DataSource.list("-updated_date", 200)
      .then(data => { setSources(data); addLog("success", `${data.length} data sources loaded`); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
    loadFailedCount();
  };

  useEffect(() => {
    load();
  }, []);

  // Close browse menu on outside click
  useEffect(() => {
    if (!browseMenuOpen) return;
    const handler = (e) => {
      if (browseRef.current && !browseRef.current.contains(e.target)) setBrowseMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [browseMenuOpen]);

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
    if (filterRegion !== "all") list = list.filter(s => (s.metadata?.region || s.region) === filterRegion);
    list.sort((a, b) => {
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name_desc") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "created_desc") return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      if (sortBy === "category") return (a.category || "").localeCompare(b.category || "");
      return new Date(b.updated_date) - new Date(a.updated_date);
    });
    return list;
  }, [sources, search, filterCategory, filterStatus, filterRegion, sortBy]);

  // Recent syncs (insights zone)
  const recentSyncs = useMemo(() => {
    return [...sources]
      .filter(s => s.last_synced)
      .sort((a, b) => new Date(b.last_synced) - new Date(a.last_synced))
      .slice(0, 4);
  }, [sources]);

  // Top categories
  const topCategories = useMemo(() => {
    const counts = {};
    sources.forEach(s => { if (s.category) counts[s.category] = (counts[s.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [sources]);

  const importSource = async (sourceData, logMsg) => {
    await base44.entities.DataSource.create(sourceData);
    addLog("success", logMsg);
    load();
  };

  const selectStyle = { background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", padding: "5px 8px", borderRadius: 6, fontSize: 11, outline: "none" };

  const browsers = [
    ["DataBC Tools", () => setShowDataBCTools(true)],
    ["ArcGIS Hub BC", () => setShowArcGISHub(true)],
    ["BC WMS/WFS", () => setShowWMSWFS(true)],
    ["Health Canada CNF", () => setShowCNF(true)],
    ["Health Canada DPD", () => setShowDPD(true)],
    ["Health Infobase", () => setShowHealthInfobase(true)],
    ["StatsCan WDS", () => setShowStatsCanWDS(true)],
    ["Open Gov Canada", () => setShowOpenGov(true)],
    ["BC Data Catalogue", () => setShowCatalogue(true)],
  ];

  return (
    <div className="min-h-full relative" style={{ background: "var(--bg-surface)" }}>
      {/* Ambient page glow */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260, background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(64,196,255,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "radial-gradient(ellipse 50% 100% at 50% 100%, rgba(0,230,118,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <style>{`
        .src-widget-card {
          border-radius: 10px;
          border: 1.5px solid;
          border-image: linear-gradient(135deg, rgba(64,196,255,0.4) 0%, rgba(0,230,118,0.3) 50%, rgba(64,196,255,0.2) 100%) 1;
          background: #0a1220;
          padding: 14px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(64,196,255,0.08), 0 0 20px rgba(64,196,255,0.05);
        }
        .src-widget-card:hover {
          border-image: linear-gradient(135deg, rgba(64,196,255,0.6) 0%, rgba(0,230,118,0.5) 50%, rgba(64,196,255,0.4) 100%) 1;
          box-shadow: inset 0 1px 0 rgba(64,196,255,0.15), 0 0 32px rgba(64,196,255,0.15), 0 8px 24px rgba(0,0,0,0.4);
        }
        .src-widget-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(64,196,255,0.02) 0%, transparent 100%);
          pointer-events: none;
        }
      `}</style>

      <div className="flex flex-col p-3 relative" style={{ zIndex: 1 }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="rounded-xl px-5 py-3 mb-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--bg-surface) 0%, #0d1f2a 50%, var(--bg-elevated) 100%)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(64,196,255,0.1)"
          }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #40c4ff 0%, #00e676 60%, transparent 100%)" }} />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(64,196,255,0.15) 0%, rgba(64,196,255,0.05) 100%)", border: "1px solid rgba(64,196,255,0.25)", boxShadow: "0 0 16px rgba(64,196,255,0.1)" }}>
                <Database size={16} style={{ color: "var(--color-info)" }} />
              </div>
              <div>
                <div className="dashboard-section-label" style={{ marginBottom: 0 }}>Data Sources</div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Connect, sync, and manage external data providers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button onClick={() => setShowLogs(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: failedCount > 0 ? "var(--color-error)" : "var(--text-secondary)" }}>
                <ScrollText size={12} />
                Sync Logs
                {failedCount > 0 && (
                  <span className="px-1.5 rounded-full text-xs font-bold" style={{ background: "var(--color-error)", color: "#fff" }}>{failedCount}</span>
                )}
              </button>

              {/* Connect Source dropdown */}
              <div className="relative" ref={browseRef}>
                <button onClick={() => setBrowseMenuOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ background: "var(--bg-overlay)", border: `1px solid ${browseMenuOpen ? "rgba(64,196,255,0.4)" : "var(--border-default)"}`, color: "var(--text-secondary)" }}>
                  <BookOpen size={12} style={{ color: "var(--color-info)" }} /> Connect Source
                  <ChevronDown size={11} style={{ transform: browseMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>
                {browseMenuOpen && (
                  <div className="absolute right-0 mt-1 rounded-lg overflow-hidden shadow-2xl"
                    style={{ minWidth: 200, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", zIndex: 30 }}>
                    <div className="px-3 py-1.5 text-xs" style={{ color: "var(--text-muted)", background: "var(--bg-overlay)", borderBottom: "1px solid var(--border-subtle)" }}>
                      Browse data catalogs
                    </div>
                    {browsers.map(([label, fn]) => (
                      <button key={label} onClick={() => { fn(); setBrowseMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-all"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <BookOpen size={11} style={{ color: "var(--accent-primary)" }} /> {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => { setEditingSource(null); setShowEditModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a", boxShadow: "0 4px 14px rgba(254,221,0,0.3)" }}>
                <Plus size={12} /> Add Source
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat strip ─────────────────────────────────────────── */}
        <div className="mb-3">
          <SourcesStatStrip sources={sources} failedSyncCount={failedCount} />
        </div>

        {/* ── 2-zone cockpit ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3 items-start">

          {/* ── Left zone: Catalog ─────────────────────────────── */}
          <div className="flex flex-col gap-2.5">
            <ZoneHeader
              label="Catalog"
              title="Connected Sources"
              count={`${filtered.length} / ${sources.length}`}
              hint="browse · sync · schedule"
            />

            {/* Filters */}
            <ListFilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search sources, notes, categories..."
              region={filterRegion}
              onRegionChange={setFilterRegion}
              regionOptions={REGIONS}
              category={filterCategory}
              onCategoryChange={setFilterCategory}
              categoryOptions={CATEGORY_OPTIONS}
              status={filterStatus}
              onStatusChange={setFilterStatus}
              statusOptions={STATUS_OPTIONS}
              extra={
                <>
                  <div className="flex items-center gap-1">
                    <ArrowUpDown size={11} style={{ color: "var(--text-muted)" }} />
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
                      {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center rounded-md overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
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
                </>
              }
            />

            {/* Sources grid / list */}
            <div className="src-widget-card">
              <div className="relative z-10">
                {loading ? (
                  <div className="flex items-center justify-center h-40 gap-2" style={{ color: "var(--text-muted)" }}>
                    <RefreshCw size={16} className="animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40" style={{ color: "var(--text-muted)" }}>
                    <Database size={28} className="mb-3 opacity-30" />
                    <p className="text-sm">{sources.length === 0 ? "No data sources yet — click Connect Source to add one." : "No sources match your filters."}</p>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            </div>
          </div>

          {/* ── Right zone: Insights ─────────────────────────────── */}
          <div className="flex flex-col gap-2.5">
            <ZoneHeader
              label="Insights"
              title="Sync Intelligence"
              count={`${recentSyncs.length} recent`}
              hint="discovery · activity · tips"
            />

            {/* AI discovery queue */}
            <DiscoveryPanel onApproved={load} />

            {/* Recent syncs */}
            <RecentSyncsTile recentSyncs={recentSyncs} />

            {/* Top categories */}
            <TopCategoriesTile topCategories={topCategories} totalSources={sources.length} />

            {/* How to use */}
            <HowToUseTile />
          </div>

        </div>
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
  const statusColor = STATUS_COLORS[src.status] || "var(--text-muted)";
  const isAuto = src.sync_frequency && src.sync_frequency !== "manual";

  return (
    <div
      className="metric-card flex flex-col gap-2.5 relative"
      style={{ opacity: isDisabled ? 0.65 : 1, overflow: "hidden" }}
    >
      {/* Status accent bar — top edge, color-coded by status */}
      <span
        aria-hidden
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}33 100%)`,
          boxShadow: `0 0 8px ${statusColor}44`,
        }}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${statusColor}1f 0%, ${statusColor}08 100%)`,
              border: `1px solid ${statusColor}33`,
              boxShadow: `0 0 12px ${statusColor}1a`,
            }}
          >
            <Database size={14} style={{ color: statusColor, strokeWidth: 2.25 }} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {src.name}
            </div>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className="tag" style={{ fontSize: 9.5, padding: "1px 6px" }}>
                {src.type?.replace(/_/g, " ")}
              </span>
              {src.category && src.category !== "other" && (
                <span
                  className="tag capitalize"
                  style={{
                    fontSize: 9.5, padding: "1px 6px",
                    background: "var(--accent-muted)", color: "var(--accent-primary)",
                    borderColor: "rgba(254,221,0,0.25)",
                  }}
                >
                  {src.category.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Pill-shaped status badge */}
        <div
          className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full"
          style={{
            background: `${statusColor}14`,
            border: `1px solid ${statusColor}40`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
          />
          <span
            className="text-xs capitalize font-semibold"
            style={{ color: statusColor, fontSize: 9.5, letterSpacing: "0.02em" }}
          >
            {src.status}
          </span>
        </div>
      </div>

      {src.description && (
        <p className="text-xs line-clamp-2 leading-snug" style={{ color: "var(--text-secondary)" }}>
          {src.description}
        </p>
      )}

      {src.notes && (
        <div
          className="flex items-start gap-1.5 rounded-md px-2 py-1.5"
          style={{
            background: "rgba(254,221,0,0.06)",
            border: "1px solid rgba(254,221,0,0.2)",
          }}
        >
          <StickyNote size={10} style={{ color: "var(--accent-primary)", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs line-clamp-2 leading-snug" style={{ color: "var(--accent-text)" }}>
            {src.notes}
          </p>
        </div>
      )}

      {src.url && (
        <a
          href={src.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs truncate hover:underline"
          style={{ color: "var(--color-info)" }}
        >
          <Globe size={10} className="shrink-0" /> {src.url}
        </a>
      )}

      <div
        className="flex items-center justify-between pt-2 border-t mt-auto"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-1 shrink-0" title={src.last_synced ? new Date(src.last_synced).toLocaleString("en-CA") : "Never synced"}>
            <RefreshCw size={9} style={{ color: "var(--text-muted)" }} />
            <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)", fontSize: 10 }}>
              {src.last_synced ? new Date(src.last_synced).toLocaleDateString("en-CA") : "—"}
            </span>
          </div>
          <span style={{ color: "var(--border-default)" }}>·</span>
          <div className="flex items-center gap-1 shrink-0">
            <Clock size={9} style={{ color: isAuto ? "var(--accent-primary)" : "var(--text-muted)" }} />
            <span
              className="text-xs capitalize"
              style={{
                color: isAuto ? "var(--accent-primary)" : "var(--text-muted)",
                fontSize: 10,
                fontWeight: isAuto ? 600 : 400,
              }}
            >
              {src.sync_frequency || "manual"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onSync} disabled={!!syncing} title="Sync now" className="activity-icon" style={{ width: 24, height: 24 }}>
            <RefreshCw size={11} className={syncing === src.id ? "animate-spin" : ""} style={{ color: "var(--color-info)" }} />
          </button>
          <button onClick={onSchedule} title="Set schedule" className="activity-icon" style={{ width: 24, height: 24 }}>
            <CalendarClock size={11} style={{ color: "var(--accent-primary)" }} />
          </button>
          <button onClick={onToggle} title={isActive ? "Disable" : "Enable"} className="activity-icon" style={{ width: 24, height: 24 }}>
            {isActive
              ? <ToggleRight size={13} style={{ color: "var(--color-success)" }} />
              : <ToggleLeft size={13} style={{ color: "var(--text-muted)" }} />}
          </button>
          <button onClick={onEdit} title="Edit" className="activity-icon" style={{ width: 24, height: 24 }}>
            <SlidersHorizontal size={11} />
          </button>
          <button onClick={onDelete} title="Delete" className="activity-icon" style={{ width: 24, height: 24, color: "var(--color-error)" }}>
            <Trash2 size={11} />
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