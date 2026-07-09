/**
 * MetricMethodologyPanel — provenance strip shown for every metric:
 * data source, collection date, methodology, and relevant policy
 * frameworks, so the basis for each finding is always transparent.
 */

import React from "react";
import { Database, CalendarDays, BookOpen, Scale, ShieldCheck } from "lucide-react";

const CONF_COLOR = { high: "#00e676", medium: "#ffab40", low: "#ff1744" };

function Field({ icon: FieldIcon, label, children }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 mb-0.5"
        style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        <FieldIcon size={9} /> {label}
      </div>
      <div className="text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>{children}</div>
    </div>
  );
}

const NotDocumented = () => (
  <span style={{ color: "var(--text-muted)", fontStyle: "italic", opacity: 0.7 }}>Not documented</span>
);

export default function MetricMethodologyPanel({ metric }) {
  if (!metric) return null;
  const frameworks = metric.policy_frameworks || [];
  const confColor = CONF_COLOR[metric.confidence_level] || CONF_COLOR.medium;

  return (
    <div className="rounded-lg p-3"
      style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
      <div className="flex items-center gap-1.5 mb-2.5"
        style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#40c4ff" }}>
        <BookOpen size={10} /> Methodology & Provenance
        {metric.confidence_level && (
          <span className="ml-auto inline-flex items-center gap-1 capitalize px-1.5 py-0.5 rounded"
            style={{ fontSize: 8.5, color: confColor, background: `${confColor}14`, border: `1px solid ${confColor}35`, letterSpacing: "0.05em" }}>
            <ShieldCheck size={8} /> {metric.confidence_level} confidence
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field icon={Database} label="Source">
          {metric.data_source_name || <NotDocumented />}
        </Field>

        <Field icon={CalendarDays} label="Collection Date">
          {metric.collection_date
            ? metric.collection_date
            : metric.year
              ? <>Reference year {metric.year} <span style={{ color: "var(--text-muted)" }}>(exact date not recorded)</span></>
              : <NotDocumented />}
        </Field>

        <Field icon={BookOpen} label="Methodology">
          {metric.methodology || <NotDocumented />}
        </Field>

        <Field icon={Scale} label="Policy Frameworks">
          {frameworks.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {frameworks.map((f) => (
                <span key={f} className="px-1.5 py-0.5 rounded"
                  style={{ fontSize: 9.5, fontWeight: 600, color: "#FEDD00", background: "rgba(254,221,0,0.08)", border: "1px solid rgba(254,221,0,0.25)" }}>
                  {f}
                </span>
              ))}
            </span>
          ) : <NotDocumented />}
        </Field>
      </div>

      {metric.notes && (
        <div className="mt-2.5 pt-2 text-xs" style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
          <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Analyst notes: </span>{metric.notes}
        </div>
      )}
    </div>
  );
}