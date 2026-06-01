/**
 * ZoneHeader — labelled band header used to group widgets into ordered
 * "zones" across pages (Home, Dashboard, etc.). Shows:
 *   - small dashboard-section-label (eyebrow)
 *   - zone title
 *   - optional count chip and hint text
 *   - optional "view all" link
 *
 * Designed to mirror the visual rhythm used on the Red River OS Home page.
 */
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight } from "lucide-react";

export default function ZoneHeader({
  label,
  title,
  count,
  hint,
  linkTo,
  linkLabel = "View all",
  className = "",
  style,
}) {
  return (
    <div
      className={`flex items-center justify-between mb-2 shrink-0 gap-2 ${className}`}
      style={style}
    >
      <div className="flex items-baseline gap-2 min-w-0 flex-1">
        {label && (
          <div className="dashboard-section-label" style={{ margin: 0 }}>
            {label}
          </div>
        )}
        {title && (
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              margin: 0,
            }}
          >
            {title}
          </h2>
        )}
        {count != null && (
          <span style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            · {count}
          </span>
        )}
        {hint && (
          <span
            className="truncate"
            style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.7 }}
          >
            {hint}
          </span>
        )}
      </div>
      {linkTo && (
        <Link
          to={createPageUrl(linkTo)}
          className="zone-header-link flex items-center gap-1 shrink-0 transition-colors"
          style={{ fontSize: 10.5, color: "var(--text-muted)", textDecoration: "none" }}
        >
          {linkLabel} <ArrowRight size={10} />
        </Link>
      )}
    </div>
  );
}