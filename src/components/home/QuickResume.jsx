/**
 * QuickResume — "pick up where you left off" chips built from the
 * recent-pages trail recorded by the app shell in localStorage.
 */

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { History } from "lucide-react";

export const RECENT_PAGES_KEY = "rr_recent_pages";

function humanize(pageName) {
  return pageName.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

export default function QuickResume() {
  let recent = [];
  try {
    recent = JSON.parse(localStorage.getItem(RECENT_PAGES_KEY) || "[]").slice(0, 4);
  } catch { /* ignore */ }

  if (recent.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="flex items-center gap-1 shrink-0" style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "var(--text-muted)",
      }}>
        <History size={10} /> Resume
      </span>
      <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {recent.map((r) => (
          <Link
            key={r.page}
            to={createPageUrl(r.page)}
            className="shrink-0 px-2 py-0.5 rounded-full transition-colors"
            style={{
              fontSize: 10, fontWeight: 600,
              color: "var(--text-secondary)",
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(254,221,0,0.4)";
              e.currentTarget.style.color = "var(--mnbc-yellow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {humanize(r.page)}
          </Link>
        ))}
      </div>
    </div>
  );
}