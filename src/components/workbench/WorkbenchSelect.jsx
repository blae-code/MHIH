/**
 * WorkbenchSelect — dark-themed labelled dropdown with a custom chevron
 * and readable dark option list, shared across workbench panels.
 */

import React from "react";
import { ChevronDown } from "lucide-react";

export default function WorkbenchSelect({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1" style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
      {label}
      <span className="relative inline-flex">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md pl-2.5 pr-7 py-1.5 text-xs font-medium transition-colors cursor-pointer"
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            background: "var(--bg-overlay)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 2px rgba(0,0,0,0.3)",
            minWidth: 130,
            letterSpacing: "normal",
            textTransform: "none",
            fontWeight: 500,
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(64,196,255,0.5)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border-default)")}
        >
          {options.map((o) => (
            <option key={o} value={o} style={{ background: "#131f33", color: "#f0f6ff" }}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--text-muted)" }}
        />
      </span>
    </label>
  );
}