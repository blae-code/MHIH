/**
 * CommentsPanel — right side-panel for team comments and feedback,
 * scoped to the current page and optionally anchored to a specific
 * chart or workbench session. Live-updates via realtime subscription.
 */

import React, { useEffect, useMemo, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  X, MessageSquare, Send, CheckCircle2, Circle, Trash2, Anchor,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CommentsPanel({ page, user, focusTarget, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [onlyTarget, setOnlyTarget] = useState(!!focusTarget?.target_key);
  const inputRef = useRef(null);

  const load = async () => {
    const rows = await base44.entities.TeamComment.filter({ page }, "-created_date", 100).catch(() => []);
    setComments(rows);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
    const unsubscribe = base44.entities.TeamComment.subscribe(() => { load(); });
    return () => unsubscribe();
  }, [page]);

  useEffect(() => {
    setOnlyTarget(!!focusTarget?.target_key);
    inputRef.current?.focus();
  }, [focusTarget?.target_key]);

  const visible = useMemo(() => {
    if (onlyTarget && focusTarget?.target_key) {
      return comments.filter((c) => c.target_key === focusTarget.target_key);
    }
    return comments;
  }, [comments, onlyTarget, focusTarget?.target_key]);

  const submit = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    await base44.entities.TeamComment.create({
      page,
      content,
      target_key: focusTarget?.target_key || "",
      target_label: focusTarget?.target_label || "",
      author_name: user?.full_name || "",
      author_email: user?.email || "",
      resolved: false,
    }).catch(() => {});
    setDraft("");
    setSending(false);
    load();
  };

  const toggleResolved = async (c) => {
    await base44.entities.TeamComment.update(c.id, { resolved: !c.resolved }).catch(() => {});
    load();
  };

  const remove = async (c) => {
    await base44.entities.TeamComment.delete(c.id).catch(() => {});
    load();
  };

  const openCount = comments.filter((c) => !c.resolved).length;

  return (
    <aside
      className="fixed right-0 flex flex-col"
      style={{
        top: "var(--header-height)", bottom: 0, width: 340, zIndex: 8500,
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-default)",
        boxShadow: "-12px 0 40px rgba(0,0,0,0.55)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 shrink-0" style={{ height: 40, borderBottom: "1px solid var(--border-subtle)" }}>
        <MessageSquare size={13} style={{ color: "var(--mnbc-yellow)" }} />
        <div className="min-w-0 flex-1">
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
            Team Comments
          </div>
          <div className="truncate" style={{ fontSize: 9, color: "var(--text-muted)" }}>
            {page} · {openCount} open · live
          </div>
        </div>
        <button onClick={onClose} className="activity-icon" style={{ width: 24, height: 24 }}>
          <X size={12} />
        </button>
      </div>

      {/* Anchor filter */}
      {focusTarget?.target_key && (
        <div className="flex items-center gap-1.5 px-3 py-2 shrink-0 flex-wrap" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <Anchor size={10} style={{ color: "var(--color-info)" }} />
          <span className="truncate" style={{ fontSize: 10, color: "var(--text-secondary)", maxWidth: 170 }}>
            {focusTarget.target_label || focusTarget.target_key}
          </span>
          <div className="ml-auto flex rounded-md overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
            {[["This item", true], ["All page", false]].map(([label, val]) => (
              <button key={label} onClick={() => setOnlyTarget(val)}
                style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 7px",
                  background: onlyTarget === val ? "rgba(64,196,255,0.15)" : "var(--bg-overlay)",
                  color: onlyTarget === val ? "var(--color-info)" : "var(--text-muted)",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: 56, borderRadius: 8 }} />)
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: "var(--text-muted)" }}>
            <MessageSquare size={22} style={{ opacity: 0.35 }} />
            <span style={{ fontSize: 11 }}>No comments yet</span>
            <span style={{ fontSize: 9.5, opacity: 0.7 }}>Be the first to leave feedback</span>
          </div>
        ) : (
          visible.map((c) => {
            const mine = c.author_email === user?.email;
            const canModerate = mine || user?.role === "admin";
            return (
              <div key={c.id} className="rounded-lg p-2.5" style={{
                background: "var(--bg-elevated)",
                border: `1px solid ${c.resolved ? "rgba(0,230,118,0.25)" : "var(--border-subtle)"}`,
                opacity: c.resolved ? 0.75 : 1,
              }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-primary)" }}>
                    {c.author_name || c.author_email || "—"}
                  </span>
                  <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                    {c.created_date ? formatDistanceToNow(new Date(c.created_date), { addSuffix: true }) : ""}
                  </span>
                  <div className="ml-auto flex items-center gap-0.5">
                    {canModerate && (
                      <>
                        <button onClick={() => toggleResolved(c)} className="activity-icon" style={{ width: 20, height: 20 }}
                          title={c.resolved ? "Reopen" : "Mark resolved"}>
                          {c.resolved
                            ? <CheckCircle2 size={11} style={{ color: "#00e676" }} />
                            : <Circle size={11} style={{ color: "var(--text-muted)" }} />}
                        </button>
                        <button onClick={() => remove(c)} className="activity-icon" style={{ width: 20, height: 20, color: "var(--color-error)" }} title="Delete">
                          <Trash2 size={10} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {c.target_label && (
                  <div className="flex items-center gap-1 mb-1">
                    <Anchor size={8} style={{ color: "var(--color-info)" }} />
                    <span className="truncate" style={{ fontSize: 9, color: "var(--color-info)" }}>{c.target_label}</span>
                  </div>
                )}
                <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                  {c.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 p-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {focusTarget?.target_label && (
          <div className="flex items-center gap-1 mb-1.5">
            <Anchor size={9} style={{ color: "var(--color-info)" }} />
            <span className="truncate" style={{ fontSize: 9, color: "var(--text-muted)" }}>
              Commenting on: <span style={{ color: "var(--color-info)" }}>{focusTarget.target_label}</span>
            </span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Leave feedback… (Enter to send)"
            rows={2}
            className="flex-1 rounded-md px-2.5 py-2 outline-none resize-none"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontSize: 11.5,
            }}
          />
          <button
            onClick={submit}
            disabled={!draft.trim() || sending}
            className="flex items-center justify-center rounded-md shrink-0"
            style={{
              width: 32, height: 32,
              background: draft.trim() ? "var(--mnbc-yellow)" : "var(--bg-overlay)",
              color: draft.trim() ? "#043673" : "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
              opacity: sending ? 0.6 : 1,
            }}
            title="Send comment"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}