/**
 * StatusLogDrawer — terminal-style activity log drawer.
 *
 * Slides up from the status footer to reveal a scrollable, monospaced
 * log stream sourced from the platform context. Read-only.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Download, Trash2, Filter, Pause, Play, ChevronDown } from "lucide-react";

const TYPE_META = {
  info:    { color: "#40c4ff", label: "INFO" },
  success: { color: "#52c41a", label: " OK " },
  warning: { color: "#faad14", label: "WARN" },
  error:   { color: "#ff4d4f", label: "ERR " },
};

function fmtTime(ts) {
  try {
    const d = ts instanceof Date ? ts : new Date(ts);
    return d.toLocaleTimeString("en-CA", { hour12: false }) +
      "." + String(d.getMilliseconds()).padStart(3, "0");
  } catch {
    return "--:--:--.---";
  }
}

export default function StatusLogDrawer({
  open,
  logs = [],
  onClose,
  onClear,
  height = 280,
}) {
  const [filter, setFilter] = useState("all"); // all | info | success | warning | error
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [frozen, setFrozen] = useState([]); // snapshot when paused
  const scrollRef = useRef(null);

  // Snapshot logs when paused so the stream visually stops
  useEffect(() => {
    if (paused) setFrozen(logs);
  }, [paused, logs]);

  const source = paused ? frozen : logs;

  const filtered = useMemo(() => {
    const list = filter === "all" ? source : source.filter(l => l.type === filter);
    // logs come newest-first in platform context — reverse for terminal order
    return [...list].reverse();
  }, [source, filter]);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (!open || !autoScroll || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [filtered.length, open, autoScroll]);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 12;
    if (atBottom !== autoScroll) setAutoScroll(atBottom);
  };

  const handleDownload = () => {
    const text = filtered
      .map(l => `[${fmtTime(l.timestamp ?? l.ts ?? Date.now())}] ${(TYPE_META[l.type]?.label ?? "LOG ").trim().padEnd(5)} ${l.msg ?? ""}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redriver-log-${new Date().toISOString().replace(/[:.]/g, "-")}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  const counts = {
    all: logs.length,
    info: logs.filter(l => l.type === "info").length,
    success: logs.filter(l => l.type === "success").length,
    warning: logs.filter(l => l.type === "warning").length,
    error: logs.filter(l => l.type === "error").length,
  };

  return (
    <div
      className="shrink-0 flex flex-col"
      style={{
        height,
        background: "#02060c",
        borderTop: "1px solid var(--border-default)",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(254,221,0,0.05)",
        zIndex: 6,
      }}
    >
      {/* Toolbar */}
      <div
        className="shrink-0 flex items-center gap-2 px-3"
        style={{
          height: 30,
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          fontSize: 10.5,
          color: "var(--text-muted)",
        }}
      >
        <span style={{
          fontWeight: 700, color: "var(--text-secondary)",
          letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 10,
        }}>
          Activity Log
        </span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {filtered.length}/{counts.all} entries
        </span>

        {/* Filter chips */}
        <div className="flex items-center gap-1 ml-2">
          <Filter size={9} style={{ opacity: 0.6 }} />
          {["all", "info", "success", "warning", "error"].map(t => {
            const active = filter === t;
            const meta = TYPE_META[t];
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  padding: "1px 6px", borderRadius: 3,
                  fontSize: 9.5, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  background: active ? (meta?.color ?? "var(--mnbc-yellow)") + "22" : "transparent",
                  color: active ? (meta?.color ?? "var(--mnbc-yellow)") : "var(--text-muted)",
                  border: `1px solid ${active ? (meta?.color ?? "var(--mnbc-yellow)") + "55" : "transparent"}`,
                  cursor: "pointer",
                }}
              >
                {t} {t !== "all" && `· ${counts[t]}`}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setPaused(p => !p)}
          title={paused ? "Resume" : "Pause"}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "2px 6px", borderRadius: 3,
            background: paused ? "rgba(250,173,20,0.15)" : "transparent",
            color: paused ? "#faad14" : "var(--text-muted)",
            border: "1px solid " + (paused ? "#faad1455" : "transparent"),
            fontSize: 10, cursor: "pointer",
          }}
        >
          {paused ? <Play size={9} /> : <Pause size={9} />}
          {paused ? "paused" : "live"}
        </button>
        <button onClick={handleDownload} title="Download log" className="activity-icon" style={{ width: 22, height: 22 }}>
          <Download size={11} />
        </button>
        {onClear && (
          <button onClick={onClear} title="Clear log" className="activity-icon" style={{ width: 22, height: 22 }}>
            <Trash2 size={11} />
          </button>
        )}
        <button onClick={onClose} title="Close" className="activity-icon" style={{ width: 22, height: 22 }}>
          <X size={11} />
        </button>
      </div>

      {/* Stream */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-1.5"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 11,
          lineHeight: 1.55,
          color: "#cfe3ff",
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontStyle: "italic", padding: "6px 0" }}>
            // no log entries
          </div>
        ) : filtered.map((l, idx) => {
          const meta = TYPE_META[l.type] ?? TYPE_META.info;
          return (
            <div key={idx} className="flex gap-2 hover:bg-white/[0.025]" style={{ padding: "0 2px", borderRadius: 2 }}>
              <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap", opacity: 0.6 }}>
                {fmtTime(l.timestamp ?? l.ts ?? Date.now())}
              </span>
              <span style={{
                color: meta.color, fontWeight: 700, whiteSpace: "nowrap",
                textShadow: `0 0 6px ${meta.color}44`,
              }}>
                [{meta.label}]
              </span>
              <span style={{ color: "#dbe9ff", wordBreak: "break-word", flex: 1 }}>
                {l.msg ?? String(l)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      {!autoScroll && (
        <button
          onClick={() => { setAutoScroll(true); scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight); }}
          style={{
            position: "absolute", right: 14, bottom: 12,
            background: "var(--mnbc-yellow)", color: "#000",
            padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 4,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            cursor: "pointer", border: "none",
          }}
        >
          <ChevronDown size={10} /> jump to latest
        </button>
      )}
    </div>
  );
}