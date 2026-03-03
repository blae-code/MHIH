import React, { useState } from "react";
import { X, User, CheckCircle, EyeOff, MessageSquare, AlertTriangle, Clock } from "lucide-react";

const SEVERITY_CONFIG = {
  critical: { color: "var(--color-error)", bg: "#3d1010", label: "Critical" },
  high: { color: "#f97316", bg: "#2d1500", label: "High" },
  medium: { color: "var(--color-warning)", bg: "#2d2208", label: "Medium" },
  low: { color: "var(--color-info)", bg: "#0d1f2d", label: "Low" },
};

const STATUS_OPTIONS = [
  { value: "open", label: "Open", color: "var(--color-error)" },
  { value: "in_review", label: "In Review", color: "var(--color-warning)" },
  { value: "resolved", label: "Resolved", color: "var(--color-success)" },
  { value: "dismissed", label: "Dismissed", color: "var(--text-muted)" },
];

export default function FlagDetailModal({ flag, users, canEdit, onUpdate, onClose }) {
  const [assignEmail, setAssignEmail] = useState(flag.assigned_to_email || "");
  const [notes, setNotes] = useState(flag.resolution_notes || "");
  const [saving, setSaving] = useState(false);

  const sev = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.medium;

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    const updates = { status: newStatus };
    if (newStatus === "resolved") updates.resolved_at = new Date().toISOString();
    await onUpdate(flag.id, updates);
    setSaving(false);
  };

  const handleAssign = async () => {
    setSaving(true);
    const u = users.find(u => u.email === assignEmail);
    await onUpdate(flag.id, {
      assigned_to_email: assignEmail,
      assigned_to_name: u?.full_name || assignEmail,
      status: flag.status === "open" ? "in_review" : flag.status,
    });
    setSaving(false);
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    await onUpdate(flag.id, { resolution_notes: notes });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b"
          style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.color}` }}>
                {sev.label}
              </span>
              <span className="tag">{flag.flag_type?.replace(/_/g, " ")}</span>
            </div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {flag.metric_name || "Unnamed Metric"}
            </h3>
            {(flag.category || flag.region || flag.year) && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {[flag.category?.replace(/_/g, " "), flag.region, flag.year].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28, flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Description */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Issue Description</div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{flag.description}</p>
          </div>

          {/* Affected field details */}
          {flag.affected_field && (
            <div className="p-3 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Field</span>
                  <div className="font-mono mt-0.5" style={{ color: "var(--accent-primary)" }}>{flag.affected_field}</div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Value</span>
                  <div className="font-mono mt-0.5" style={{ color: "var(--text-primary)" }}>{flag.affected_value ?? "—"}</div>
                </div>
                {flag.expected_range_min != null && (
                  <div className="col-span-2">
                    <span style={{ color: "var(--text-muted)" }}>Expected Range</span>
                    <div className="font-mono mt-0.5" style={{ color: "var(--color-success)" }}>
                      [{flag.expected_range_min} – {flag.expected_range_max}]
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status actions */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Status</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value}
                  disabled={!canEdit || saving || flag.status === opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
                  style={{
                    border: `1px solid ${flag.status === opt.value ? opt.color : "var(--border-subtle)"}`,
                    background: flag.status === opt.value ? "rgba(255,255,255,0.05)" : "var(--bg-overlay)",
                    color: flag.status === opt.value ? opt.color : "var(--text-secondary)",
                    opacity: !canEdit ? 0.5 : 1,
                    fontWeight: flag.status === opt.value ? 600 : 400,
                  }}>
                  {opt.value === "resolved" && <CheckCircle size={11} />}
                  {opt.value === "dismissed" && <EyeOff size={11} />}
                  {opt.value === "in_review" && <Clock size={11} />}
                  {opt.label}
                </button>
              ))}
            </div>
            {flag.resolved_at && (
              <p className="text-xs mt-1.5" style={{ color: "var(--color-success)" }}>
                Resolved {new Date(flag.resolved_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>

          {/* Assignment */}
          {canEdit && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                <User size={10} className="inline mr-1" />Assign To
              </div>
              <div className="flex gap-2">
                <select value={assignEmail} onChange={e => setAssignEmail(e.target.value)}
                  className="flex-1 text-xs px-2 py-1.5 rounded-md outline-none"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
                  <option value="">— Unassigned —</option>
                  {users.map(u => <option key={u.id} value={u.email}>{u.full_name} ({u.role})</option>)}
                </select>
                <button onClick={handleAssign} disabled={saving}
                  className="px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{ background: "var(--accent-primary)", color: "#000" }}>
                  Assign
                </button>
              </div>
              {flag.assigned_to_name && (
                <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                  Currently: <span style={{ color: "var(--text-secondary)" }}>{flag.assigned_to_name}</span>
                </p>
              )}
            </div>
          )}

          {/* Resolution notes */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              <MessageSquare size={10} className="inline mr-1" />Resolution Notes
            </div>
            {canEdit ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about how this was investigated or resolved..."
                  className="w-full text-xs px-3 py-2 rounded-md outline-none resize-none"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
                />
                <button onClick={handleSaveNotes} disabled={saving}
                  className="text-xs px-3 py-1.5 rounded-md"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                  Save Notes
                </button>
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {flag.resolution_notes || <span style={{ opacity: 0.5 }}>No notes yet.</span>}
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Detected {new Date(flag.created_date).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</span>
              <span className="font-mono">{flag.id?.slice(-8)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}