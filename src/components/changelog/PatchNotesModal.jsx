import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  X, Sparkles, CheckCircle2, Zap, Wrench, ArrowRight,
  BarChart3, Brain, Database, Shield, Map, Bell, FileText,
  FlaskConical, BookOpen, Bot, Workflow
} from "lucide-react";

const CURRENT_VERSION = "0.1.0";
const STORAGE_KEY = `mhip_patchnotes_seen_v`;

// ── Human-friendly patch notes for v0.1.0 ──
const PATCH_NOTES = {
  version: "0.1.0",
  date: "March 5, 2026",
  headline: "Welcome to MHIP",
  subheadline: "The Métis Health Intelligence Platform is here.",
  intro: "We've built something special — a dedicated home for BC Métis health data, AI-powered insights, and policy tools designed to help MNBC make evidence-based decisions. Here's a quick tour of what's available to you today.",
  highlights: [
    {
      icon: BarChart3,
      color: "#40c4ff",
      title: "Your Data, Beautifully Visualized",
      body: "Explore health metrics across regions and categories through interactive charts. Click any bar, slice, or data point to drill deeper — the charts respond to your curiosity.",
    },
    {
      icon: Brain,
      color: "#a78bfa",
      title: "AI That Understands Health Data",
      body: "Ask plain-language questions about Métis health trends and get clear, sourced answers. The AI Analyst reads your data and explains what it means — no technical knowledge required.",
    },
    {
      icon: FlaskConical,
      color: "#f472b6",
      title: "Policy Tools Built for Decision-Makers",
      body: "Simulate policy scenarios, track interventions, and get ranked recommendations — all with a clear evidence trail so you always know why the system is suggesting what it is.",
    },
    {
      icon: Database,
      color: "#FEDD00",
      title: "A Living Data Repository",
      body: "Connect external health data sources or upload your own. The platform automatically checks data quality, flags issues, and keeps everything organised and up to date.",
    },
    {
      icon: Shield,
      color: "#00e676",
      title: "Audit-Ready Governance",
      body: "Every action in the system is logged. From data imports to AI-generated insights, you have a full record of who did what and when — built for accountability from day one.",
    },
    {
      icon: Bell,
      color: "#ffab40",
      title: "Alerts That Actually Matter",
      body: "Set thresholds on any health metric and get notified the moment something changes. Whether it's a spike in a regional indicator or a data quality issue, you'll hear about it first.",
    },
  ],
  closing: "This is version 0.1 — the foundation. Each update will bring new capabilities based on your feedback and the needs of the MNBC health team.",
};

export default function PatchNotesModal() {
  const [visible, setVisible] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(`${STORAGE_KEY}${CURRENT_VERSION}`);
    if (!seen) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(`${STORAGE_KEY}${CURRENT_VERSION}`, "true");
    setVisible(false);
  };

  if (!visible) return null;

  const hl = PATCH_NOTES.highlights[activeHighlight];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(3,8,15,0.82)", backdropFilter: "blur(6px)" }}
    >
      <style>{`
        @keyframes patchSlideIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        .patch-enter { animation: patchSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        .hl-btn { transition: all 0.15s; cursor: pointer; }
        .hl-btn:hover { opacity: 1 !important; }
      `}</style>

      <div className="patch-enter w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(160deg, #0c1a28 0%, #081422 100%)",
          border: "1px solid rgba(254,221,0,0.2)",
          boxShadow: "0 0 0 1px rgba(64,196,255,0.06), 0 40px 100px rgba(0,0,0,0.9), 0 0 80px rgba(254,221,0,0.04)",
          maxHeight: "90vh",
        }}>

        {/* ── Top accent bar ── */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #FEDD00 0%, #40c4ff 40%, #00e676 80%, #FEDD00 100%)", backgroundSize: "200% 100%", animation: "gradientShift 6s ease-in-out infinite" }} />
        <style>{`@keyframes gradientShift { 0%,100%{background-position:0% center} 50%{background-position:100% center} }`}</style>

        {/* ── Header ── */}
        <div className="px-7 pt-6 pb-4 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono"
                style={{ background: "rgba(254,221,0,0.1)", color: "#FEDD00", border: "1px solid rgba(254,221,0,0.25)" }}>
                v{PATCH_NOTES.version}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{PATCH_NOTES.date}</span>
            </div>
            <h1 style={{ fontFamily: "'Sofia Sans Extra Condensed', 'Aptos Narrow', sans-serif", fontWeight: 800, fontSize: 28, color: "var(--text-primary)", letterSpacing: "0.02em", lineHeight: 1.1 }}>
              {PATCH_NOTES.headline}
            </h1>
            <p className="mt-1 text-sm font-medium" style={{ color: "#FEDD00", opacity: 0.9 }}>{PATCH_NOTES.subheadline}</p>
          </div>
          <button onClick={dismiss}
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ml-4 transition-all"
            style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
            <X size={14} />
          </button>
        </div>

        {/* ── Intro ── */}
        <div className="px-7 pb-4 shrink-0">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{PATCH_NOTES.intro}</p>
        </div>

        {/* ── Feature highlights ── */}
        <div className="px-7 pb-4 flex-1 overflow-auto">
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {PATCH_NOTES.highlights.map((h, i) => {
              const Icon = h.icon;
              const isActive = i === activeHighlight;
              return (
                <button key={i}
                  className="hl-btn flex items-center gap-2 px-3 py-2.5 rounded-xl text-left"
                  style={{
                    background: isActive ? `${h.color}10` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? `${h.color}40` : "rgba(255,255,255,0.07)"}`,
                    opacity: isActive ? 1 : 0.65,
                  }}
                  onClick={() => setActiveHighlight(i)}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${h.color}18` }}>
                    <Icon size={13} style={{ color: h.color }} />
                  </div>
                  <span className="text-xs font-semibold leading-tight" style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {h.title.split(" ").slice(0, 3).join(" ")}…
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active highlight detail */}
          <div className="rounded-xl p-4 transition-all"
            style={{ background: `${hl.color}08`, border: `1px solid ${hl.color}25`, minHeight: 88 }}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${hl.color}18`, border: `1px solid ${hl.color}35` }}>
                <hl.icon size={17} style={{ color: hl.color }} />
              </div>
              <div>
                <div className="font-bold text-sm mb-1.5" style={{ color: "var(--text-primary)" }}>{hl.title}</div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{hl.body}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Closing ── */}
        <div className="px-7 py-4 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs italic mb-4" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>{PATCH_NOTES.closing}</p>
          <div className="flex items-center justify-between gap-3">
            <Link to={createPageUrl("Changelog")} onClick={dismiss}
              className="flex items-center gap-1.5 text-xs transition-all"
              style={{ color: "var(--text-muted)" }}
              onMouseOver={e => e.currentTarget.style.color = "var(--text-secondary)"}
              onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}>
              <FileText size={12} />
              Full changelog
              <ArrowRight size={11} />
            </Link>
            <button onClick={dismiss}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, #FEDD00 0%, #ffe933 100%)",
                color: "#04245a",
                boxShadow: "0 0 20px rgba(254,221,0,0.3), 0 4px 12px rgba(254,221,0,0.2)",
              }}
              onMouseOver={e => e.currentTarget.style.boxShadow = "0 0 30px rgba(254,221,0,0.5), 0 4px 16px rgba(254,221,0,0.3)"}
              onMouseOut={e => e.currentTarget.style.boxShadow = "0 0 20px rgba(254,221,0,0.3), 0 4px 12px rgba(254,221,0,0.2)"}>
              <Sparkles size={14} />
              Let's get started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}