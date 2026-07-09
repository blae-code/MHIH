/**
 * MethodologyNotice — collapsible disclosure showing which methodology /
 * best practice a workbench tool applies and exactly where data is
 * processed and stored.
 */

import React, { useState } from "react";
import { BookOpen, ChevronDown, ShieldCheck, ListChecks } from "lucide-react";
import { METHODOLOGIES, DATA_HANDLING_GLOBAL } from "@/components/workbench/methodologies";

export default function MethodologyNotice({ toolKey, showGlobal = false }) {
  const [open, setOpen] = useState(false);
  const m = METHODOLOGIES[toolKey];
  if (!m) return null;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
        style={{ background: open ? "var(--bg-hover)" : "transparent" }}
      >
        <BookOpen size={11} style={{ color: "#40c4ff" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
          Methodology & Data Handling
        </span>
        <span className="tag" style={{ fontSize: 9 }}>{m.title}</span>
        <div className="flex-1" />
        <ChevronDown size={11} style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p className="text-xs leading-relaxed pt-2.5" style={{ color: "var(--text-secondary)" }}>{m.method}</p>

          {m.steps?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                <ListChecks size={10} /> How it's applied
              </div>
              <ul className="space-y-1">
                {m.steps.map((s, i) => (
                  <li key={i} className="text-xs leading-relaxed flex gap-1.5" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "#40c4ff" }}>·</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#00e676" }}>
              <ShieldCheck size={10} /> Where your data goes
            </div>
            <ul className="space-y-1">
              {[...m.dataHandling, ...(showGlobal ? DATA_HANDLING_GLOBAL : [])].map((s, i) => (
                <li key={i} className="text-xs leading-relaxed flex gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "#00e676" }}>·</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}