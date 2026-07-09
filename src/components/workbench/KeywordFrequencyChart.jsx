/**
 * KeywordFrequencyChart — horizontal bar chart of the most frequent
 * keywords in a text column (quantitative thematic view).
 */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TOOLTIP_PROPS, AXIS_TICK, GRID_STROKE, CURSOR_FILL } from "@/components/workbench/chartTheme";

export default function KeywordFrequencyChart({ keywords }) {
  if (!keywords?.length) {
    return (
      <div className="text-xs py-8 text-center" style={{ color: "var(--text-muted)" }}>
        Not enough text content in this column to extract keywords.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, keywords.length * 22)}>
      <BarChart data={keywords} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="kwBarFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#40c4ff" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#40c4ff" stopOpacity={0.95} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
        <XAxis type="number" tick={AXIS_TICK} allowDecimals={false} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
        <YAxis type="category" dataKey="word" width={110} tick={{ ...AXIS_TICK, fontSize: 11, fill: "#8bafd4" }} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_PROPS} cursor={CURSOR_FILL} formatter={(v) => [`${v} responses`, "Mentions"]} />
        <Bar dataKey="count" fill="url(#kwBarFill)" stroke="#40c4ff" strokeOpacity={0.35} radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}