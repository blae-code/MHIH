/**
 * Shared constants for the Métis policy lifecycle and registry chips.
 */

export const LIFECYCLE_STAGES = [
  {
    key: "recherche",
    label: "Rechèrche",
    description: "Research, evidence scanning, and environmental analysis.",
    color: "#a78bfa",
    detail: "Grounded in Métis ways of knowing — gathering evidence, environmental scan, community context, and existing literature before any policy direction is set.",
  },
  {
    key: "kashkihtamowin",
    label: "Kashkihtamowin",
    description: "Building capacity and internal readiness.",
    color: "#40c4ff",
    detail: "Ensuring the ministry and its teams have the knowledge, tools, and capacity to lead the policy process — training, resource allocation, and internal alignment.",
  },
  {
    key: "kiinaymaakinan",
    label: "Kiinaymaakinan",
    description: "Relationship building with partners and communities.",
    color: "#34d399",
    detail: "Establishing or deepening trust with health authorities, federal partners, community organizations, and Métis citizens before formal consultation begins.",
  },
  {
    key: "li-liain",
    label: "Li Liain",
    description: "Dialogue, consultation, and community engagement.",
    color: "#FEDD00",
    detail: "Meaningful, structured engagement with Métis communities, citizens, and rights holders. Consent and input — not just information-sharing — drive the direction.",
  },
  {
    key: "apoorbaa",
    label: "Apoorbaa",
    description: "Decision-making and formal resolution.",
    color: "#fb923c",
    detail: "Governance bodies deliberate and reach a formal decision. Cultural review, legal analysis, equity assessment, and leadership signoff all occur here.",
  },
  {
    key: "apihtowachik",
    label: "Apihtowachik",
    description: "Implementation and operationalisation.",
    color: "#f472b6",
    detail: "The policy moves into practice — coordination with partners, resource deployment, training, and systems integration.",
  },
  {
    key: "nispaahtoon",
    label: "Nispaahtoon",
    description: "Monitoring, accountability, and continuous improvement.",
    color: "#00e676",
    detail: "Ongoing measurement of outcomes against the policy's goals. Accountability to the community, reporting cycles, and learning loops to refine the approach.",
  },
];

export const STATUS_CONFIG = {
  active: { label: "Active", color: "#00e676" },
  "in-progress": { label: "In Progress", color: "#40c4ff" },
  monitoring: { label: "Monitoring", color: "#a78bfa" },
  review: { label: "In Review", color: "#FEDD00" },
  draft: { label: "Draft", color: "#8bafd4" },
  archived: { label: "Archived", color: "#4a6a8a" },
};

export const CATEGORY_OPTIONS = [
  "chronic_disease",
  "mental_health",
  "substance_use",
  "maternal_child",
  "social_determinants",
  "demographics",
  "mortality",
  "access_to_care",
  "other",
];

export function StageChipStyle(stage) {
  return {
    fontSize: 10,
    fontWeight: 600,
    color: stage.color,
    background: stage.color + "18",
    border: `1px solid ${stage.color}33`,
    padding: "2px 7px",
    borderRadius: 4,
    whiteSpace: "nowrap",
  };
}