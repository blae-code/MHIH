import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function HomeStatCard({ label, value, desc, icon: Icon, color, bgColor, trend, tooltip, loading }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;
  return (
    <div
      className="home-stat-card relative overflow-hidden group"
      title={tooltip}
      style={{
        background: `linear-gradient(135deg, ${bgColor} 0%, var(--bg-elevated) 100%)`,
        border: `1px solid ${color}30`,
        borderRadius: 10,
        padding: 12,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 12px rgba(0,0,0,0.35)",
        cursor: "help",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
      }} />
      <div className="flex items-start justify-between mb-2 relative z-10">
        <span style={{
          fontSize: 9, fontWeight: 600, color: "var(--text-secondary)",
          textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.1,
        }}>
          {label}
        </span>
        <div className="p-1.5 rounded-md shrink-0 transition-all group-hover:scale-110"
          style={{ background: bgColor, boxShadow: `0 0 8px ${color}22` }}>
          <Icon size={12} style={{ color, strokeWidth: 2.5 }} />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 mb-1 relative z-10">
        {loading ? (
          <span className="shimmer" style={{ display: "inline-block", width: 44, height: 26, borderRadius: 5 }} />
        ) : (
          <span style={{
            fontSize: 26, fontWeight: 900, color, lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            textShadow: `0 2px 8px ${color}18`,
          }}>
            {value}
          </span>
        )}
        {!loading && TrendIcon && <TrendIcon size={12} style={{ color }} />}
      </div>
      <div style={{ fontSize: 10.5, color: "var(--text-secondary)", lineHeight: 1.35 }} className="relative z-10">
        {desc}
      </div>
    </div>
  );
}