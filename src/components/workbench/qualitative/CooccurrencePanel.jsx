/**
 * CooccurrencePanel — which top keywords appear together in the same
 * response, revealing connected concepts in qualitative material.
 */

import React, { useMemo } from "react";
import { Link2 } from "lucide-react";
import { cooccurrencePairs } from "@/lib/textStats";

export default function CooccurrencePanel({ values }) {
  const pairs = useMemo(() => cooccurrencePairs(values, 15), [values]);
  const max = pairs[0]?.count ?? 1;

  if (!pairs.length) {
    return (
      <div className="text-xs py-8 text-center" style={{ color: "var(--text-muted)" }}>
        Not enough shared keywords across responses to map co-occurrences.
      </div>
    );
  }

  return (
    <div className="depth-card p-3.5">
      <div className="dashboard-section-label">Keyword Co-occurrence — Connected Concepts</div>
      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
        Pairs of top keywords that appear together within the same response — a signal of linked ideas, places, or practices.
      </p>
      <div className="space-y-1.5">
        {pairs.map((p, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 shrink-0 text-xs" style={{ width: 220, color: "var(--text-primary)" }}>
              <span className="font-semibold truncate">{p.a}</span>
              <Link2 size={10} style={{ color: "#40c4ff", flexShrink: 0 }} />
              <span className="font-semibold truncate">{p.b}</span>
            </span>
            <div className="flex-1 h-2 rounded-full" style={{ background: "var(--bg-hover)" }}>
              <div className="h-full rounded-full" style={{
                width: `${(p.count / max) * 100}%`,
                background: "linear-gradient(90deg, rgba(64,196,255,0.45), rgba(64,196,255,0.9))",
              }} />
            </div>
            <span className="tabular-nums text-xs shrink-0" style={{ color: "var(--text-secondary)", width: 70, textAlign: "right" }}>
              {p.count} response{p.count === 1 ? "" : "s"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}