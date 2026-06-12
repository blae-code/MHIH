/**
 * RowQuickActions
 *
 * Inline action cluster that appears at the end of any row across the
 * Data & Evidence module. Provides single-click cross-jumps to a metric's
 * related artefacts and lightweight inline operations (edit, pin, flag,
 * snapshot, delete).
 *
 * Props:
 *   metric     — the HealthMetric row
 *   pinned     — boolean: is this metric currently pinned?
 *   onEdit     — () => void
 *   onPin      — () => void  (optional)
 *   onFlag     — () => void  (optional, opens quality-flag composer)
 *   onSnapshot — () => void  (optional, captures a snapshot)
 *   onDelete   — () => void
 *   compact    — boolean: render smaller buttons (table rows)
 *
 * Visual notes:
 *   - Matches the cockpit-card visual language already used across the
 *     module (subtle borders, yellow accent on hover).
 *   - Icon buttons only — labels surface via `title` tooltip.
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  Edit2, Trash2, Pin, PinOff, Flag, Camera,
  Database, BarChart2, ShieldCheck,
} from "lucide-react";
import { metricCrossJumps } from "@/lib/dataEvidenceNav";

const SIZE = { compact: 24, regular: 28 };
const ICON = { compact: 11, regular: 12 };

function IconBtn({ title, onClick, to, compact, danger, active, children }) {
  const sz = compact ? SIZE.compact : SIZE.regular;
  const style = {
    width: sz, height: sz,
    color: active
      ? "var(--accent-primary)"
      : danger
      ? "var(--color-error)"
      : "var(--text-muted)",
    background: active ? "rgba(254,221,0,0.10)" : "transparent",
    border: active ? "1px solid rgba(254,221,0,0.3)" : "1px solid transparent",
  };
  const common = {
    className: "activity-icon",
    style,
    title,
    onMouseEnter: (e) => {
      if (!active) e.currentTarget.style.background = "var(--bg-hover)";
    },
    onMouseLeave: (e) => {
      if (!active) e.currentTarget.style.background = "transparent";
    },
  };
  if (to) return <Link to={to} {...common}>{children}</Link>;
  return <button onClick={onClick} {...common}>{children}</button>;
}

export default function RowQuickActions({
  metric,
  pinned = false,
  onEdit,
  onPin,
  onFlag,
  onSnapshot,
  onDelete,
  compact = false,
}) {
  const icon = compact ? ICON.compact : ICON.regular;
  const jumps = metricCrossJumps(metric);

  return (
    <div className="flex items-center gap-0.5 justify-center">
      {/* Cross-jumps */}
      {jumps.toSource && (
        <IconBtn title="View source" to={jumps.toSource} compact={compact}>
          <Database size={icon} />
        </IconBtn>
      )}
      {jumps.toQuality && (
        <IconBtn title="Quality flags" to={jumps.toQuality} compact={compact}>
          <ShieldCheck size={icon} />
        </IconBtn>
      )}
      {jumps.toVisualize && (
        <IconBtn title="Visualize" to={jumps.toVisualize} compact={compact}>
          <BarChart2 size={icon} />
        </IconBtn>
      )}

      {/* Divider */}
      <span style={{ width: 1, height: 16, background: "var(--border-subtle)", margin: "0 2px" }} />

      {/* Inline operations */}
      {onPin && (
        <IconBtn
          title={pinned ? "Unpin metric" : "Pin metric"}
          onClick={onPin}
          compact={compact}
          active={pinned}
        >
          {pinned ? <PinOff size={icon} /> : <Pin size={icon} />}
        </IconBtn>
      )}
      {onFlag && (
        <IconBtn title="Raise quality flag" onClick={onFlag} compact={compact}>
          <Flag size={icon} />
        </IconBtn>
      )}
      {onSnapshot && (
        <IconBtn title="Capture snapshot" onClick={onSnapshot} compact={compact}>
          <Camera size={icon} />
        </IconBtn>
      )}
      {onEdit && (
        <IconBtn title="Edit" onClick={onEdit} compact={compact}>
          <Edit2 size={icon} />
        </IconBtn>
      )}
      {onDelete && (
        <IconBtn title="Delete" onClick={onDelete} compact={compact} danger>
          <Trash2 size={icon} />
        </IconBtn>
      )}
    </div>
  );
}