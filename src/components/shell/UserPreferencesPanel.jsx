/**
 * UserPreferencesPanel — user experience & customization hub.
 *
 * Slide-in side panel opened from the header user menu. Surfaces:
 *   - Profile snapshot
 *   - Display: UI density (compact/comfortable), accent intensity, sidebar default
 *   - Navigation: show/hide breadcrumb, recent pages list (with clear)
 *   - Workspace shortcuts: jump to Settings, Notification Preferences, Feedback
 *   - Keyboard reference
 *
 * Customization values live in PlatformContext (localStorage-persisted).
 * No business logic — purely a preferences UI surface.
 */

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { usePlatform } from "@/platform/platformContext";
import { getRoleLabel } from "@/platform/permissions";
import {
  X, Settings as SettingsIcon, Bell, MessageSquare, LogOut, Keyboard,
  PanelLeft, Layout as LayoutIcon, Palette, History, ChevronRight,
  Check, Trash2, Sparkles, User as UserIcon,
} from "lucide-react";

function humanizePageName(name) {
  if (!name) return "";
  return name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").trim();
}

function SectionLabel({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-1.5 px-3 mt-4 mb-2"
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "var(--mnbc-yellow)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontFamily: "'Sofia Sans Extra Condensed', sans-serif",
      }}>
      {Icon && <Icon size={11} />}
      {children}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-start justify-between gap-3 px-3 py-2 text-left transition-colors"
      style={{ background: "transparent" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        {description && (
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 1 }}>{description}</div>
        )}
      </div>
      <span
        className="shrink-0 rounded-full relative transition-colors"
        style={{
          width: 28, height: 16,
          background: checked ? "rgba(254,221,0,0.4)" : "var(--bg-overlay)",
          border: `1px solid ${checked ? "rgba(254,221,0,0.6)" : "var(--border-default)"}`,
        }}
      >
        <span
          className="absolute top-1/2 rounded-full transition-all"
          style={{
            width: 10, height: 10,
            background: checked ? "#FEDD00" : "var(--text-muted)",
            transform: `translateY(-50%) translateX(${checked ? 13 : 2}px)`,
            boxShadow: checked ? "0 0 6px rgba(254,221,0,0.6)" : "none",
          }}
        />
      </span>
    </button>
  );
}

function SegmentPicker({ options, value, onChange }) {
  return (
    <div
      className="flex p-0.5 mx-3 rounded-md"
      style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded transition-all"
            style={{
              background: active ? "rgba(254,221,0,0.12)" : "transparent",
              color: active ? "#FEDD00" : "var(--text-secondary)",
              fontSize: 11,
              fontWeight: 600,
              border: active ? "1px solid rgba(254,221,0,0.35)" : "1px solid transparent",
            }}
          >
            {opt.icon && <opt.icon size={11} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ActionRow({ icon: Icon, label, hint, onClick, to, danger }) {
  const color = danger ? "#ff6b6b" : "var(--text-secondary)";
  const Body = (
    <>
      <Icon size={13} style={{ color: danger ? "#ff6b6b" : "var(--text-muted)" }} />
      <span className="flex-1" style={{ fontSize: 12, fontWeight: 500, color }}>{label}</span>
      {hint && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{hint}</span>}
      <ChevronRight size={11} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
    </>
  );
  const baseStyle = {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "8px 12px",
    textDecoration: "none",
    transition: "background 0.12s ease",
    background: "transparent",
    cursor: "pointer",
    border: 0,
  };
  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        style={baseStyle}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        {Body}
      </Link>
    );
  }
  return (
    <button
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={(e) => e.currentTarget.style.background = danger ? "rgba(255,107,107,0.08)" : "var(--bg-hover)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      {Body}
    </button>
  );
}

export default function UserPreferencesPanel({
  user,
  onClose,
  onOpenFeedback,
  onOpenNotificationPrefs,
  onLogout,
}) {
  const platform = usePlatform();

  return (
    <>
      <div
        className="fixed inset-0"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", zIndex: 80 }}
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 bottom-0 flex flex-col overflow-hidden"
        style={{
          width: 340,
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-default)",
          boxShadow: "-12px 0 32px rgba(0,0,0,0.5)",
          zIndex: 81,
          animation: "rrUpSlide 0.18s ease-out",
        }}
      >
        <style>{`
          @keyframes rrUpSlide { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `}</style>

        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2.5 shrink-0"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            background: "linear-gradient(180deg, #0f1b2e 0%, var(--bg-surface) 100%)",
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={13} style={{ color: "#FEDD00" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-primary)",
                fontFamily: "'Sofia Sans Extra Condensed', sans-serif",
              }}
            >
              Your Workspace
            </span>
          </div>
          <button
            onClick={onClose}
            className="activity-icon"
            style={{ width: 24, height: 24 }}
            title="Close"
          >
            <X size={12} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto py-1">
          {/* ── Profile snapshot ───────────────────────────────────── */}
          <div className="flex items-center gap-3 px-3 py-3">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  objectFit: "cover", border: "1px solid var(--border-default)",
                }}
              />
            ) : (
              <span
                className="inline-flex items-center justify-center rounded-full"
                style={{
                  width: 38, height: 38,
                  background: "linear-gradient(135deg, #2a456a 0%, #1a2e48 100%)",
                  color: "#FEDD00",
                  fontSize: 15,
                  fontWeight: 700,
                  border: "1px solid var(--border-default)",
                }}
              >
                {(user?.full_name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div
                className="truncate"
                style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}
              >
                {user?.full_name ?? "—"}
              </div>
              <div
                className="truncate"
                style={{ fontSize: 11, color: "var(--text-muted)" }}
              >
                {user?.email}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#00e676", boxShadow: "0 0 6px rgba(0,230,118,0.6)" }}
                />
                <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>
                  {getRoleLabel(user?.role)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Display ────────────────────────────────────────────── */}
          <SectionLabel icon={Palette}>Display</SectionLabel>

          <div className="px-3 mb-1.5" style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
            Density
          </div>
          <SegmentPicker
            value={platform.uiDensity}
            onChange={platform.setUiDensity}
            options={[
              { value: "comfortable", label: "Comfortable", icon: LayoutIcon },
              { value: "compact", label: "Compact", icon: LayoutIcon },
            ]}
          />

          <div className="px-3 mt-3 mb-1.5" style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
            Accent intensity
          </div>
          <SegmentPicker
            value={platform.accentIntensity}
            onChange={platform.setAccentIntensity}
            options={[
              { value: "vivid", label: "Vivid" },
              { value: "muted", label: "Muted" },
            ]}
          />

          <div className="mt-2">
            <ToggleRow
              label="Show breadcrumb in header"
              description="Display current page next to the app switcher"
              checked={platform.showBreadcrumbInHeader}
              onChange={platform.setShowBreadcrumbInHeader}
            />
            <ToggleRow
              label="Keep sidebar open"
              description="Default sidebar state for new sessions"
              checked={platform.sidebarOpen}
              onChange={platform.setSidebarOpen}
            />
          </div>

          {/* ── Recent pages ───────────────────────────────────────── */}
          <SectionLabel icon={History}>Recent pages</SectionLabel>
          {platform.recentPages.length === 0 ? (
            <div className="px-3 py-2" style={{ fontSize: 11, color: "var(--text-muted)" }}>
              No pages visited yet.
            </div>
          ) : (
            <>
              {platform.recentPages.slice(0, 6).map((rp) => (
                <Link
                  key={rp.page}
                  to={rp.path}
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-1.5 transition-colors"
                  style={{ textDecoration: "none" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <ChevronRight size={10} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                  <span className="flex-1 truncate" style={{ fontSize: 12, color: "var(--text-primary)" }}>
                    {humanizePageName(rp.page)}
                  </span>
                </Link>
              ))}
              <button
                onClick={platform.clearRecentPages}
                className="flex items-center gap-1.5 px-3 py-1.5 mt-1"
                style={{ fontSize: 10.5, color: "var(--text-muted)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#ff6b6b"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
              >
                <Trash2 size={10} /> Clear history
              </button>
            </>
          )}

          {/* ── Quick links ────────────────────────────────────────── */}
          <SectionLabel icon={SettingsIcon}>Workspace</SectionLabel>
          <ActionRow icon={UserIcon} label="Account settings" to={createPageUrl("Settings")} onClick={onClose} />
          <ActionRow icon={Bell} label="Notification preferences" onClick={() => { onClose(); onOpenNotificationPrefs?.(); }} />
          <ActionRow icon={MessageSquare} label="Send feedback" onClick={() => { onClose(); onOpenFeedback?.(); }} />

          {/* ── Keyboard ───────────────────────────────────────────── */}
          <SectionLabel icon={Keyboard}>Keyboard shortcuts</SectionLabel>
          <div className="px-3 pb-2 space-y-1">
            {[
              { keys: ["Ctrl", "K"], label: "Open search" },
              { keys: ["Esc"], label: "Close panel / dialog" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between" style={{ fontSize: 11 }}>
                <span style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      style={{
                        fontSize: 9.5,
                        color: "var(--text-secondary)",
                        background: "rgba(255,255,255,0.05)",
                        padding: "2px 5px",
                        borderRadius: 3,
                        border: "1px solid var(--border-subtle)",
                        fontFamily: "'Sofia Sans', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: sign out */}
        <div
          className="shrink-0"
          style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}
        >
          <ActionRow icon={LogOut} label="Sign out" onClick={() => { onClose(); onLogout?.(); }} danger />
        </div>
      </aside>
    </>
  );
}