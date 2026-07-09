/**
 * ExcerptExplorer — searchable browser of qualitative responses (oral
 * histories, open text) with keyword highlighting and load-more paging.
 */

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

function Highlighted({ text, query }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} style={{ background: "rgba(254,221,0,0.25)", color: "#FEDD00", borderRadius: 2, padding: "0 1px" }}>{p}</mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export default function ExcerptExplorer({ values }) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(25);

  const excerpts = useMemo(() => {
    const nonEmpty = values
      .map((v, i) => ({ i, text: String(v ?? "").trim() }))
      .filter((e) => e.text);
    if (!query.trim()) return nonEmpty;
    const q = query.trim().toLowerCase();
    return nonEmpty.filter((e) => e.text.toLowerCase().includes(q));
  }, [values, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShown(25); }}
          placeholder="Search excerpts — e.g. a place, person, practice, or phrase…"
          className="w-full rounded-md pl-8 pr-3 py-2 text-xs"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
        />
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
        {excerpts.length.toLocaleString()} matching excerpt{excerpts.length === 1 ? "" : "s"}
      </div>
      <div className="space-y-2">
        {excerpts.slice(0, shown).map((e) => (
          <div key={e.i} className="px-3 py-2.5 rounded-lg text-xs leading-relaxed"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <span className="tabular-nums mr-2 shrink-0" style={{ color: "var(--text-muted)", fontSize: 10 }}>#{e.i + 1}</span>
            <Highlighted text={e.text} query={query} />
          </div>
        ))}
      </div>
      {excerpts.length > shown && (
        <button onClick={() => setShown((s) => s + 50)}
          className="w-full py-2 rounded-md text-xs font-semibold transition-colors"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "#40c4ff" }}>
          Show more ({excerpts.length - shown} remaining)
        </button>
      )}
      {excerpts.length === 0 && (
        <div className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>No excerpts match your search.</div>
      )}
    </div>
  );
}