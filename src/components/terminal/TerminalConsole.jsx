/**
 * TerminalConsole — Red River OS "Terminal-lite".
 *
 * Shell-style overlay: whitelisted slash commands against real app
 * operations, role-gated (admin commands double-checked server-side),
 * with command history, tab completion, and audit logging of every run.
 */

import React, { useEffect, useRef, useState } from "react";
import { X, TerminalSquare, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { COMMANDS, findCommand } from "./commandRegistry";

const LINE_COLORS = {
  out: "var(--text-secondary)",
  ok: "#00e676",
  err: "#ff4d4f",
  warn: "#ffab40",
  sys: "#40c4ff",
  cmd: "#FEDD00",
};

export default function TerminalConsole({ user, onClose }) {
  const [lines, setLines] = useState([
    { type: "sys", text: `Red River OS terminal-lite · ${user?.email ?? "unauthenticated"} · role=${user?.role ?? "user"}` },
    { type: "sys", text: "Whitelisted commands only — every execution is audit-logged. Type /help to begin." },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const print = (type, text) => setLines((prev) => [...prev, { type, text }]);

  const execute = async (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    print("cmd", `${user?.email?.split("@")[0] ?? "user"}@redriver:~$ ${trimmed}`);
    setHistory((prev) => [trimmed, ...prev].slice(0, 50));
    setHistIdx(-1);

    const [name, ...argv] = trimmed.split(/\s+/);
    const clean = name.replace(/^\//, "").toLowerCase();

    if (clean === "clear") { setLines([]); return; }
    if (clean === "history") {
      history.slice(0, 20).forEach((h, i) => print("out", `  ${i + 1}. ${h}`));
      if (history.length === 0) print("warn", "No history yet.");
      return;
    }
    if (clean === "exit") { onClose(); return; }

    const cmd = findCommand(clean);
    if (!cmd) {
      print("err", `Unknown command: ${name}. Type /help.`);
      return;
    }
    if (cmd.admin && user?.role !== "admin") {
      print("err", `Permission denied: /${cmd.name} requires the admin role.`);
      return;
    }

    setBusy(true);
    try {
      await cmd.run({ argv, user, print });
      // Audit trail — every executed command is recorded
      base44.entities.AuditLog.create({
        action: "terminal_command",
        entity_type: "Terminal",
        user_email: user?.email ?? "unknown",
        user_name: user?.full_name ?? "",
        details: trimmed,
      }).catch(() => {});
    } catch (e) {
      print("err", `Error: ${e?.response?.data?.error ?? e.message}`);
    }
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !busy) {
      const v = input;
      setInput("");
      execute(v);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      if (history[next]) { setHistIdx(next); setInput(history[next]); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = histIdx - 1;
      if (next < 0) { setHistIdx(-1); setInput(""); }
      else { setHistIdx(next); setInput(history[next]); }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const token = input.replace(/^\//, "").toLowerCase();
      if (!token || input.includes(" ")) return;
      const matches = COMMANDS.filter((c) => c.name.startsWith(token) && (!c.admin || user?.role === "admin"));
      if (matches.length === 1) setInput(`/${matches[0].name} `);
      else if (matches.length > 1) print("sys", matches.map((m) => `/${m.name}`).join("  "));
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed left-0 right-0 bottom-0 flex flex-col"
      style={{
        zIndex: 9000,
        height: "44vh",
        minHeight: 260,
        background: "rgba(3, 8, 15, 0.97)",
        borderTop: "1.5px solid rgba(254,221,0,0.45)",
        boxShadow: "0 -12px 48px rgba(0,0,0,0.7), 0 0 32px rgba(254,221,0,0.06)",
        backdropFilter: "blur(6px)",
        fontFamily: "ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, monospace",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 shrink-0" style={{ height: 32, borderBottom: "1px solid var(--border-subtle)" }}>
        <TerminalSquare size={12} style={{ color: "var(--mnbc-yellow)" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.05em" }}>
          TERMINAL-LITE
        </span>
        <span className="flex items-center gap-1" style={{
          fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3,
          color: user?.role === "admin" ? "#00e676" : "var(--text-muted)",
          background: user?.role === "admin" ? "rgba(0,230,118,0.1)" : "var(--bg-overlay)",
          border: `1px solid ${user?.role === "admin" ? "rgba(0,230,118,0.35)" : "var(--border-subtle)"}`,
        }}>
          <ShieldCheck size={9} />
          {user?.role === "admin" ? "ADMIN" : "READ-ONLY"}
        </span>
        <span style={{ fontSize: 9.5, color: "var(--text-muted)", marginLeft: "auto" }}>
          audit-logged · Esc to close
        </span>
        <button onClick={onClose} className="activity-icon" style={{ width: 22, height: 22 }}>
          <X size={11} />
        </button>
      </div>

      {/* Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2" onClick={() => inputRef.current?.focus()}>
        {lines.map((line, i) => (
          <div key={i} style={{
            fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
            color: LINE_COLORS[line.type] ?? "var(--text-secondary)",
            fontWeight: line.type === "cmd" ? 600 : 400,
          }}>
            {line.text}
          </div>
        ))}
        {busy && <div style={{ fontSize: 11, color: "var(--text-muted)" }} className="animate-pulse">…</div>}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 shrink-0" style={{ height: 36, borderTop: "1px solid var(--border-subtle)" }}>
        <span style={{ fontSize: 11, color: "var(--mnbc-yellow)", fontWeight: 700, whiteSpace: "nowrap" }}>
          {user?.email?.split("@")[0] ?? "user"}@redriver:~$
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={busy}
          spellCheck={false}
          autoComplete="off"
          placeholder="/help"
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: 11.5, color: "var(--text-primary)", fontFamily: "inherit", caretColor: "var(--mnbc-yellow)" }}
        />
      </div>
    </div>
  );
}