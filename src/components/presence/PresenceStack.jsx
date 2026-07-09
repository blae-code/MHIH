/**
 * PresenceStack — avatar pill showing who else is viewing this page.
 * Renders nothing when you're alone.
 */

import React from "react";
import { Eye } from "lucide-react";

const AVATAR_COLORS = ["#40c4ff", "#00e676", "#ffab40", "#FEDD00", "#ff7ab8", "#b388ff"];

function colorFor(email = "") {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name, email) {
  const src = name || email || "?";
  const parts = src.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default function PresenceStack({ others }) {
  if (!others || others.length === 0) return null;

  return (
    <div
      className="absolute flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full"
      style={{
        top: 8, right: 12, zIndex: 30,
        background: "rgba(12, 22, 38, 0.92)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
      }}
      title={`Also viewing: ${others.map((o) => o.user_name || o.user_email).join(", ")}`}
    >
      <Eye size={10} style={{ color: "var(--text-muted)" }} />
      <div className="flex items-center" style={{ marginLeft: 2 }}>
        {others.slice(0, 5).map((o, i) => {
          const c = colorFor(o.user_email);
          return (
            <div
              key={o.user_email}
              className="rounded-full flex items-center justify-center"
              title={o.user_name || o.user_email}
              style={{
                width: 20, height: 20,
                marginLeft: i === 0 ? 0 : -6,
                background: c + "26",
                border: `1.5px solid ${c}`,
                color: c,
                fontSize: 8, fontWeight: 800,
                boxShadow: `0 0 6px ${c}44`,
                zIndex: 10 - i,
              }}
            >
              {initials(o.user_name, o.user_email)}
            </div>
          );
        })}
      </div>
      <span style={{ fontSize: 9.5, color: "var(--text-secondary)", fontWeight: 600, whiteSpace: "nowrap" }}>
        {others.length > 5 ? `+${others.length - 5} ` : ""}viewing
      </span>
    </div>
  );
}