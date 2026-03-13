/**
 * LinkedEvidencePanel — shows linked evidence snapshot IDs and MHIH deep-links
 * Props: snapshotIds (string[]), mhihLinks (MhihLink[])
 */

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ExternalLink, Camera, ArrowRight } from "lucide-react";

export default function LinkedEvidencePanel({ snapshotIds = [], mhihLinks = [] }) {
  const hasContent = snapshotIds.length > 0 || mhihLinks.length > 0;
  if (!hasContent) {
    return (
      <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>
        No linked evidence.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {snapshotIds.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Evidence Snapshots
          </div>
          <div className="flex flex-wrap gap-2">
            {snapshotIds.map((id) => (
              <span
                key={id}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 10, fontWeight: 600,
                  color: "#40c4ff",
                  background: "rgba(64,196,255,0.1)",
                  border: "1px solid rgba(64,196,255,0.25)",
                  padding: "2px 8px", borderRadius: 4,
                }}
              >
                <Camera size={10} />
                {id}
              </span>
            ))}
          </div>
          <div className="mt-2">
            <Link
              to={createPageUrl("EvidenceSnapshots")}
              className="inline-flex items-center gap-1 text-xs"
              style={{ color: "#40c4ff", textDecoration: "none" }}
            >
              View in Evidence Snapshots <ArrowRight size={10} />
            </Link>
          </div>
        </div>
      )}

      {mhihLinks.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            MHIH Links
          </div>
          <div className="space-y-2">
            {mhihLinks.map((link, idx) => (
              <Link
                key={idx}
                to={createPageUrl(link.page)}
                className="flex items-start gap-2 p-2 rounded-lg"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={12} style={{ color: "#f59e0b", marginTop: 1, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{link.label}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{link.description}</div>
                </div>
                <ArrowRight size={11} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
