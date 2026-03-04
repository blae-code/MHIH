import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Clock } from "lucide-react";

export default function ScheduleReportModal({ isOpen, onClose, reportConfig, onConfigCreated }) {
  const [title, setTitle] = useState(reportConfig?.title || "");
  const [schedule, setSchedule] = useState(reportConfig?.schedule || "weekly");
  const [recipients, setRecipients] = useState(reportConfig?.recipients?.join(", ") || "");
  const [formats, setFormats] = useState(reportConfig?.export_formats || ["pdf"]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !recipients.trim()) {
      alert("Please enter a title and at least one recipient");
      return;
    }

    setSubmitting(true);
    try {
      const config = await base44.entities.ReportConfig.create({
        title,
        schedule,
        recipients: recipients.split(",").map(e => e.trim()),
        export_formats: formats,
        status: "active"
      });
      onConfigCreated(config);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to create schedule:", error);
      alert("Failed to create schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSchedule("weekly");
    setRecipients("");
    setFormats(["pdf"]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-[var(--bg-surface)] rounded-2xl overflow-hidden w-full max-w-md shadow-2xl border border-[var(--border-default)]"
        onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Clock size={18} style={{ color: "var(--accent-primary)" }} />
            Schedule Report
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-overlay)] rounded-lg">
            <X size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-2 uppercase" style={{ color: "var(--text-muted)" }}>Report Name</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Weekly Health Summary"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-2 uppercase" style={{ color: "var(--text-muted)" }}>Frequency</label>
            <select
              value={schedule}
              onChange={e => setSchedule(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-2 uppercase" style={{ color: "var(--text-muted)" }}>Recipients (comma-separated)</label>
            <input
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
              placeholder="user1@example.com, user2@example.com"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-2 uppercase" style={{ color: "var(--text-muted)" }}>Export Formats</label>
            <div className="flex gap-2">
              {["pdf", "csv"].map(f => (
                <button key={f} onClick={() => setFormats(prev => 
                  prev.includes(f) ? prev.filter(fmt => fmt !== f) : [...prev, f]
                )}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all uppercase"
                  style={{
                    background: formats.includes(f) ? "rgba(254,221,0,0.12)" : "var(--bg-overlay)",
                    color: formats.includes(f) ? "var(--accent-primary)" : "var(--text-secondary)",
                    border: `1px solid ${formats.includes(f) ? "var(--accent-primary)" : "var(--border-default)"}`
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a" }}>
            {submitting ? "Creating..." : "Create Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}