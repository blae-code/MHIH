import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, UserCheck, XCircle, Save, Mail, Calendar, Building2, Tag, AlertTriangle, FileText, Trash2, MessageSquare } from "lucide-react";
import PolicyRequestComments from "./PolicyRequestComments";

const STATUS_OPTIONS = [
  { value: "received", label: "Received", color: "#40c4ff" },
  { value: "assigned", label: "Assigned", color: "#FEDD00" },
  { value: "started", label: "Started", color: "#a78bfa" },
  { value: "in_progress", label: "In Progress", color: "#fb923c" },
  { value: "proofing", label: "Proofing", color: "#22d3ee" },
  { value: "sent_for_approval", label: "Sent for Approval", color: "#f472b6" },
  { value: "completed", label: "Completed", color: "#52c41a" },
  { value: "rejected", label: "Rejected", color: "#ff4d4f" },
  { value: "closed", label: "Closed", color: "#8bafd4" },
];

const PROGRESS_PERCENTS = [10, 25, 33, 50, 75, 90];

const REJECTION_REASONS = [
  { value: "duplicate_request", label: "Duplicate Request" },
  { value: "out_of_scope", label: "Out of Scope" },
  { value: "insufficient_information", label: "Insufficient Information" },
  { value: "not_a_priority", label: "Not a Priority at this Time" },
  { value: "resource_constraints", label: "Resource Constraints" },
  { value: "other", label: "Other (specify below)" },
];

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-default)",
  borderRadius: 6,
  color: "var(--text-primary)",
  fontSize: 12,
  outline: "none",
};

// <option> inherits OS chrome bg — force dark bg + light text so the
// dropdown list is readable across browsers.
const optionStyle = {
  background: "#0f1829",
  color: "#f0f6ff",
};

export default function PolicyRequestDetailModal({ request, onClose, onUpdated }) {
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("details");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [assignTo, setAssignTo] = useState(request.assigned_to_user_id || "");
  const [status, setStatus] = useState(request.current_status || "received");
  const [progressPercent, setProgressPercent] = useState(
    typeof request.progress_percent === "number" ? request.progress_percent : null
  );
  const [progressNotes, setProgressNotes] = useState(request.progress_notes || "");

  const [rejectionReason, setRejectionReason] = useState(request.rejection_reason || "");
  const [rejectionDetails, setRejectionDetails] = useState(request.rejection_details || "");

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setError(null);
    setSaving(true);
    try {
      await base44.entities.PolicyRequest.delete(request.id);
      onUpdated?.();
      onClose();
    } catch (e) {
      setError(e?.message || "Failed to delete request");
      setSaving(false);
    }
  };

  useEffect(() => {
    base44.entities.User.list("-created_date", 200).then(setUsers).catch(() => {});
  }, []);

  const close = () => onClose();

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
        current_status: "assigned",
      };
      await base44.entities.PolicyRequest.update(request.id, updated);
      await sendAssignmentEmail(assignee, { ...request, ...updated });
      onUpdated?.();
      close();
    } catch (e) {
      setError(e?.message || "Failed to assign request");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProgress = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        current_status: status,
        progress_notes: progressNotes,
        // Only persist progress_percent when status is in_progress; otherwise clear it.
        progress_percent: status === "in_progress" ? (progressPercent ?? null) : null,
      };
      await base44.entities.PolicyRequest.update(request.id, payload);
      onUpdated?.();
      close();
    } catch (e) {
      setError(e?.message || "Failed to update progress");
    } finally {
      setSaving(false);
    }
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
      onUpdated?.();
      close();
    } catch (e) {
      setError(e?.message || "Failed to reject request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={close}>
      <div className="rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between shrink-0"
          style={{ borderBottom: "1px solid var(--border-default)", background: "var(--bg-surface)" }}>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase font-semibold" style={{ color: "#FEDD00", letterSpacing: "0.08em" }}>
              Policy Request
            </div>
            <h2 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
              {request.request_title}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {confirmDelete ? (
              <>
                <span className="text-xs mr-1" style={{ color: "#ff4d4f" }}>Delete?</span>
                <button onClick={handleDelete} disabled={saving}
                  className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  style={{ background: "#ff4d4f", color: "#fff" }}>
                  <Trash2 size={11} /> {saving ? "Deleting..." : "Yes, delete"}
                </button>
                <button onClick={() => setConfirmDelete(false)} disabled={saving}
                  className="px-2.5 py-1 rounded text-xs font-semibold"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="activity-icon" title="Delete request (testing)"
                style={{ width: 30, height: 30, color: "#ff4d4f" }}>
                <Trash2 size={13} />
              </button>
            )}
            <button onClick={close} className="activity-icon" style={{ width: 30, height: 30 }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
          {[
            { id: "details", label: "Details", icon: FileText },
            { id: "comments", label: "Comments", icon: MessageSquare },
            { id: "assign", label: "Assign", icon: UserCheck },
            { id: "progress", label: "Progress", icon: Save },
            { id: "reject", label: "Reject", icon: XCircle },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t"
              style={{
                background: tab === t.id ? "var(--bg-elevated)" : "transparent",
                color: tab === t.id ? "#FEDD00" : "var(--text-muted)",
                borderBottom: tab === t.id ? "2px solid #FEDD00" : "2px solid transparent",
                marginBottom: -1,
              }}>
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-auto flex-1 p-5">
          {error && (
            <div className="mb-3 rounded-lg p-2 text-xs"
              style={{ background: "rgba(255,77,79,0.1)", border: "1px solid rgba(255,77,79,0.3)", color: "#ff4d4f" }}>
              {error}
            </div>
          )}

          {tab === "details" && <DetailsTab request={request} />}

          {tab === "comments" && <PolicyRequestComments policyRequestId={request.id} />}

          {tab === "assign" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Assign to
                </label>
                <select style={inputStyle} value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                  <option value="" style={optionStyle}>— Select a user —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} style={optionStyle}>
                      {u.full_name || u.email} ({u.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <Mail size={11} /> The assignee will receive an email notification.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={close}
                  className="px-3 py-1.5 rounded text-xs font-semibold"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                  Cancel
                </button>
                <button onClick={handleAssign} disabled={saving}
                  className="px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  style={{ background: "#FEDD00", color: "#043673" }}>
                  <UserCheck size={12} /> {saving ? "Assigning..." : "Assign & Notify"}
                </button>
              </div>
            </div>
          )}

          {tab === "progress" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Progress Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.filter((s) => s.value !== "rejected").map((s) => (
                    <button key={s.value} onClick={() => setStatus(s.value)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold"
                      style={{
                        background: status === s.value ? `${s.color}22` : "var(--bg-overlay)",
                        border: `1px solid ${status === s.value ? s.color : "var(--border-default)"}`,
                        color: status === s.value ? s.color : "var(--text-secondary)",
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {status === "in_progress" && (
                <div className="rounded-lg p-3"
                  style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.25)" }}>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#fb923c" }}>
                    Percent Complete
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PROGRESS_PERCENTS.map((p) => (
                      <button key={p} onClick={() => setProgressPercent(p)}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold"
                        style={{
                          background: progressPercent === p ? "rgba(251,146,60,0.18)" : "var(--bg-overlay)",
                          border: `1px solid ${progressPercent === p ? "#fb923c" : "var(--border-default)"}`,
                          color: progressPercent === p ? "#fb923c" : "var(--text-secondary)",
                          minWidth: 56,
                        }}>
                        {p}%
                      </button>
                    ))}
                  </div>
                  {typeof progressPercent === "number" && (
                    <div className="mt-2.5 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-overlay)" }}>
                      <div style={{
                        width: `${progressPercent}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #fb923c 0%, #FEDD00 100%)",
                        transition: "width 0.2s ease",
                      }} />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Progress Notes
                </label>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  placeholder="Update on what's been done so far..." />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={close}
                  className="px-3 py-1.5 rounded text-xs font-semibold"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                  Cancel
                </button>
                <button onClick={handleSaveProgress} disabled={saving}
                  className="px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  style={{ background: "#FEDD00", color: "#043673" }}>
                  <Save size={12} /> {saving ? "Saving..." : "Save Progress"}
                </button>
              </div>
            </div>
          )}

          {tab === "reject" && (
            <div className="space-y-4">
              <div className="rounded-lg p-3 text-xs flex items-start gap-2"
                style={{ background: "rgba(255,77,79,0.08)", border: "1px solid rgba(255,77,79,0.25)", color: "#ffb3b3" }}>
                <AlertTriangle size={14} style={{ color: "#ff4d4f", flexShrink: 0, marginTop: 1 }} />
                <span>Rejecting will mark this request closed. The reason will be saved on the request.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Reason for Rejection *
                </label>
                <select style={inputStyle} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}>
                  <option value="" style={optionStyle}>— Select a reason —</option>
                  {REJECTION_REASONS.map((r) => (
                    <option key={r.value} value={r.value} style={optionStyle}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Additional Details / Personalized Message
                </label>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                  value={rejectionDetails}
                  onChange={(e) => setRejectionDetails(e.target.value)}
                  placeholder="Add a personalized message to the requester..." />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={close}
                  className="px-3 py-1.5 rounded text-xs font-semibold"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                  Cancel
                </button>
                <button onClick={handleReject} disabled={saving}
                  className="px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  style={{ background: "#ff4d4f", color: "#fff" }}>
                  <XCircle size={12} /> {saving ? "Rejecting..." : "Reject Request"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailsTab({ request }) {
  const Row = ({ icon: Icon, label, value }) => (
    <div className="flex gap-3 items-start">
      <Icon size={13} style={{ color: "var(--text-muted)", marginTop: 2, flexShrink: 0 }} />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.06em", fontSize: 10 }}>
          {label}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-primary)" }}>
          {value || <span style={{ color: "var(--text-muted)" }}>—</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Row icon={Tag} label="Type" value={request.request_type?.replace(/_/g, " ")} />
        <Row icon={AlertTriangle} label="Urgency" value={request.urgency} />
        <Row icon={Building2} label="Department" value={request.department} />
        <Row icon={UserCheck} label="Assigned To" value={request.assigned_to_user_name} />
        <Row icon={Mail} label="Requester" value={`${request.contact_person_name} <${request.contact_person_email}>`} />
        <Row icon={Calendar} label="Required By" value={request.required_completion_date} />
      </div>

      <div>
        <div className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--text-muted)", fontSize: 10, letterSpacing: "0.06em" }}>
          Description
        </div>
        <div className="text-xs whitespace-pre-wrap rounded p-3"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
          {request.description}
        </div>
      </div>

      {request.objective && (
        <div>
          <div className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--text-muted)", fontSize: 10, letterSpacing: "0.06em" }}>
            Objective
          </div>
          <div className="text-xs whitespace-pre-wrap rounded p-3"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
            {request.objective}
          </div>
        </div>
      )}

      {request.progress_notes && (
        <div>
          <div className="text-xs font-semibold uppercase mb-1" style={{ color: "#FEDD00", fontSize: 10, letterSpacing: "0.06em" }}>
            Latest Progress
          </div>
          <div className="text-xs whitespace-pre-wrap rounded p-3"
            style={{ background: "rgba(254,221,0,0.06)", border: "1px solid rgba(254,221,0,0.2)", color: "var(--text-primary)" }}>
            {request.progress_notes}
          </div>
        </div>
      )}

      {request.current_status === "rejected" && (
        <div>
          <div className="text-xs font-semibold uppercase mb-1" style={{ color: "#ff4d4f", fontSize: 10, letterSpacing: "0.06em" }}>
            Rejection
          </div>
          <div className="text-xs rounded p-3 space-y-1"
            style={{ background: "rgba(255,77,79,0.08)", border: "1px solid rgba(255,77,79,0.25)", color: "var(--text-primary)" }}>
            <div><strong>Reason:</strong> {request.rejection_reason?.replace(/_/g, " ")}</div>
            {request.rejection_details && <div><strong>Details:</strong> {request.rejection_details}</div>}
            {request.rejected_by_name && <div style={{ color: "var(--text-muted)" }}>By {request.rejected_by_name} on {new Date(request.rejected_date).toLocaleDateString("en-CA")}</div>}
          </div>
        </div>
      )}
    </div>
  );
}