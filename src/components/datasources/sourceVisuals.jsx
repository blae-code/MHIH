/**
 * sourceVisuals — provider-aware visual metadata for DataSource cards.
 * Maps a source's type (and metadata.provider for sub-providers like BigQuery)
 * to a brand-flavoured accent colour, gradient, and Lucide icon.
 */
import {
  Database, Cloud, Globe, FileSpreadsheet, MapPin, Pill,
  Activity, Server, Layers,
} from "lucide-react";

const PROVIDER_VISUALS = {
  // Sub-providers (matched on metadata.provider)
  googlebigquery: { color: "#4285F4", gradient: ["#4285F4", "#34A853"], icon: Database, label: "BigQuery" },

  // DataSource.type values
  statcan:        { color: "#e53935", gradient: ["#e53935", "#ff7043"], icon: Activity,         label: "StatsCan" },
  bc_health:      { color: "#1565c0", gradient: ["#1565c0", "#40c4ff"], icon: Activity,         label: "BC Health" },
  fnha:           { color: "#7e57c2", gradient: ["#7e57c2", "#a78bfa"], icon: Layers,           label: "FNHA" },
  manual_upload:  { color: "#FEDD00", gradient: ["#FEDD00", "#ffab40"], icon: FileSpreadsheet,  label: "Upload" },
  api:            { color: "#00e676", gradient: ["#00e676", "#40c4ff"], icon: Server,           label: "API" },
  other:          { color: "#8bafd4", gradient: ["#8bafd4", "#40c4ff"], icon: Globe,            label: "Source" },
};

const DEFAULT = { color: "#8bafd4", gradient: ["#8bafd4", "#40c4ff"], icon: Database, label: "Source" };

export function getSourceVisuals(src) {
  if (!src) return DEFAULT;
  const provider = src.metadata?.provider;
  if (provider && PROVIDER_VISUALS[provider]) return PROVIDER_VISUALS[provider];
  return PROVIDER_VISUALS[src.type] || DEFAULT;
}