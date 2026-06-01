/**
 * mediumVisuals — visual metadata for the DataSource.medium field.
 * The medium describes WHAT kind of artefact a source is (table, report, RSS feed, etc.)
 * which controls UI affordances like whether Sync makes sense.
 */
import {
  Table2, FileText, Rss, Plug, Database, FileType2, Map, Box,
} from "lucide-react";

const MEDIUM_VISUALS = {
  table:     { color: "#40c4ff", icon: Table2,    label: "Table",     resyncable: true,  hint: "Structured rows" },
  dataset:   { color: "#00e676", icon: Database,  label: "Dataset",   resyncable: true,  hint: "Bulk records" },
  api:       { color: "#a78bfa", icon: Plug,      label: "API",       resyncable: true,  hint: "Live endpoint" },
  rss_feed:  { color: "#ffab40", icon: Rss,       label: "RSS Feed",  resyncable: true,  hint: "News / updates" },
  report:    { color: "#ff5f6d", icon: FileText,  label: "Report",    resyncable: false, hint: "Static publication" },
  document:  { color: "#f472b6", icon: FileType2, label: "Document",  resyncable: false, hint: "Standalone file" },
  map_layer: { color: "#34d399", icon: Map,       label: "Map Layer", resyncable: true,  hint: "Geospatial layer" },
  other:     { color: "#8bafd4", icon: Box,       label: "Other",     resyncable: true,  hint: "Misc artefact" },
};

const DEFAULT = MEDIUM_VISUALS.dataset;

export const MEDIUM_OPTIONS = Object.keys(MEDIUM_VISUALS);

export function getMediumVisuals(medium) {
  return MEDIUM_VISUALS[medium] || DEFAULT;
}

/** Heuristic to infer medium when not explicitly set (legacy records). */
export function inferMedium(src) {
  if (src?.medium) return src.medium;
  const meta = src?.metadata || {};
  if (meta.provider === "googlebigquery") return "table";
  if (meta.feed_type === "rss" || src?.url?.match(/\.(rss|xml)$/i) || src?.url?.includes("/rss")) return "rss_feed";
  if (src?.type === "api") return "api";
  if (meta.layer_type || meta.service_type === "wms" || meta.service_type === "wfs") return "map_layer";
  return "dataset";
}