import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, MessageSquare, Trash2, Pencil, X, Check, Reply, ChevronDown, ChevronRight } from "lucide-react";

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

function formatTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function initials(name = "", email = "") {
  const src = (name || email || "?").trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default function PolicyRequestComments({ policyRequestId }) {
  const [me, setMe] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyTo, setReplyTo] = useState(null); // { id, name, snippet }
  const [collapsed, setCollapsed] = useState({}); // { [commentId]: true }
  const listEndRef = useRef(null);

  const toggleCollapse = (id) => {
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  };
  const composerRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.PolicyComment.filter(
        { policy_request_id: policyRequestId },
        "created_date",
        500
      );
      setComments(list || []);
    } catch (e) {
      setError(e?.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (policyRequestId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyRequestId]);

  useEffect(() => {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [comments.length]);

  const handleSubmit = async () => {
    const body = text.trim();
    if (!body) return;
    setSubmitting(true);
    setError(null);
    try {
      await base44.entities.PolicyComment.create({
        policy_request_id: policyRequestId,
        parent_comment_id: replyTo?.id || "",
        author_name: me?.full_name || me?.email || "Unknown",
        author_email: me?.email || "",
        content: body,
      });
      setText("");
      setReplyTo(null);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartReply = (c) => {
    const name = c.author_name || c.author_email || "Unknown";
    const snippet = (c.content || "").replace(/\n/g, " ").slice(0, 80);
    // Nest replies one level deep — replying to a reply attaches to its root parent.
    const rootId = c.parent_comment_id || c.id;
    setReplyTo({ id: rootId, name, snippet });
    setTimeout(() => composerRef.current?.focus(), 0);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.PolicyComment.delete(id);
      setComments((cs) => cs.filter((c) => c.id !== id));
    } catch (e) {
      setError(e?.message || "Failed to delete comment");
    }
  };

  const handleStartEdit = (c) => {
    setEditingId(c.id);
    setEditText(c.content || "");
  };

  const handleSaveEdit = async (id) => {
    const body = editText.trim();
    if (!body) return;
    try {
      await base44.entities.PolicyComment.update(id, { content: body, edited: true });
      setEditingId(null);
      setEditText("");
      await load();
    } catch (e) {
      setError(e?.message || "Failed to update comment");
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: 300 }}>
      {error && (
        <div className="mb-3 rounded-lg p-2 text-xs"
          style={{ background: "rgba(255,77,79,0.1)", border: "1px solid rgba(255,77,79,0.3)", color: "#ff4d4f" }}>
          {error}
        </div>
      )}

      {/* Thread */}
      <div className="flex-1 space-y-3 mb-3" style={{ maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
        {loading ? (
          <div className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>
            Loading comments…
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-lg py-8 text-center"
            style={{ background: "var(--bg-overlay)", border: "1px dashed var(--border-default)" }}>
            <MessageSquare size={20} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              No comments yet. Start the discussion below.
            </div>
          </div>
        ) : (
          (() => {
            const topLevel = comments.filter((c) => !c.parent_comment_id);
            const repliesByParent = comments.reduce((acc, c) => {
              if (c.parent_comment_id) {
                (acc[c.parent_comment_id] ||= []).push(c);
              }
              return acc;
            }, {});
            return topLevel.map((c) => {
              const replies = repliesByParent[c.id] || [];
              const isCollapsed = !!collapsed[c.id];
              return (
                <div key={c.id}>
                  <CommentItem
                    comment={c}
                    me={me}
                    editingId={editingId}
                    editText={editText}
                    setEditText={setEditText}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => { setEditingId(null); setEditText(""); }}
                    onDelete={handleDelete}
                    onReply={handleStartReply}
                    replyCount={replies.length}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={() => toggleCollapse(c.id)}
                  />
                  {replies.length > 0 && !isCollapsed && (
                    <div className="mt-2 space-y-2"
                      style={{ marginLeft: 30, paddingLeft: 12, borderLeft: "2px solid rgba(254,221,0,0.25)" }}>
                      {replies.map((r) => (
                        <CommentItem
                          key={r.id}
                          comment={r}
                          me={me}
                          editingId={editingId}
                          editText={editText}
                          setEditText={setEditText}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={() => { setEditingId(null); setEditText(""); }}
                          onDelete={handleDelete}
                          onReply={handleStartReply}
                          isReply
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })()
        )}
        <div ref={listEndRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 rounded-lg p-2.5"
        style={{
          background: "rgba(254,221,0,0.04)",
          border: "1.5px solid #FEDD00",
          boxShadow: "0 0 0 3px rgba(254,221,0,0.08)",
        }}>
        {replyTo && (
          <div className="flex items-start gap-2 rounded-md mb-1.5 p-1.5"
            style={{ background: "rgba(254,221,0,0.08)", border: "1px solid rgba(254,221,0,0.3)" }}>
            <Reply size={11} style={{ color: "#FEDD00", marginTop: 2, flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold" style={{ color: "#FEDD00", fontSize: 10.5 }}>
                Replying to {replyTo.name}
              </div>
              <div className="text-xs truncate" style={{ color: "var(--text-muted)", fontSize: 10.5 }}>
                {replyTo.snippet}
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} className="activity-icon"
              style={{ width: 18, height: 18 }} title="Cancel reply">
              <X size={10} />
            </button>
          </div>
        )}
        <textarea
          ref={composerRef}
          style={{ ...inputStyle, minHeight: 60, resize: "vertical", border: "none", background: "transparent", padding: 4 }}
          placeholder={replyTo ? `Reply to ${replyTo.name}…` : "Write a comment… (⌘/Ctrl + Enter to post)"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="flex justify-between items-center mt-1.5">
          <span className="text-xs" style={{ color: "var(--text-muted)", fontSize: 10.5 }}>
            Posting as {me?.full_name || me?.email || "…"}
          </span>
          <button onClick={handleSubmit} disabled={submitting || !text.trim()}
            className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: "#FEDD00", color: "#043673" }}>
            <Send size={11} /> {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment: c, me, editingId, editText, setEditText,
  onStartEdit, onSaveEdit, onCancelEdit, onDelete, onReply, isReply,
  replyCount = 0, isCollapsed = false, onToggleCollapse,
}) {
  const isMine = me?.email && c.author_email === me.email;
  const isEditing = editingId === c.id;
  const avatarSize = isReply ? 24 : 30;
  const canCollapse = !isReply && !!onToggleCollapse;
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  return (
    <div className="flex gap-2.5">
      {canCollapse ? (
        <button
          onClick={onToggleCollapse}
          className="shrink-0 flex items-center justify-center rounded-full transition-colors"
          title={isCollapsed ? "Expand thread" : "Collapse thread"}
          style={{
            width: avatarSize, height: avatarSize,
            background: isMine ? "rgba(254,221,0,0.15)" : "var(--bg-overlay)",
            color: isMine ? "#FEDD00" : "var(--text-secondary)",
            border: `1px solid ${isMine ? "rgba(254,221,0,0.35)" : "var(--border-default)"}`,
            position: "relative",
          }}>
          {isCollapsed
            ? <ChevronRight size={13} />
            : <span style={{ fontSize: 11, fontWeight: 700 }}>{initials(c.author_name, c.author_email)}</span>}
          {replyCount > 0 && isCollapsed && (
            <span style={{
              position: "absolute", bottom: -4, right: -4,
              background: "#FEDD00", color: "#043673",
              fontSize: 9, fontWeight: 700,
              minWidth: 14, height: 14, padding: "0 3px",
              borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid var(--bg-elevated)",
            }}>{replyCount}</span>
          )}
        </button>
      ) : (
        <div
          className="shrink-0 rounded-full flex items-center justify-center font-bold"
          style={{
            width: avatarSize, height: avatarSize, fontSize: isReply ? 9.5 : 11,
            background: isMine ? "rgba(254,221,0,0.15)" : "var(--bg-overlay)",
            color: isMine ? "#FEDD00" : "var(--text-secondary)",
            border: `1px solid ${isMine ? "rgba(254,221,0,0.35)" : "var(--border-default)"}`,
          }}>
          {initials(c.author_name, c.author_email)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            {c.author_name || c.author_email || "Unknown"}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)", fontSize: 10.5 }}>
            {formatTimestamp(c.created_date)}
            {c.edited && " · edited"}
            {canCollapse && replyCount > 0 && (
              <> · {replyCount} {replyCount === 1 ? "reply" : "replies"}</>
            )}
          </span>
          {!isEditing && (
            <span className="ml-auto flex items-center gap-1">
              {canCollapse && (
                <button onClick={onToggleCollapse} className="activity-icon"
                  style={{ width: 22, height: 22 }}
                  title={isCollapsed ? "Expand" : "Collapse"}>
                  {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                </button>
              )}
              <button onClick={() => onReply(c)} className="activity-icon"
                style={{ width: 22, height: 22 }} title="Reply">
                <Reply size={10} />
              </button>
              {isMine && !confirmDelete && (
                <>
                  <button onClick={() => onStartEdit(c)} className="activity-icon"
                    style={{ width: 22, height: 22 }} title="Edit">
                    <Pencil size={10} />
                  </button>
                  <button onClick={() => setConfirmDelete(true)} className="activity-icon"
                    style={{ width: 22, height: 22, color: "#ff4d4f" }} title="Delete">
                    <Trash2 size={10} />
                  </button>
                </>
              )}
              {isMine && confirmDelete && (
                <>
                  <span className="text-xs font-semibold" style={{ color: "#ff4d4f", fontSize: 10.5 }}>
                    Delete?
                  </span>
                  <button onClick={() => { setConfirmDelete(false); onDelete(c.id); }}
                    className="px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1"
                    style={{ background: "#ff4d4f", color: "#fff", fontSize: 10.5 }}
                    title="Confirm delete">
                    <Trash2 size={10} /> Yes
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", fontSize: 10.5 }}
                    title="Cancel">
                    No
                  </button>
                </>
              )}
            </span>
          )}
        </div>
        {isEditing ? (
          <div className="mt-1.5">
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-1.5 mt-1.5">
              <button onClick={onCancelEdit}
                className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                <X size={11} /> Cancel
              </button>
              <button onClick={() => onSaveEdit(c.id)}
                className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1"
                style={{ background: "#FEDD00", color: "#043673" }}>
                <Check size={11} /> Save
              </button>
            </div>
          </div>
        ) : isCollapsed ? (
          <button onClick={onToggleCollapse}
            className="text-xs truncate text-left rounded-md mt-1 px-2.5 py-1.5 w-full"
            style={{
              background: "var(--bg-overlay)",
              border: "1px dashed var(--border-default)",
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
            title="Click to expand">
            {(c.content || "").replace(/\n/g, " ").slice(0, 100)}{(c.content || "").length > 100 ? "…" : ""}
          </button>
        ) : (
          <div className="text-xs whitespace-pre-wrap rounded-md mt-1 p-2.5"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              lineHeight: 1.5,
            }}>
            {c.content}
          </div>
        )}
      </div>
    </div>
  );
}