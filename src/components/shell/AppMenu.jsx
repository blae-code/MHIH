/**
 * AppMenu — lightweight dropdown for switching between Red River OS applications.
 *
 * Designed to feel like a native OS app menu:
 *   - opens directly under the trigger (no full-screen modal)
 *   - one click to switch (no typing required)
 *   - smooth fade-in, no jarring layout shift
 *   - closes on outside click or Escape
 *
 * Usage:
 *   <AppMenu
 *     anchorRef={triggerRef}
 *     align="left" | "right"
 *     onClose={() => setOpen(false)}
 *   />
 */

import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { usePlatform } from "@/platform/platformContext";
import { getApps, APP_STATUS } from "@/platform/appRegistry";
import {
  LayoutDashboard, Database, Brain, Settings, Users, Search, Bell,
  FileDown, BookOpen, Shield, BarChart3, SlidersHorizontal, ShieldCheck, Bot,
  MapPin, TrendingUp, Wrench, BellRing, Workflow, Sparkles, LogOut, User,
  Activity, FlaskConical, ClipboardCheck, BrainCircuit, MapPinned, Siren,
  BookMarked, Link2, ListOrdered, GitCompare, FileText, MessageSquare,
  Command, Building2, Target, HeartPulse, Scale, HeartHandshake, Leaf,
  FileSignature, Camera, Layers3, Check,
} from "lucide-react";

const ICON_MAP = {
  LayoutDashboard, Database, Brain, Settings, Users, Search, Bell,
  FileDown, BookOpen, Shield, BarChart3, SlidersHorizontal, ShieldCheck, Bot,
  MapPin, TrendingUp, Wrench, BellRing, Workflow, Sparkles, LogOut, User,
  Activity, FlaskConical, ClipboardCheck, BrainCircuit, MapPinned, Siren,
  BookMarked, Link2, ListOrdered, GitCompare, FileText, MessageSquare,
  Command, Building2, Target, HeartPulse, Scale, HeartHandshake, Leaf,
  FileSignature, Camera, Layers3,
};

const STATUS_LABEL = {
  [APP_STATUS.ACTIVE]: null,
  [APP_STATUS.SCAFFOLD]: "beta",
  [APP_STATUS.PLANNED]: "soon",
};

function AppIcon({ name, size = 14, ...rest }) {
  const Comp = ICON_MAP[name] || Command;
  return <Comp size={size} {...rest} />;
}

export default function AppMenu({ anchorRef, align = "left", onClose }) {
  const platform = usePlatform();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const apps = getApps().filter(a => !a.isOsLevel);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target))
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [anchorRef, onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSelect = (app) => {
    platform.switchApp(app.id);
    navigate(createPageUrl(app.landingPage));
    onClose();
  };

  return (
    <>
      <style>{`
        @keyframes appmenu-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .appmenu-root {
          animation: appmenu-fade-in 0.14s ease-out;
        }
        .appmenu-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.1s ease;
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
        }
        .appmenu-row:hover {
          background: rgba(255,255,255,0.04);
        }
      `}</style>
      <div
        ref={menuRef}
        className="appmenu-root absolute z-50 rounded-xl overflow-hidden"
        style={{
          top: "calc(100% + 4px)",
          [align]: 0,
          width: 280,
          background: "#131f33",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 12px 36px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-2"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            background: "#0c1626",
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Applications
          </div>
        </div>

        {/* App list */}
        <div className="p-1.5 max-h-96 overflow-y-auto">
          {apps.map((app) => {
            const isActive = app.id === platform.activeAppId;
            const statusBadge = STATUS_LABEL[app.status];
            return (
              <button
                key={app.id}
                className="appmenu-row"
                onClick={() => handleSelect(app)}
              >
                <div
                  className="rounded-md flex items-center justify-center shrink-0"
                  style={{
                    width: 28, height: 28,
                    background: `${app.accent}18`,
                    border: `1px solid ${app.accent}33`,
                  }}
                >
                  <AppIcon name={app.icon} size={14} style={{ color: app.accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="flex items-center gap-1.5"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: isActive ? app.accent : "var(--text-primary)",
                      lineHeight: 1.2,
                    }}
                  >
                    <span className="truncate">{app.shortName}</span>
                    {statusBadge && (
                      <span
                        className="rounded px-1 py-0.5 font-semibold uppercase shrink-0"
                        style={{
                          fontSize: 8.5,
                          background: "var(--bg-hover)",
                          color: "var(--text-muted)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {statusBadge}
                      </span>
                    )}
                  </div>
                  <div
                    className="truncate"
                    style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 1 }}
                  >
                    {app.description}
                  </div>
                </div>
                {isActive && (
                  <Check size={13} style={{ color: app.accent, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}