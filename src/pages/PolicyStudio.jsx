/**
 * Policy Studio — Red River OS
 *
 * Live policy development lifecycle tool backed by the Policy entity.
 * Registry CRUD, Métis lifecycle stage tracking, and evidence linkages
 * to health metrics in the Data & Evidence app.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Scale, Plus, Search, Database, GitBranch, ListChecks } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CockpitShell from "@/components/shell/CockpitShell";
import PolicyForm from "@/components/policy/studio/PolicyForm";
import PolicyRegistryList from "@/components/policy/studio/PolicyRegistryList";
import LifecyclePipeline from "@/components/policy/studio/LifecyclePipeline";
import PolicyEvidencePanel from "@/components/policy/studio/PolicyEvidencePanel";

const TABS = [
  { id: "registry", label: "Policy Registry", icon: ListChecks },
  { id: "lifecycle", label: "Lifecycle Stages", icon: GitBranch },
  { id: "evidence", label: "Evidence Links", icon: Database },
];

export default function PolicyStudio() {
  const [policies, setPolicies] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [activeTab, setActiveTab] = useState("registry");
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const rows = await base44.entities.Policy.list("-updated_date", 200).catch(() => []);
    setPolicies(rows);
  };

  useEffect(() => {
    load();
    base44.entities.HealthMetric.list("-year", 1000).then(setMetrics).catch(() => {});
  }, []);

  const metricNames = useMemo(
    () => [...new Set(metrics.map((m) => m.name))].sort(),
    [metrics]
  );

  const rows = policies ?? [];
  const filtered = rows.filter(
    (p) =>
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags ?? []).some((t) => t.includes(searchQuery.toLowerCase())) ||
      (p.portfolio ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const save = async (data) => {
    if (editing) await base44.entities.Policy.update(editing.id, data);
    else await base44.entities.Policy.create(data);
    setFormOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (policy) => {
    if (!window.confirm(`Delete policy "${policy.title}"?`)) return;
    await base44.entities.Policy.delete(policy.id);
    load();
  };

  const stats = [
    { label: "Policies Tracked", value: rows.length, color: "#f472b6" },
    { label: "High Priority", value: rows.filter((p) => p.priority === "high").length, color: "#fb923c" },
    { label: "In Community Dialogue", value: rows.filter((p) => p.stage === "li-liain").length, color: "#FEDD00" },
    { label: "Evidence-Linked", value: rows.filter((p) => (p.evidence_metric_names?.length ?? 0) > 0).length, color: "#40c4ff" },
  ];

  return (
    <CockpitShell
      icon={<Scale size={16} style={{ color: "#f472b6" }} />}
      title="Policy · Studio"
      subtitle="Policy lifecycle registry, stage tracking, and evidence linkage to the Data & Evidence app"
      topGlow="rgba(244,114,182,0.06)"
      actions={
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold"
          style={{ background: "#FEDD00", color: "#043673" }}
        >
          <Plus size={12} /> New Policy
        </button>
      }
    >
      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl px-3 py-2.5"
            style={{
              background: "var(--bg-card, var(--bg-elevated))",
              border: "1px solid var(--border-subtle)",
              borderTop: `2px solid ${s.color}`,
              boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 2px 8px rgba(0,0,0,0.3)",
            }}>
            {policies === null ? (
              <div className="shimmer" style={{ height: 22, width: 40, marginBottom: 4 }} />
            ) : (
              <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            )}
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 p-1 rounded-lg flex-wrap"
        style={{ background: "var(--bg-elevated)", width: "fit-content", border: "1px solid var(--border-subtle)" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold transition-all"
            style={{
              background: activeTab === t.id ? "rgba(244,114,182,0.1)" : "transparent",
              color: activeTab === t.id ? "#f472b6" : "var(--text-muted)",
              border: activeTab === t.id ? "1px solid rgba(244,114,182,0.25)" : "1px solid transparent",
            }}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* Registry */}
      {activeTab === "registry" && (
        <div>
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg mb-3"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            <Search size={13} style={{ color: "var(--text-muted)" }} />
            <input type="text" placeholder="Search policies, tags, portfolios…" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 12, flex: 1 }} />
          </div>
          {policies === null ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 76, borderRadius: 12 }} />)}</div>
          ) : (
            <PolicyRegistryList
              policies={filtered}
              onEdit={(p) => { setEditing(p); setFormOpen(true); }}
              onDelete={remove}
            />
          )}
        </div>
      )}

      {/* Lifecycle */}
      {activeTab === "lifecycle" && <LifecyclePipeline policies={rows} />}

      {/* Evidence */}
      {activeTab === "evidence" && <PolicyEvidencePanel policies={rows} metrics={metrics} />}

      {/* Create / edit modal */}
      {formOpen && (
        <PolicyForm
          policy={editing}
          metricNames={metricNames}
          onSave={save}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}
    </CockpitShell>
  );
}