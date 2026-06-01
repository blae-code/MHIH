/**
 * Red River OS — Permissions & RBAC
 *
 * Centralised permission checks. All feature-gating should go through this
 * module rather than scattering ad-hoc role checks across pages.
 *
 * Current implementation is intentionally simple: role-based with a small
 * permission table. Evolve toward resource-level ACLs as the platform matures.
 */

import { ROLES, GOVERNANCE_ROLES } from "./appRegistry";

// ── Permission identifiers ─────────────────────────────────────────────────
export const PERMISSIONS = {
  // App access
  ACCESS_DATA_EVIDENCE: "access:data-evidence",
  ACCESS_INTELLIGENCE: "access:intelligence",
  ACCESS_POLICY_WORKBENCH: "access:policy-workbench",
  ACCESS_POLICY_INTAKE: "access:policy-intake",
  ACCESS_HEALTH_EQUITY: "access:health-equity",
  ACCESS_RESEARCH_EVAL: "access:research-evaluation",
  ACCESS_PROVINCIAL_WELLNESS: "access:provincial-wellness",
  ACCESS_CONTRACTS: "access:contracts-reporting",
  ACCESS_PLANNING: "access:planning-kpi",

  // ── Back-compat aliases (do not use in new code) ──
  /** @deprecated use ACCESS_DATA_EVIDENCE / ACCESS_INTELLIGENCE / ACCESS_POLICY_WORKBENCH */
  ACCESS_MHIH: "access:data-evidence",
  /** @deprecated use ACCESS_POLICY_WORKBENCH */
  ACCESS_POLICY_STUDIO: "access:policy-workbench",

  // Governance actions
  APPROVE_POLICY: "approve:policy",
  APPROVE_RECOMMENDATION: "approve:recommendation",
  APPROVE_REPORT: "approve:report",
  APPROVE_BUDGET: "approve:budget",

  // Data actions
  EDIT_METRICS: "edit:metrics",
  MANAGE_DATA_SOURCES: "manage:data-sources",
  MANAGE_AGENTS: "manage:agents",
  EXPORT_SENSITIVE: "export:sensitive",

  // Admin
  MANAGE_TEAM: "manage:team",
  MANAGE_SETTINGS: "manage:settings",
  VIEW_AUDIT_LOG: "view:audit-log",
  ADMIN_PANEL: "access:admin",
};

// ── Role → permission mapping ──────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin has everything

  [ROLES.EXECUTIVE]: [
    PERMISSIONS.ACCESS_DATA_EVIDENCE,
    PERMISSIONS.ACCESS_INTELLIGENCE,
    PERMISSIONS.ACCESS_POLICY_WORKBENCH,
    PERMISSIONS.ACCESS_POLICY_INTAKE,
    PERMISSIONS.ACCESS_HEALTH_EQUITY,
    PERMISSIONS.ACCESS_RESEARCH_EVAL,
    PERMISSIONS.ACCESS_PROVINCIAL_WELLNESS,
    PERMISSIONS.ACCESS_CONTRACTS,
    PERMISSIONS.ACCESS_PLANNING,
    PERMISSIONS.APPROVE_POLICY,
    PERMISSIONS.APPROVE_RECOMMENDATION,
    PERMISSIONS.APPROVE_REPORT,
    PERMISSIONS.APPROVE_BUDGET,
    PERMISSIONS.VIEW_AUDIT_LOG,
  ],

  [ROLES.DIRECTOR]: [
    PERMISSIONS.ACCESS_DATA_EVIDENCE,
    PERMISSIONS.ACCESS_INTELLIGENCE,
    PERMISSIONS.ACCESS_POLICY_WORKBENCH,
    PERMISSIONS.ACCESS_POLICY_INTAKE,
    PERMISSIONS.ACCESS_HEALTH_EQUITY,
    PERMISSIONS.ACCESS_RESEARCH_EVAL,
    PERMISSIONS.ACCESS_PROVINCIAL_WELLNESS,
    PERMISSIONS.ACCESS_CONTRACTS,
    PERMISSIONS.ACCESS_PLANNING,
    PERMISSIONS.APPROVE_POLICY,
    PERMISSIONS.APPROVE_RECOMMENDATION,
    PERMISSIONS.APPROVE_REPORT,
    PERMISSIONS.VIEW_AUDIT_LOG,
  ],

  [ROLES.SENIOR_MANAGER]: [
    PERMISSIONS.ACCESS_DATA_EVIDENCE,
    PERMISSIONS.ACCESS_INTELLIGENCE,
    PERMISSIONS.ACCESS_POLICY_WORKBENCH,
    PERMISSIONS.ACCESS_POLICY_INTAKE,
    PERMISSIONS.ACCESS_HEALTH_EQUITY,
    PERMISSIONS.ACCESS_RESEARCH_EVAL,
    PERMISSIONS.ACCESS_PROVINCIAL_WELLNESS,
    PERMISSIONS.ACCESS_CONTRACTS,
    PERMISSIONS.ACCESS_PLANNING,
    PERMISSIONS.APPROVE_RECOMMENDATION,
    PERMISSIONS.EDIT_METRICS,
    PERMISSIONS.VIEW_AUDIT_LOG,
  ],

  [ROLES.PROGRAM_MANAGER]: [
    PERMISSIONS.ACCESS_DATA_EVIDENCE,
    PERMISSIONS.ACCESS_INTELLIGENCE,
    PERMISSIONS.ACCESS_POLICY_WORKBENCH,
    PERMISSIONS.ACCESS_POLICY_INTAKE,
    PERMISSIONS.ACCESS_HEALTH_EQUITY,
    PERMISSIONS.ACCESS_PROVINCIAL_WELLNESS,
    PERMISSIONS.ACCESS_CONTRACTS,
    PERMISSIONS.ACCESS_PLANNING,
    PERMISSIONS.EDIT_METRICS,
    PERMISSIONS.MANAGE_DATA_SOURCES,
  ],

  [ROLES.ANALYST]: [
    PERMISSIONS.ACCESS_DATA_EVIDENCE,
    PERMISSIONS.ACCESS_INTELLIGENCE,
    PERMISSIONS.ACCESS_POLICY_WORKBENCH,
    PERMISSIONS.ACCESS_RESEARCH_EVAL,
    PERMISSIONS.ACCESS_PLANNING,
    PERMISSIONS.EDIT_METRICS,
    PERMISSIONS.MANAGE_DATA_SOURCES,
    PERMISSIONS.MANAGE_AGENTS,
    PERMISSIONS.EXPORT_SENSITIVE,
  ],

  [ROLES.COORDINATOR]: [
    PERMISSIONS.ACCESS_DATA_EVIDENCE,
    PERMISSIONS.ACCESS_POLICY_WORKBENCH,
    PERMISSIONS.ACCESS_POLICY_INTAKE,
    PERMISSIONS.ACCESS_CONTRACTS,
    PERMISSIONS.ACCESS_PLANNING,
  ],

  [ROLES.RESEARCH_STAFF]: [
    PERMISSIONS.ACCESS_DATA_EVIDENCE,
    PERMISSIONS.ACCESS_INTELLIGENCE,
    PERMISSIONS.ACCESS_RESEARCH_EVAL,
    PERMISSIONS.EDIT_METRICS,
    PERMISSIONS.MANAGE_DATA_SOURCES,
    PERMISSIONS.EXPORT_SENSITIVE,
  ],

  [ROLES.COMMUNITY_STAFF]: [
    PERMISSIONS.ACCESS_DATA_EVIDENCE,
    PERMISSIONS.ACCESS_PROVINCIAL_WELLNESS,
    PERMISSIONS.ACCESS_HEALTH_EQUITY,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.ACCESS_DATA_EVIDENCE,
    PERMISSIONS.ACCESS_PLANNING,
  ],

  // base44 default role — same as coordinator for now
  [ROLES.USER]: [
    PERMISSIONS.ACCESS_DATA_EVIDENCE,
    PERMISSIONS.ACCESS_INTELLIGENCE,
    PERMISSIONS.ACCESS_POLICY_WORKBENCH,
    PERMISSIONS.ACCESS_POLICY_INTAKE,
    PERMISSIONS.ACCESS_HEALTH_EQUITY,
    PERMISSIONS.ACCESS_RESEARCH_EVAL,
    PERMISSIONS.ACCESS_PROVINCIAL_WELLNESS,
    PERMISSIONS.ACCESS_CONTRACTS,
    PERMISSIONS.ACCESS_PLANNING,
    PERMISSIONS.EDIT_METRICS,
    PERMISSIONS.MANAGE_DATA_SOURCES,
  ],
};

// ── Core permission check ──────────────────────────────────────────────────

/**
 * Check if a user has a specific permission.
 * @param {{ role?: string } | null} user
 * @param {string} permission
 * @returns {boolean}
 */
export function can(user, permission) {
  if (!user) return false;
  const role = user.role ?? ROLES.USER;
  const perms = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS[ROLES.USER];
  return perms.includes(permission);
}

/**
 * Check if a user has ALL of the given permissions.
 * @param {{ role?: string } | null} user
 * @param {string[]} permissions
 */
export function canAll(user, permissions) {
  return permissions.every((p) => can(user, p));
}

/**
 * Check if a user has ANY of the given permissions.
 * @param {{ role?: string } | null} user
 * @param {string[]} permissions
 */
export function canAny(user, permissions) {
  return permissions.some((p) => can(user, p));
}

/** Convenience: is the user an admin? */
export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}

/** Convenience: is the user in a governance role? */
export function isGovernanceRole(user) {
  return GOVERNANCE_ROLES.includes(user?.role);
}

/**
 * Returns a display-friendly label for a role.
 * @param {string} role
 */
export function getRoleLabel(role) {
  const labels = {
    [ROLES.ADMIN]: "Administrator",
    [ROLES.EXECUTIVE]: "Executive",
    [ROLES.DIRECTOR]: "Director",
    [ROLES.SENIOR_MANAGER]: "Senior Manager",
    [ROLES.PROGRAM_MANAGER]: "Program Manager",
    [ROLES.ANALYST]: "Analyst",
    [ROLES.COORDINATOR]: "Coordinator",
    [ROLES.RESEARCH_STAFF]: "Research Staff",
    [ROLES.COMMUNITY_STAFF]: "Community Staff",
    [ROLES.VIEWER]: "Viewer",
    [ROLES.USER]: "Staff",
  };
  return labels[role] ?? role ?? "Staff";
}