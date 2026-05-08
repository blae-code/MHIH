import React, { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

/**
 * DateInputWithPicker
 * - Manual text entry (YYYY-MM-DD) — user can type freely.
 * - Calendar icon button opens a popover with a date picker.
 * - Selecting a date in the picker fills the text input.
 */
export default function DateInputWithPicker({ value, onChange, inputStyle, placeholder = "YYYY-MM-DD" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Parse "YYYY-MM-DD" → Date (local) for the calendar's selected state
  const selectedDate = (() => {
    if (!value) return undefined;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m) return undefined;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? undefined : d;
  })();

  // Format Date → "YYYY-MM-DD" (local, no tz drift)
  const formatLocal = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{4}-\d{2}-\d{2}"
          placeholder={placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open calendar"
          title="Pick a date"
          style={{
            padding: "0 12px",
            background: open ? "rgba(254,221,0,0.12)" : "var(--bg-overlay)",
            border: `1.5px solid ${open ? "#FEDD00" : "var(--border-default)"}`,
            borderRadius: 8,
            color: open ? "#FEDD00" : "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          <CalendarIcon size={15} />
        </button>
      </div>

      {open && (
        <div
          className="diwp-popover"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 50,
            background: "#0f1829",
            border: "1px solid var(--border-default)",
            borderRadius: 10,
            boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
            padding: 8,
          }}
        >
          <style>{`
            .diwp-popover { color: #f0f6ff; }
            .diwp-popover .rdp,
            .diwp-popover [class*="rdp"] { color: #f0f6ff; --rdp-accent-color: #FEDD00; }
            .diwp-popover button { color: #f0f6ff; }
            .diwp-popover button:hover:not([disabled]) {
              background: rgba(254,221,0,0.12) !important;
              color: #FEDD00 !important;
            }
            .diwp-popover [aria-selected="true"],
            .diwp-popover .rdp-day_selected,
            .diwp-popover .rdp-day_selected:hover {
              background: #FEDD00 !important;
              color: #043673 !important;
              font-weight: 700;
            }
            .diwp-popover .rdp-day_today:not([aria-selected="true"]) {
              color: #FEDD00 !important;
              font-weight: 700;
            }
            .diwp-popover .rdp-head_cell,
            .diwp-popover .rdp-caption_label,
            .diwp-popover .rdp-weekday {
              color: #8bafd4 !important;
              font-weight: 600;
            }
            .diwp-popover .rdp-day_outside,
            .diwp-popover .rdp-day_disabled {
              color: #4a6a8a !important;
              opacity: 0.5;
            }
          `}</style>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => {
              if (d) {
                onChange(formatLocal(d));
                setOpen(false);
              }
            }}
            initialFocus
          />
        </div>
      )}
    </div>
  );
}