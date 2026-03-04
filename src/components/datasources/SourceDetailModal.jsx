import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  X, Database, Globe, Save, Tag, StickyNote, CalendarClock,
  Info, Clock, Hash, RefreshCw, CheckCircle, AlertCircle, PowerOff
} from "lucide-react";

const CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];
const SYNC_FREQS = ["manual","daily","weekly","monthly"];
const SOURCE_TYPES = ["statcan","bc_health","fnha","manual_upload","api","other"];
const STATUSES = ["active","inactive","pending","error"];

export default function SourceDetailModal({ source, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: source.name || "",
    type: source.type || "other",
    url: source.url || "",
    description: source.description || "",
    category: source.category || "other",
    sync_frequency: source.sync_frequency || "manual",
    status: source.status || "pending",
    metadata: {
      ...source.metadata,
      notes: source.metadata?.notes || "",
      tags: source.metadata?.tags || "",
    }
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setMeta = (key, val) => setForm(f => ({ ...f, metadata: { ...f.metadata, [key]: val } }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.DataSource.update(source.id, {
      name: form.name,
      type: form.type,
      url: form.url,
      description: form.description,
      category: form.category,
      sync_frequency: form.sync_frequency,
      status: form.status,
      metadata: form.metadata,
    });
    setSaving(false);
    onSaved();
  };

  const TABS = ["details", "metadata", "notes"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", maxHeight: "85vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <Database size={15} style={{ color: "var(--accent-primary)" }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{source.name}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>ID: {source.id?.slice(0, 12)}…</div>
            </div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-xs font-medium capitalize transition-colors"
              style={{
                color: activeTab === tab ? "var(--accent-primary)" : "var(--text-muted)",
                borderBottom: activeTab === tab ? "2px solid var(--accent-primary)" : "2px solid transparent",
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "details" && (
            <>
              <Field label="Display Name">
                <input value={form.name} onChange={e => set("name", e.target.value)} style={inputStyle} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <select value={form.type} onChange={e => set("type", e.target.value)} style={inputStyle}>
                    {SOURCE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={e => set("status", e.target.value)} style={inputStyle}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <select value={form.category} onChange={e => set("category", e.target.value)} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                  </select>
                </Field>
                <Field label="Sync Frequency">
                  <select value={form.sync_frequency} onChange={e => set("sync_frequency", e.target.value)} style={inputStyle}>
                    {SYNC_FREQS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="URL / Endpoint">
                <input value={form.url} onChange={e => set("url", e.target.value)} style={inputStyle} placeholder="https://..." />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} style={inputStyle} />
              </Field>
            </>
          )}

          {activeTab === "metadata" && (
            <>
              <div className="space-y-2 rounded-lg p-3" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Read-only Metadata</div>
                {[
                  { label: "Created", value: source.created_date ? new Date(source.created_date).toLocaleString("en-CA") : "—" },
                  { label: "Last Updated", value: source.updated_date ? new Date(source.updated_date).toLocaleString("en-CA") : "—" },
                  { label: "Last Synced", value: source.last_synced ? new Date(source.last_synced).toLocaleString("en-CA") : "Never" },
                  { label: "Record Count", value: source.record_count?.toLocaleString() || "Unknown" },
                  { label: "Source ID", value: source.id },
                  { label: "Created By", value: source.created_by || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs py-1 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <span style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span className="font-mono text-right" style={{ color: "var(--text-secondary)", maxWidth: "60%", wordBreak: "break-all" }}>{value}</span>
                  </div>
                ))}
              </div>
              <Field label="Custom Tags (comma separated)">
                <input value={form.metadata.tags} onChange={e => setMeta("tags", e.target.value)} style={inputStyle} placeholder="e.g. metis, bc, priority" />
              </Field>
            </>
          )}

          {activeTab === "notes" && (
            <>
              <Field label="Personal Notes">
                <textarea
                  value={form.metadata.notes}
                  onChange={e => setMeta("notes", e.target.value)}
                  rows={8}
                  style={inputStyle}
                  placeholder="Add your own notes about this data source — context, usage, data quality observations, etc."
                />
              </Field>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Notes are private and searchable from the My Data Sources page.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <button onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs"
            style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            {saving ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
  width: "100%",
  padding: "6px 10px",
  borderRadius: 6,
  fontSize: 12,
  outline: "none",
};