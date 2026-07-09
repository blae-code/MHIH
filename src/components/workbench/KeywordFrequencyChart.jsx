/**
 * KeywordFrequencyChart — horizontal bar chart of the most frequent
 * keywords in a text column (quantitative thematic view).
 */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
        <YAxis type="category" dataKey="word" width={110} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v) => [`${v} responses`, "Mentions"]}
          contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 11 }}
        />
        <Bar dataKey="count" fill="#40c4ff" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}