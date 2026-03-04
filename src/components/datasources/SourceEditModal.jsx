import React, { useState } from "react";
import { X, Globe, Database, FileText, Clock, Tag, StickyNote } from "lucide-react";

const SOURCE_TYPES = ["statcan","bc_health","fnha","manual_upload","api","other"];
const SYNC_FREQS = ["manual","daily","weekly","monthly"];
const CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];

const iStyle = { background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", width: "100%", padding: "6px 10px", borderRadius: 6, fontSize: 12, outline: "none" };

export default function SourceEditModal({ source, onSave, onClose }) {
  const [form, setForm] = useState({
    name: source?.name || "",
    type: source?.type || "statcan",
    url: source?.url || "",
    description: source?.description || "",
    category: source?.category || "demographics",
    sync_frequency: source?.sync_frequency || "manual",
    status: source?.status || "pending",
    notes: source?.notes || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <Database size={14} style={{ color: "var(--accent-primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {source ? "Edit Data Source" : "Add Data Source"}
            </span>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 26, height: 26 }}>
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
              <FileText size={10} className="inline mr-1" />Name
            </label>
            <input value={form.name} onChange={e => set("name", e.target.value)} style={iStyle} placeholder="Dataset name..." />
          </div>

          {/* Type + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                <Database size={10} className="inline mr-1" />Source Type
              </label>
              <select value={form.type} onChange={e => set("type", e.target.value)} style={iStyle}>
                {SOURCE_TYPES.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                <Tag size={10} className="inline mr-1" />Category
              </label>
              <select value={form.category} onChange={e => set("category", e.target.value)} style={iStyle}>
                {CATEGORIES.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          </div>

          {/* Sync + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                <Clock size={10} className="inline mr-1" />Sync Frequency
              </label>
              <select value={form.sync_frequency} onChange={e => set("sync_frequency", e.target.value)} style={iStyle}>
                {SYNC_FREQS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} style={iStyle}>
                {["active","inactive","pending","error"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
              <Globe size={10} className="inline mr-1" />URL / Endpoint
            </label>
            <input value={form.url} onChange={e => set("url", e.target.value)} style={iStyle} placeholder="https://..." />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={2} style={iStyle} placeholder="Brief description of this data source..." />
          </div>

          {/* Personal Notes */}
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
              <StickyNote size={10} className="inline mr-1" />Personal Notes
            </label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              rows={3} style={{ ...iStyle, borderColor: "var(--border-default)" }}
              placeholder="Add your own notes, context, or reminders about this source..." />
          </div>

          {/* Metadata display (read-only) */}
          {source && (
            <div className="rounded-lg p-3 space-y-1.5" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Metadata</div>
              {[
                ["ID", source.id],
                ["Created", source.created_date ? new Date(source.created_date).toLocaleString("en-CA") : "—"],
                ["Last Updated", source.updated_date ? new Date(source.updated_date).toLocaleString("en-CA") : "—"],
                ["Last Synced", source.last_synced ? new Date(source.last_synced).toLocaleString("en-CA") : "Never"],
                ["Record Count", source.record_count ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span style={{ color: "var(--text-muted)" }}>{k}</span>
                  <span className="font-mono" style={{ color: "var(--text-secondary)" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <button onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs"
            style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
            Cancel
          </button>
          <button onClick={() => onSave(form)}
            className="px-4 py-1.5 rounded-md text-xs font-semibold"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}