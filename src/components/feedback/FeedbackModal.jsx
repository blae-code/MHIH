import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Send, CheckCircle, AlertCircle } from "lucide-react";

export default function FeedbackModal({ isOpen, onClose, user, currentPage }) {
  const [type, setType] = useState("suggestion");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert("Please enter your feedback");
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.Feedback.create({
        type,
        title: title || (type === "experience" ? `Experience Rating: ${rating}★` : `${type.charAt(0).toUpperCase() + type.slice(1)}`),
        message,
        rating: type === "experience" ? rating : null,
        user_email: user?.email || "Anonymous",
        user_name: user?.full_name || "Anonymous",
        page: currentPage || "Unknown",
        status: "new"
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        resetForm();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setType("suggestion");
    setTitle("");
    setMessage("");
    setRating(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-[var(--bg-surface)] rounded-2xl overflow-hidden w-full max-w-md shadow-2xl border border-[var(--border-default)]"
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]"
          style={{ background: "linear-gradient(135deg, rgba(254,221,0,0.05) 0%, rgba(64,196,255,0.03) 100%)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Send Feedback</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-overlay)] rounded-lg transition">
            <X size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle size={40} style={{ color: "#2ea043" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Thank you!</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Your feedback has been received and will help us improve the platform.</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            
            {/* Type Selection */}
            <div>
              <label className="text-xs font-semibold block mb-2 uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>Feedback Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "bug", label: "🐛 Bug", color: "#ff1744" },
                  { value: "suggestion", label: "💡 Suggestion", color: "#FEDD00" },
                  { value: "experience", label: "⭐ Experience", color: "#40c4ff" }
                ].map(t => (
                  <button key={t.value} onClick={() => setType(t.value)}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: type === t.value ? `${t.color}22` : "var(--bg-overlay)",
                      color: type === t.value ? t.color : "var(--text-secondary)",
                      border: `1px solid ${type === t.value ? `${t.color}66` : "var(--border-subtle)"}`
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold block mb-2 uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>Title (Optional)</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Brief summary..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Star Rating for Experience */}
            {type === "experience" && (
              <div>
                <label className="text-xs font-semibold block mb-2 uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>How would you rate your experience?</label>
                <div className="flex items-center gap-2 justify-center py-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setRating(star)}
                      className="text-3xl transition-transform hover:scale-110"
                      title={["Poor", "Fair", "Good", "Very Good", "Excellent"][star - 1]}>
                      {star <= rating ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-xs text-center mt-1" style={{ color: "var(--text-secondary)" }}>
                    {["Poor", "Fair", "Good", "Very Good", "Excellent"][rating - 1]}
                  </p>
                )}
              </div>
            )}

            {/* Message */}
            <div>
              <label className="text-xs font-semibold block mb-2 uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Please share your thoughts..."
                rows="4"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all resize-none"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Submit Button */}
            <button onClick={handleSubmit} disabled={submitting || !message.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a" }}>
              {submitting ? "Submitting..." : <>
                <Send size={14} />
                Submit Feedback
              </>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}