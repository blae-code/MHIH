/**
 * ActivityTicker — thin live strip on the home page showing the most
 * recent platform events (data syncs + sentinel alerts).
 */

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Siren, Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SYNC_COLOR = { success: "#00e676", failed: "#ff4d4f", running: "#40c4ff", skipped: "#8bafd4" };
const SEV_COLOR = { critical: "#ff4d4f", high: "#ffab40", medium: "#FEDD00", low: "#40c4ff" };

export default function ActivityTicker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [syncs, alerts] = await Promise.all([
        base44.entities.SyncJob.list("-created_date", 5).catch(() => []),
        base44.entities.AlertEvent.list("-created_date", 4).catch(() => []),
      ]);
      if (!alive) return;
      const merged = [
        ...(syncs || []).map((s) => ({
          id: `sync-${s.id}`,
          icon: RefreshCw,
          color: SYNC_COLOR[s.status] || "#40c4ff",
          text: `Sync ${s.status}: ${s.source_name}`,
          date: s.created_date,
        })),
        ...(alerts || []).map((a) => ({
          id: `alert-${a.id}`,
          icon: Siren,
          color: SEV_COLOR[a.severity] || "#FEDD00",
          text: a.summary || `${a.alert_type} alert`,
          date: a.created_date,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
      setItems(merged);
    };
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="shrink-0 flex items-center gap-2 px-3 rounded-lg overflow-hidden"
      style={{
        height: 28,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <span className="flex items-center gap-1.5 shrink-0" style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--mnbc-yellow)",
      }}>
        <Radio size={10} className="pulse-dot" /> Live
      </span>
      <div style={{ width: 1, height: 14, background: "var(--border-subtle)" }} className="shrink-0" />
      <div className="flex items-center gap-4 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
        {items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <span key={item.id} className="flex items-center gap-1.5 shrink-0" style={{ fontSize: 10.5, color: "var(--text-secondary)" }}>
              <ItemIcon size={10} style={{ color: item.color, flexShrink: 0 }} />
              <span className="truncate" style={{ maxWidth: 260 }}>{item.text}</span>
              {item.date && (
                <span style={{ fontSize: 9, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}