import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { APP_STATUS } from "@/platform/appRegistry";
import {
  ChevronRight, HeartPulse, Scale, HeartHandshake, Leaf,
  FileSignature, FlaskConical, Target, Building2, BarChart3,
} from "lucide-react";

const APP_ICONS = {
  HeartPulse, Scale, HeartHandshake, Leaf, FileSignature,
  FlaskConical, Target, Building2, BarChart3,
};

function AppIcon({ name, ...rest }) {
  const Icon = APP_ICONS[name];
  return Icon ? <Icon {...rest} /> : <BarChart3 {...rest} />;
}

export default function AppLauncherCard({ app }) {
  const isReady = app.status === APP_STATUS.ACTIVE;
  const isScaffold = app.status === APP_STATUS.SCAFFOLD;
  const isPlanned = app.status === APP_STATUS.PLANNED;
  const statusBadge = isScaffold ? "beta" : isPlanned ? "soon" : null;
  return (
    <Link
      to={createPageUrl(app.landingPage)}
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all group"
      title={`${app.name} — ${app.description}`}
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid var(--border-subtle)`,
        borderLeft: `2px solid ${app.accent}${isReady ? "cc" : "55"}`,
        textDecoration: "none",
        minWidth: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `linear-gradient(135deg, var(--bg-elevated) 0%, ${app.accent}10 100%)`;
        e.currentTarget.style.borderColor = app.accent + "55";
        e.currentTarget.style.borderLeftColor = app.accent;
        e.currentTarget.style.boxShadow = `0 0 16px ${app.accent}14`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "var(--bg-elevated)";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.borderLeftColor = app.accent + (isReady ? "cc" : "55");
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ background: app.accent + "18", border: `1px solid ${app.accent}33` }}
      >
        <AppIcon name={app.icon} size={13} style={{ color: app.accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
            {app.shortName}
          </span>
          {statusBadge && (
            <span style={{
              fontSize: 8, padding: "0 4px", borderRadius: 2,
              background: "var(--bg-overlay)", color: "var(--text-muted)",
              fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
              flexShrink: 0,
            }}>
              {statusBadge}
            </span>
          )}
        </div>
        <p className="truncate" style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.3 }}>
          {app.description}
        </p>
      </div>
      <ChevronRight
        size={12}
        style={{ color: "var(--text-muted)", flexShrink: 0 }}
        className="group-hover:translate-x-0.5 transition-transform"
      />
    </Link>
  );
}