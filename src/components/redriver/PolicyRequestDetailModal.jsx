import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  X, UserCheck, XCircle, Save, Mail, Calendar, Building2, Tag,
  AlertTriangle, FileText, Trash2, User, Clock, Phone, Target,
  CheckCircle2, Sparkles, Hash, ChevronRight,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted", color: "#40c4ff" },
  { value: "received", label: "Received", color: "#40c4ff" },
  { value: "in_review", label: "In Review", color: "#a78bfa" },
  { value: "assigned", label: "Assigned", color: "#FEDD00" },
  { value: "started", label: "Started", color: "#fbbf24" },
  { value: "in_progress", label: "In Progress", color: "#fb923c" },
  { value: "proofing", label: "Proofing", color: "#22d3ee" },
  { value: "sent_for_approval", label: "Sent for Approval", color: "#c084fc" },
  { value: "completed", label: "Completed", color: "#52c41a" },
  { value: "rejected", label: "Rejected", color: "#ff4d4f" },
  { value: "closed", label: "Closed", color: "#8bafd4" },
];

const URGENCY_META = {
  low:      { color: "#52c41a", label: "Low" },
  medium:   { color: "#40c4ff", label: "Medium" },
  high:     { color: "#faad14", label: "High" },
  critical: { color: "#ff4d4f", label: "Critical" },
};

const PROGRESS_PERCENTS = [10, 25, 33, 50, 75, 90];

const REJECTION_REASONS = [
  { value: "duplicate_request", label: "Duplicate Request" },
  { value: "out_of_scope", label: "Out of Scope" },
  { value: "insufficient_information", label: "Insufficient Information" },
  { value: "not_a_priority", label: "Not a Priority at this Time" },
  { value: "resource_constraints", label: "Resource Constraints" },
  { value: "other", label: "Other (specify below)" },
];

const statusMeta = (v) => STATUS_OPTIONS.find((s) => s.value === v) || STATUS_OPTIONS[0];

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-default)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 12.5,
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
};

const optionStyle = { background: "#0f1829", color: "#f0f6ff" };

// ── Reusable bits ──────────────────────────────────────────────────────────
function StatusPill({ value, size = "md" }) {
  const m = statusMeta(value);
  const pad = size === "sm" ? "2px 8px" : "4px 10px";
  const fs  = size === "sm" ? 10 : 11;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full font-semibold"
      style={{
        padding: pad,
        fontSize: fs,
        background: `${m.color}1f`,
        color: m.color,
        border: `1px solid ${m.color}55`,
        letterSpacing: "0.02em",
      }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: m.color, boxShadow: `0 0 6px ${m.color}`,
      }} />
      {m.label}
    </span>
  );
}

function UrgencyPill({ value }) {
  const m = URGENCY_META[value] || URGENCY_META.medium;
  return (
    <span className="inline-flex items-center gap-1 rounded-full font-semibold"
      style={{
        padding: "3px 9px", fontSize: 10.5,
        background: `${m.color}1a`, color: m.color, border: `1px solid ${m.color}44`,
      }}>
      <AlertTriangle size={9} /> {m.label}
    </span>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="block mb-2"
      style={{
        fontSize: 10.5, fontWeight: 700,
        color: "var(--text-muted)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}>
      {children}
    </label>
  );
}

function SectionCard({ children, accent }) {
  return (
    <div className="rounded-xl p-4"
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${accent ? accent + "33" : "var(--border-subtle)"}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.02) inset",
      }}>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PolicyRequestDetailModal({ request, onClose, onUpdated }) {
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("details");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [assignTo, setAssignTo] = useState(request.assigned_to_user_id || "");
  const [status, setStatus] = useState(request.current_status || "submitted");
  const [progressNotes, setProgressNotes] = useState(request.progress_notes || "");
  const [progressPercent, setProgressPercent] = useState(
    typeof request.progress_percent === "number" ? request.progress_percent : null
  );
  const [rejectionReason, setRejectionReason] = useState(request.rejection_reason || "");
  const [rejectionDetails, setRejectionDetails] = useState(request.rejection_details || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    base44.entities.User.list("-created_date", 200).then(setUsers).catch(() => {});
  }, []);

  const close = () => onClose();

  const handleDelete = async () => {
    setError(null); setSaving(true);
    try {
      await base44.entities.PolicyRequest.delete(request.id);
      onUpdated?.(); onClose();
    } catch (e) {
      setError(e?.message || "Failed to delete request");
      setSaving(false);
    }
  };

  const sendAssignmentEmail = async (assignee, req) => {
    try {
      await base44.functions.invoke("notifyPolicyRequestAssignment", {
        request_id: req.id,
        assignee_email: assignee.email,
        assignee_name: assignee.full_name || assignee.email,
        request_title: req.request_title,
        requester_name: req.contact_person_name,
        requester_email: req.contact_person_email,
        urgency: req.urgency,
        request_type: req.request_type,
      });
    } catch (e) {
      console.warn("assignment email failed", e?.message ?? e);
    }
  };

  const handleAssign = async () => {
    setError(null);
    if (!assignTo) { setError("Please select someone to assign to"); return; }
    const assignee = users.find((u) => u.id === assignTo);
    if (!assignee) { setError("Selected user not found"); return; }
    setSaving(true);
    try {
      const updated = {
        assigned_to_user_id: assignee.id,
        assigned_to_user_name: assignee.full_name || assignee.email,
        assigned_to_user_email: assignee.email,
        assigned_date: new Date().toISOString(),
        current_status: status === "submitted" ? "assigned" : status,
      };
      await base44.entities.PolicyRequest.update(request.id, updated);
      await sendAssignmentEmail(assignee, { ...request, ...updated });
      onUpdated?.(); close();
    } catch (e) {
      setError(e?.message || "Failed to assign request");
    } finally { setSaving(false); }
  };

  const handleSaveProgress = async () => {
    setError(null); setSaving(true);
    try {
      const update = { current_status: status, progress_notes: progressNotes };
      update.progress_percent = status === "in_progress" ? (progressPercent ?? null) : null;
      await base44.entities.PolicyRequest.update(request.id, update);
      onUpdated?.(); close();
    } catch (e) {
      setError(e?.message || "Failed to update progress");
    } finally { setSaving(false); }
  };

  const handleReject = async () => {
    setError(null);
    if (!rejectionReason) { setError("Please select a rejection reason"); return; }
    setSaving(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.PolicyRequest.update(request.id, {
        current_status: "rejected",
        rejection_reason: rejectionReason,
        rejection_details: rejectionDetails,
        rejected_by_name: me?.full_name || me?.email || "Unknown",
        rejected_date: new Date().toISOString(),
      });
      onUpdated?.(); close();
    } catch (e) {
      setError(e?.message || "Failed to reject request");
    } finally { setSaving(false); }
  };

  const liveStatus = statusMeta(request.current_status);
  const headerProgress =
    request.current_status === "in_progress" && typeof request.progress_percent === "number"
      ? request.progress_percent : null;

  const TABS = [
    { id: "details", label: "Details", icon: FileText },
    { id: "assign", label: "Assign", icon: UserCheck },
    { id: "progress", label: "Progress", icon: Sparkles },
    { id: "reject", label: "Reject", icon: XCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={close}>
      {/* Inline focus styles */}
      <style>{`
        .prdm input:focus, .prdm select:focus, .prdm textarea:focus {
          border-color: #FEDD00 !important;
          box-shadow: 0 0 0 3px rgba(254,221,0,0.18);
          background: var(--bg-elevated) !important;
        }
        .prdm-tab:hover { color: var(--text-primary) !important; }
      `}</style>

      <div className="prdm rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}>

        {/* ── Hero header ─────────────────────────────────────────── */}
        <div className="relative shrink-0"
          style={{
            background: `linear-gradient(135deg, var(--bg-surface) 0%, ${liveStatus.color}10 60%, var(--bg-elevated) 100%)`,
            borderBottom: "1px solid var(--border-default)",
          }}>
          {/* accent bar */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
            background: `linear-gradient(180deg, ${liveStatus.color}, ${liveStatus.color}66)`,
            boxShadow: `0 0 12px ${liveStatus.color}88`,
          }} />

          <div className="px-6 py-4 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span style={{
                  fontSize: 10, fontWeight: 700, color: "#FEDD00",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                }}>
                  Policy Request
                </span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-muted)" }} />
                <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "monospace" }}>
                  #{request.id?.slice(-8) ?? "—"}
                </span>
              </div>
              <h2 className="font-bold leading-snug mb-2"
                style={{ color: "var(--text-primary)", fontSize: 16 }}>
                {request.request_title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill value={request.current_status} />
                {request.urgency && <UrgencyPill value={request.urgency} />}
                {request.department && (
                  <span className="inline-flex items-center gap-1 rounded-full"
                    style={{
                      padding: "3px 9px", fontSize: 10.5,
                      background: "var(--bg-overlay)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-secondary)",
                    }}>
                    <Building2 size={9} /> {request.department}
                  </span>
                )}
                {headerProgress != null && (
                  <span className="inline-flex items-center gap-1 rounded-full font-semibold"
                    style={{
                      padding: "3px 9px", fontSize: 10.5,
                      background: "rgba(251,146,60,0.15)",
                      border: "1px solid rgba(251,146,60,0.4)",
                      color: "#fb923c",
                    }}>
                    {headerProgress}% complete
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {confirmDelete ? (
                <>
                  <span className="text-xs mr-1" style={{ color: "#ff4d4f" }}>Delete?</span>
                  <button onClick={handleDelete} disabled={saving}
                    className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                    style={{ background: "#ff4d4f", color: "#fff" }}>
                    <Trash2 size={11} /> {saving ? "Deleting..." : "Confirm"}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} disabled={saving}
                    className="px-2.5 py-1 rounded text-xs font-semibold"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="activity-icon" title="Delete request"
                  style={{ width: 30, height: 30, color: "#ff4d4f" }}>
                  <Trash2 size={13} />
                </button>
              )}
              <button onClick={close} className="activity-icon" style={{ width: 30, height: 30 }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Header progress bar (live) */}
          {headerProgress != null && (
            <div className="h-1" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div style={{
                width: `${headerProgress}%`, height: "100%",
                background: "linear-gradient(90deg, #fb923c, #FEDD00)",
                boxShadow: "0 0 8px rgba(254,221,0,0.5)",
                transition: "width 0.3s ease",
              }} />
            </div>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-5 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="prdm-tab flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold relative"
                style={{
                  color: active ? "#FEDD00" : "var(--text-muted)",
                  background: "transparent",
                  transition: "color 0.15s",
                }}>
                <t.icon size={12} /> {t.label}
                {active && (
                  <span style={{
                    position: "absolute", left: 8, right: 8, bottom: -1, height: 2,
                    background: "#FEDD00", borderRadius: "2px 2px 0 0",
                    boxShadow: "0 0 6px rgba(254,221,0,0.6)",
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="overflow-auto flex-1 p-5"
          style={{ background: "linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)" }}>
          {error && (
            <div className="mb-4 rounded-lg p-3 text-xs flex items-start gap-2"
              style={{ background: "rgba(255,77,79,0.1)", border: "1px solid rgba(255,77,79,0.3)", color: "#ff4d4f" }}>
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === "details" && <DetailsTab request={request} />}

          {tab === "assign" && (
            <AssignTab
              users={users}
              assignTo={assignTo} setAssignTo={setAssignTo}
              status={status} setStatus={setStatus}
              currentAssignee={request.assigned_to_user_name}
              onCancel={close} onSubmit={handleAssign} saving={saving}
            />
          )}

          {tab === "progress" && (
            <ProgressTab
              status={status} setStatus={setStatus}
              progressPercent={progressPercent} setProgressPercent={setProgressPercent}
              progressNotes={progressNotes} setProgressNotes={setProgressNotes}
              onCancel={close} onSubmit={handleSaveProgress} saving={saving}
            />
          )}

          {tab === "reject" && (
            <RejectTab
              rejectionReason={rejectionReason} setRejectionReason={setRejectionReason}
              rejectionDetails={rejectionDetails} setRejectionDetails={setRejectionDetails}
              onCancel={close} onSubmit={handleReject} saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Details tab ────────────────────────────────────────────────────────────
function DetailsTab({ request }) {
  const InfoRow = ({ icon: Icon, label, value, mono }) => (
    <div className="flex gap-3 items-start py-2">
      <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center"
        style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
        <Icon size={12} style={{ color: "var(--text-muted)" }} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div style={{
          fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)",
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 12.5, color: "var(--text-primary)",
          fontFamily: mono ? "monospace" : undefined,
          wordBreak: "break-word",
        }}>
          {value || <span style={{ color: "var(--text-muted)" }}>—</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Metadata grid */}
      <SectionCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
          <InfoRow icon={Tag} label="Type" value={request.request_type?.replace(/_/g, " ")} />
          <InfoRow icon={AlertTriangle} label="Urgency" value={URGENCY_META[request.urgency]?.label} />
          <InfoRow icon={Building2} label="Department" value={request.department} />
          <InfoRow icon={UserCheck} label="Assigned To" value={request.assigned_to_user_name} />
          <InfoRow icon={User} label="Requester" value={request.contact_person_name} />
          <InfoRow icon={Mail} label="Email" value={request.contact_person_email} mono />
          {request.contact_person_phone && (
            <InfoRow icon={Phone} label="Phone" value={request.contact_person_phone} />
          )}
          <InfoRow icon={Calendar} label="Required By" value={request.required_completion_date} />
        </div>
      </SectionCard>

      {/* Description */}
      <div>
        <FieldLabel>
          <span className="inline-flex items-center gap-1.5">
            <FileText size={10} /> Description
          </span>
        </FieldLabel>
        <div className="rounded-xl p-4 text-xs whitespace-pre-wrap leading-relaxed"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}>
          {request.description}
        </div>
      </div>

      {/* Objective */}
      {request.objective && (
        <div>
          <FieldLabel>
            <span className="inline-flex items-center gap-1.5">
              <Target size={10} /> Objective
            </span>
          </FieldLabel>
          <div className="rounded-xl p-4 text-xs whitespace-pre-wrap leading-relaxed"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}>
            {request.objective}
          </div>
        </div>
      )}

      {/* Latest progress note */}
      {request.progress_notes && (
        <div>
          <FieldLabel>
            <span className="inline-flex items-center gap-1.5" style={{ color: "#FEDD00" }}>
              <Sparkles size={10} /> Latest Progress
            </span>
          </FieldLabel>
          <div className="rounded-xl p-4 text-xs whitespace-pre-wrap leading-relaxed"
            style={{
              background: "rgba(254,221,0,0.06)",
              border: "1px solid rgba(254,221,0,0.25)",
              color: "var(--text-primary)",
            }}>
            {request.progress_notes}
          </div>
        </div>
      )}

      {/* Rejection */}
      {request.current_status === "rejected" && (
        <div>
          <FieldLabel>
            <span className="inline-flex items-center gap-1.5" style={{ color: "#ff4d4f" }}>
              <XCircle size={10} /> Rejection
            </span>
          </FieldLabel>
          <div className="rounded-xl p-4 text-xs space-y-1.5"
            style={{
              background: "rgba(255,77,79,0.08)",
              border: "1px solid rgba(255,77,79,0.3)",
              color: "var(--text-primary)",
            }}>
            <div><strong style={{ color: "#ff4d4f" }}>Reason:</strong> {request.rejection_reason?.replace(/_/g, " ")}</div>
            {request.rejection_details && <div><strong style={{ color: "#ff4d4f" }}>Details:</strong> {request.rejection_details}</div>}
            {request.rejected_by_name && (
              <div className="pt-1 mt-2 flex items-center gap-1.5"
                style={{ color: "var(--text-muted)", fontSize: 11, borderTop: "1px solid rgba(255,77,79,0.15)" }}>
                <Clock size={10} />
                Rejected by {request.rejected_by_name} on {new Date(request.rejected_date).toLocaleDateString("en-CA")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Assign tab ─────────────────────────────────────────────────────────────
function AssignTab({ users, assignTo, setAssignTo, status, setStatus, currentAssignee, onCancel, onSubmit, saving }) {
  const selected = users.find((u) => u.id === assignTo);
  return (
    <div className="space-y-5">
      {currentAssignee && (
        <div className="rounded-lg p-3 text-xs flex items-center gap-2"
          style={{ background: "rgba(64,196,255,0.07)", border: "1px solid rgba(64,196,255,0.25)", color: "var(--text-secondary)" }}>
          <UserCheck size={13} style={{ color: "#40c4ff" }} />
          Currently assigned to <strong style={{ color: "var(--text-primary)" }}>{currentAssignee}</strong>
        </div>
      )}

      <div>
        <FieldLabel>Assign to teammate</FieldLabel>
        <select style={inputStyle} value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
          <option value="" style={optionStyle}>— Select a user —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id} style={optionStyle}>
              {u.full_name || u.email} ({u.email})
            </option>
          ))}
        </select>

        {selected && (
          <div className="mt-3 rounded-lg p-3 flex items-center gap-3"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
              style={{ background: "rgba(254,221,0,0.15)", color: "#FEDD00", border: "1px solid rgba(254,221,0,0.3)" }}>
              {(selected.full_name || selected.email)[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>
                {selected.full_name || selected.email}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                {selected.email}
              </div>
            </div>
            <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
          </div>
        )}

        <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
          <Mail size={11} /> The assignee will receive an email notification.
        </p>
      </div>

      <div>
        <FieldLabel>Set initial status</FieldLabel>
        <StatusGrid value={status} onChange={setStatus} />
      </div>

      <FormActions
        onCancel={onCancel}
        onSubmit={onSubmit}
        saving={saving}
        submitLabel="Assign & Notify"
        submitIcon={UserCheck}
      />
    </div>
  );
}

// ── Progress tab ───────────────────────────────────────────────────────────
function ProgressTab({ status, setStatus, progressPercent, setProgressPercent, progressNotes, setProgressNotes, onCancel, onSubmit, saving }) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Progress status</FieldLabel>
        <StatusGrid value={status} onChange={setStatus} />
      </div>

      {status === "in_progress" && (
        <div>
          <FieldLabel>
            <span className="inline-flex items-center gap-1.5">
              <Hash size={10} /> Percent complete
            </span>
          </FieldLabel>
          <div className="rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(251,146,60,0.06), rgba(254,221,0,0.04))",
              border: "1px solid rgba(251,146,60,0.25)",
            }}>
            <div className="flex flex-wrap gap-2 mb-3">
              {PROGRESS_PERCENTS.map((p) => {
                const active = progressPercent === p;
                return (
                  <button key={p} onClick={() => setProgressPercent(p)}
                    className="rounded-lg text-xs font-bold transition-all"
                    style={{
                      padding: "8px 14px", minWidth: 64,
                      background: active ? "linear-gradient(135deg, #fb923c, #FEDD00)" : "var(--bg-overlay)",
                      border: `1px solid ${active ? "transparent" : "var(--border-default)"}`,
                      color: active ? "#1a1108" : "var(--text-secondary)",
                      boxShadow: active ? "0 4px 12px rgba(251,146,60,0.3)" : "none",
                      transform: active ? "translateY(-1px)" : "none",
                    }}>
                    {p}%
                  </button>
                );
              })}
            </div>

            {/* Progress bar preview */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                <div style={{
                  width: `${progressPercent ?? 0}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #fb923c, #FEDD00)",
                  transition: "width 0.3s ease",
                  boxShadow: progressPercent ? "0 0 8px rgba(254,221,0,0.5)" : "none",
                }} />
              </div>
              <span className="font-bold tabular-nums shrink-0"
                style={{ fontSize: 13, color: progressPercent ? "#fb923c" : "var(--text-muted)", minWidth: 40, textAlign: "right" }}>
                {progressPercent ?? 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div>
        <FieldLabel>Progress notes</FieldLabel>
        <textarea
          style={{ ...inputStyle, minHeight: 110, resize: "vertical", lineHeight: 1.5 }}
          value={progressNotes}
          onChange={(e) => setProgressNotes(e.target.value)}
          placeholder="What's been done, blockers, next steps…" />
        <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
          Subscribed requesters will be emailed if this changes the status or percent.
        </p>
      </div>

      <FormActions
        onCancel={onCancel}
        onSubmit={onSubmit}
        saving={saving}
        submitLabel="Save Progress"
        submitIcon={Save}
      />
    </div>
  );
}

// ── Reject tab ─────────────────────────────────────────────────────────────
function RejectTab({ rejectionReason, setRejectionReason, rejectionDetails, setRejectionDetails, onCancel, onSubmit, saving }) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg p-3 text-xs flex items-start gap-2"
        style={{ background: "rgba(255,77,79,0.08)", border: "1px solid rgba(255,77,79,0.25)", color: "#ffb3b3" }}>
        <AlertTriangle size={14} style={{ color: "#ff4d4f", flexShrink: 0, marginTop: 1 }} />
        <span>Rejecting will mark this request closed. The reason will be saved on the request.</span>
      </div>

      <div>
        <FieldLabel>Reason for rejection *</FieldLabel>
        <select style={inputStyle} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}>
          <option value="" style={optionStyle}>— Select a reason —</option>
          {REJECTION_REASONS.map((r) => (
            <option key={r.value} value={r.value} style={optionStyle}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel>Additional details / personalized message</FieldLabel>
        <textarea
          style={{ ...inputStyle, minHeight: 110, resize: "vertical", lineHeight: 1.5 }}
          value={rejectionDetails}
          onChange={(e) => setRejectionDetails(e.target.value)}
          placeholder="Add a personalized message to the requester..." />
      </div>

      <FormActions
        onCancel={onCancel}
        onSubmit={onSubmit}
        saving={saving}
        submitLabel="Reject Request"
        submitIcon={XCircle}
        destructive
      />
    </div>
  );
}

// ── Status grid ────────────────────────────────────────────────────────────
function StatusGrid({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {STATUS_OPTIONS.filter((s) => s.value !== "rejected").map((s) => {
        const active = value === s.value;
        return (
          <button key={s.value} onClick={() => onChange(s.value)}
            className="flex items-center gap-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              padding: "9px 12px",
              background: active ? `${s.color}1a` : "var(--bg-overlay)",
              border: `1px solid ${active ? s.color : "var(--border-default)"}`,
              color: active ? s.color : "var(--text-secondary)",
              boxShadow: active ? `0 0 0 3px ${s.color}22` : "none",
              transform: active ? "translateY(-1px)" : "none",
            }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: s.color,
              boxShadow: active ? `0 0 8px ${s.color}` : "none",
              flexShrink: 0,
            }} />
            <span className="truncate">{s.label}</span>
            {active && <CheckCircle2 size={11} className="ml-auto shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

// ── Form actions footer ────────────────────────────────────────────────────
function FormActions({ onCancel, onSubmit, saving, submitLabel, submitIcon: SubmitIcon, destructive }) {
  return (
    <div className="flex justify-end gap-2 pt-3 mt-2"
      style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <button onClick={onCancel}
        className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
        style={{
          background: "var(--bg-overlay)",
          border: "1px solid var(--border-default)",
          color: "var(--text-secondary)",
        }}>
        Cancel
      </button>
      <button onClick={onSubmit} disabled={saving}
        className="px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all"
        style={{
          background: destructive ? "#ff4d4f" : "linear-gradient(135deg, #FEDD00, #ffe933)",
          color: destructive ? "#fff" : "#043673",
          boxShadow: destructive
            ? "0 4px 12px rgba(255,77,79,0.3)"
            : "0 4px 12px rgba(254,221,0,0.25)",
        }}>
        <SubmitIcon size={12} /> {saving ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}