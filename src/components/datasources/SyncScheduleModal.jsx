import React, { useState } from "react";
import { X, Clock, Save } from "lucide-react";

const FREQ_OPTIONS = [
  { value: "manual", label: "Manual only" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function SyncScheduleModal({ source, onSave, onClose }) {
  const [freq, setFreq] = useState(source.sync_frequency || "manual");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-sm rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: "var(--accent-primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Schedule Sync</span>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 24, height: 24 }}><X size={13} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              Set automated sync frequency for <strong style={{ color: "var(--text-primary)" }}>{source.name}</strong>.
              The system will automatically pull from the configured endpoint on schedule.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FREQ_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setFreq(opt.value)}
                  className="px-3 py-2.5 rounded-md text-xs font-medium text-left"
                  style={{
                    background: freq === opt.value ? "var(--accent-muted)" : "var(--bg-overlay)",
                    border: `1px solid ${freq === opt.value ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                    color: freq === opt.value ? "var(--accent-primary)" : "var(--text-secondary)",
                  }}>
                  {opt.label}
                  {opt.value !== "manual" && (
                    <div className="text-xs mt-0.5 font-normal" style={{ color: "var(--text-muted)", opacity: 0.8 }}>
                      {opt.value === "daily" ? "Every 24 hrs" : opt.value === "weekly" ? "Every 7 days" : "Every 30 days"}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          {freq !== "manual" && (
            <div className="p-3 rounded-md text-xs" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)", color: "var(--accent-primary)" }}>
              Automated syncs run at midnight UTC. Failed syncs will appear in the Sync Logs tab and update the source status.
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-3 py-1.5 rounded-md text-xs"
              style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
              Cancel
            </button>
            <button onClick={() => onSave(freq)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: "var(--accent-primary)", color: "#000" }}>
              <Save size={11} /> Save Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}