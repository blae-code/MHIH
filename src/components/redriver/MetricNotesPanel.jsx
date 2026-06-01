/**
 * MetricNotesPanel — sticky-note style comments for a single health metric.
 *
 * Lets policy team members leave quick notes (policy context, caveats,
 * "watch this" reminders) directly on a metric so the whole team sees
 * the conversation when they look at the same metric.
 *
 * Storage: reuses the existing `Annotation` entity with
 *   target_type = "metric"
 *   target_id   = the metric_id (canonical) or HealthMetric record id
 *
 * Rendered inside a right-side slide-in drawer.
 */

import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  X, StickyNote, Send, Trash2, Check, CircleDot, Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Cycle through warm sticky-note tones so the wall feels like a corkboard
const STICKY_TONES = [
  { bg: "rgba(254,221,0,0.10)",  border: "rgba(254,221,0,0.35)",  tab: "#FEDD00" },
  { bg: "rgba(64,196,255,0.10)", border: "rgba(64,196,255,0.35)", tab: "#40c4ff" },
  { bg: "rgba(255,171,64,0.10)", border: "rgba(255,171,64,0.35)", tab: "#ffab40" },
  { bg: "rgba(0,230,118,0.10)",  border: "rgba(0,230,118,0.35)",  tab: "#00e676" },
  { bg: "rgba(244,114,182,0.10)",border: "rgba(244,114,182,0.35)",tab: "#f472b6" },
];
const toneFor = (i) => STICKY_TONES[i % STICKY_TONES.length];

export default function MetricNotesPanel({ metric, currentUser, onClose }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const targetId = metric?.metric_id || metric?.id;
  const targetLabel = metric?.name || "Metric";

  const load = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await base44.entities.Annotation.filter(
        { target_id: targetId, target_type: "metric" },
        "-created_date",
        100,
      );
      setNotes(res || []);
    } catch (e) {
      console.warn("MetricNotesPanel: failed to load notes", e?.message);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => { load(); }, [load]);

  const handlePost = async () => {
    const content = text.trim();
    if (!content || !targetId) return;
    setPosting(true);
    try {
      await base44.entities.Annotation.create({
        target_id: targetId,
        target_type: "metric",
        content,
        author_name: currentUser?.full_name || currentUser?.email || "Anonymous",
        author_email: currentUser?.email || "",
        resolved: false,
      });
      setText("");
      await load();
    } catch (e) {
      console.warn("MetricNotesPanel: failed to post note", e?.message);
    } finally {
      setPosting(false);
    }
  };

  const handleToggleResolved = async (note) => {
    try {
      await base44.entities.Annotation.update(note.id, { resolved: !note.resolved });
      await load();
    } catch (e) {
      console.warn("MetricNotesPanel: failed to toggle resolved", e?.message);
    }
  };

  const handleDelete = async (note) => {
    if (!confirm("Delete this note?")) return;
    try {
      await base44.entities.Annotation.delete(note.id);
      await load();
    } catch (e) {
      console.warn("MetricNotesPanel: failed to delete note", e?.message);
    }
  };

  return (
    <>
      <style>{`
        @keyframes notes-slide-in {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .notes-backdrop {
          position: fixed; inset: 0; z-index: 60;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(2px);
          animation: notes-fade 0.15s ease-out;
        }
        @keyframes notes-fade { from { opacity: 0 } to { opacity: 1 } }
        .notes-drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: 100%; max-width: 460px; z-index: 61;
          background: var(--bg-surface);
          border-left: 1px solid var(--border-default);
          box-shadow: -12px 0 40px rgba(0,0,0,0.55);
          display: flex; flex-direction: column;
          animation: notes-slide-in 0.18s ease-out;
        }
        .sticky-note {
          position: relative;
          border-radius: 8px;
          padding: 10px 12px 12px 12px;
          margin-bottom: 10px;
          line-height: 1.4;
          font-size: 12.5px;
        }
        .sticky-note-tab {
          position: absolute; top: -1px; left: 12px;
          width: 22px; height: 4px; border-radius: 0 0 3px 3px;
        }
      `}</style>

      <div className="notes-backdrop" onClick={onClose} />
      <aside className="notes-drawer">
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}
        >
          <StickyNote size={15} style={{ color: "#FEDD00" }} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>
              Team Notes
            </div>
            <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {targetLabel}
            </div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
            <X size={13} />
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={12} className="animate-spin" /> Loading notes…
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-10">
              <StickyNote size={28} style={{ color: "var(--text-muted)", opacity: 0.4, margin: "0 auto 10px" }} />
              <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                No notes yet
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Be the first to share policy context on this metric.
              </div>
            </div>
          ) : (
            notes.map((n, i) => {
              const tone = toneFor(i);
              const isMine = currentUser?.email && n.author_email === currentUser.email;
              const when = n.created_date
                ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true })
                : "";
              return (
                <div
                  key={n.id}
                  className="sticky-note"
                  style={{
                    background: tone.bg,
                    border: `1px solid ${tone.border}`,
                    opacity: n.resolved ? 0.55 : 1,
                  }}
                >
                  <span className="sticky-note-tab" style={{ background: tone.tab }} />
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                        {n.author_name || n.author_email || "Anonymous"}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)", fontSize: 10.5 }}>
                        {when}
                        {n.resolved && (
                          <span className="ml-2 inline-flex items-center gap-0.5" style={{ color: tone.tab }}>
                            <Check size={9} /> resolved
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => handleToggleResolved(n)}
                        className="activity-icon"
                        style={{ width: 22, height: 22 }}
                        title={n.resolved ? "Reopen" : "Mark resolved"}
                      >
                        {n.resolved ? <CircleDot size={11} /> : <Check size={11} />}
                      </button>
                      {isMine && (
                        <button
                          onClick={() => handleDelete(n)}
                          className="activity-icon"
                          style={{ width: 22, height: 22, color: "#ff6b6b" }}
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {n.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        <div
          className="shrink-0 p-3"
          style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Leave a note for the team…"
            rows={3}
            className="w-full px-3 py-2 rounded-md text-sm resize-none"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              outline: "none",
              fontFamily: "inherit",
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handlePost();
              }
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs" style={{ color: "var(--text-muted)", fontSize: 10.5 }}>
              Ctrl+Enter to post
            </div>
            <button
              onClick={handlePost}
              disabled={!text.trim() || posting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                background: text.trim() && !posting ? "#FEDD00" : "var(--bg-hover)",
                color: text.trim() && !posting ? "#043673" : "var(--text-muted)",
                border: "none",
                cursor: text.trim() && !posting ? "pointer" : "not-allowed",
              }}
            >
              {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Post note
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}