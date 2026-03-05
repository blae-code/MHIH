import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquarePlus, X, Star, Send, ChevronUp, ChevronDown, CheckCircle } from "lucide-react";

export default function FloatingFeedbackButton({ user, currentPage }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("menu"); // menu | rate | suggest | bug
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setMode("menu");
    setRating(0);
    setHoverRating(0);
    setMessage("");
    setSubmitted(false);
  };

  const handleClose = () => { setOpen(false); setTimeout(reset, 300); };

  const handleSubmit = async () => {
    const typeMap = { rate: "experience", suggest: "suggestion", bug: "bug" };
    const titleMap = {
      rate: `Page Rating: ${rating}★ — ${currentPage}`,
      suggest: `Feature Suggestion — ${currentPage}`,
      bug: `Bug Report — ${currentPage}`,
    };
    setSubmitting(true);
    await base44.entities.Feedback.create({
      type: typeMap[mode],
      title: titleMap[mode],
      message: message || `User rated this page ${rating}/5`,
      rating: mode === "rate" ? rating : null,
      user_email: user?.email || "Anonymous",
      user_name: user?.full_name || "Anonymous",
      page: currentPage || "Unknown",
      status: "new",
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => { handleClose(); }, 2200);
  };

  const canSubmit = mode === "rate" ? rating > 0 : message.trim().length > 0;

  const ratingLabels = ["Terrible", "Poor", "Okay", "Good", "Excellent"];
  const displayRating = hoverRating || rating;

  return (
    <div style={{ position: "fixed", bottom: 40, right: 16, zIndex: 9990 }}>
      {/* Panel */}
      {open && (
        <div
          className="mb-2 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: 300,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(254,221,0,0.08)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: "linear-gradient(135deg, rgba(254,221,0,0.07) 0%, rgba(64,196,255,0.04) 100%)", borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-2">
              <MessageSquarePlus size={14} style={{ color: "var(--mnbc-yellow)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.04em" }}>
                {mode === "menu" ? "Quick Feedback" : mode === "rate" ? "Rate This Page" : mode === "suggest" ? "Suggest a Feature" : "Report a Bug"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {mode !== "menu" && !submitted && (
                <button onClick={() => setMode("menu")} className="p-1 rounded-lg transition"
                  style={{ color: "var(--text-muted)" }}
                  onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <ChevronUp size={13} />
                </button>
              )}
              <button onClick={handleClose} className="p-1 rounded-lg transition"
                style={{ color: "var(--text-muted)" }}
                onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                <X size={13} />
              </button>
            </div>
          </div>

          <div className="p-4">
            {submitted ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle size={32} style={{ color: "#2ea043" }} />
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Thanks for your feedback!</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>Your input helps us improve MHIP.</div>
              </div>
            ) : mode === "menu" ? (
              <div className="space-y-2">
                <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  Currently on: <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>{currentPage}</span>
                </div>
                {[
                  { id: "rate", emoji: "⭐", label: "Rate this page", desc: "How useful is this page?", color: "#FEDD00" },
                  { id: "suggest", emoji: "💡", label: "Suggest a feature", desc: "Share an idea for improvement", color: "#40c4ff" },
                  { id: "bug", emoji: "🐛", label: "Report a bug", desc: "Something not working right?", color: "#ff6b6b" },
                ].map(item => (
                  <button key={item.id} onClick={() => setMode(item.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = item.color + "66"; e.currentTarget.style.background = item.color + "0d"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.background = "var(--bg-overlay)"; }}>
                    <span className="text-lg">{item.emoji}</span>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {mode === "rate" && (
                  <div>
                    <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>How would you rate <strong style={{ color: "var(--text-secondary)" }}>{currentPage}</strong>?</div>
                    <div className="flex items-center justify-center gap-1.5 py-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s}
                          onClick={() => setRating(s)}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-all"
                          style={{ fontSize: 26, transform: displayRating >= s ? "scale(1.15)" : "scale(1)", filter: displayRating >= s ? "drop-shadow(0 0 4px rgba(254,221,0,0.6))" : "none" }}>
                          {displayRating >= s ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                    {displayRating > 0 && (
                      <div className="text-center text-xs font-semibold mt-1" style={{ color: "var(--accent-primary)" }}>
                        {ratingLabels[displayRating - 1]}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
                    {mode === "rate" ? "Any comments? (optional)" : "Describe in detail"}
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    placeholder={mode === "suggest" ? "What feature would make MHIP better?" : mode === "bug" ? "What happened? What did you expect?" : "Your thoughts..."}
                    className="w-full px-3 py-2 text-xs rounded-lg outline-none resize-none"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)", lineHeight: 1.5 }}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !canSubmit}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a" }}>
                  {submitting ? "Sending..." : <><Send size={11} /> Send Feedback</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB trigger */}
      <button
        onClick={() => { setOpen(o => !o); if (open) reset(); }}
        className="flex items-center gap-2 rounded-full font-semibold transition-all"
        style={{
          background: open ? "var(--bg-elevated)" : "linear-gradient(135deg, #FEDD00 0%, #e6c800 100%)",
          color: open ? "var(--text-secondary)" : "#04245a",
          border: open ? "1px solid var(--border-default)" : "none",
          padding: open ? "8px 14px" : "10px 16px",
          fontSize: 12,
          boxShadow: open ? "none" : "0 4px 20px rgba(254,221,0,0.4), 0 2px 8px rgba(0,0,0,0.3)",
        }}>
        {open ? <><X size={13} /><span>Close</span></> : <><MessageSquarePlus size={14} /><span>Feedback</span></>}
      </button>
    </div>
  );
}