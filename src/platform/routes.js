/**
 * Red River OS — Route Map
 *
 * Maps logical page names (used throughout the codebase) to their canonical
 * URL paths within the Red River OS route structure.
 *
 * URL conventions:
 *   /os                              OS home
 *   /os/ministry                     Ministry Overview
 *   /os/settings                     Settings
 *   /os/apps/:appId                  App landing page
 *   /os/apps/:appId/:pageSlug        App inner page
 *
 * Usage:
 *   import { createPageUrl } from "@/utils";
 *   <Link to={createPageUrl("Dashboard")}>Dashboard</Link>
 *
 * When you add a new page:
 *   1. Create the page component in src/pages/
 *   2. Add a route entry here
 *   3. Register it in src/platform/appRegistry.js
 *   4. Add it to src/pages.config.js
 */

export const PAGE_ROUTE_MAP = {
  // ── OS level ──────────────────────────────────────────────────────────
  RedRiverOSHome: "/os",
  MinistryOverview: "/os/ministry",
  Settings: "/os/settings",
  Changelog: "/os/changelog",
  Onboarding: "/os/onboarding",

  // ── Data & Evidence app ───────────────────────────────────────────────
  Dashboard: "/os/apps/data-evidence",
  Visualizations: "/os/apps/data-evidence/visualizations",
  Reports: "/os/apps/data-evidence/reports",
  DataRepository: "/os/apps/data-evidence/repository",
  DataSources: "/os/apps/data-evidence/sources",
  MyDataSources: "/os/apps/data-evidence/my-sources",
  DataQuality: "/os/apps/data-evidence/quality",
  DataPrep: "/os/apps/data-evidence/prep",
  DataGovernance: "/os/apps/data-evidence/governance",
  Export: "/os/apps/data-evidence/export",
  MetricCatalog: "/os/apps/data-evidence/metric-catalog",
  MetricForge: "/os/apps/data-evidence/metric-forge",
  EvidenceSnapshots: "/os/apps/data-evidence/evidence-snapshots",
  RedRiverOS: "/os/apps/data-evidence/redriver-module",

  // ── Intelligence app ──────────────────────────────────────────────────
  AIInsights: "/os/apps/intelligence",
  DataAnalyst: "/os/apps/intelligence/analyst",
  PredictiveAnalytics: "/os/apps/intelligence/predictive",
  AgentCenter: "/os/apps/intelligence/agents",
  KnowledgeAdmin: "/os/apps/intelligence/knowledge",
  HansardIntel: "/os/apps/intelligence/hansard",

  // ── Policy Workbench app ──────────────────────────────────────────────
  PolicyLab: "/os/apps/policy-workbench",
  Recommendations: "/os/apps/policy-workbench/recommendations",
  Interventions: "/os/apps/policy-workbench/interventions",
  Backtesting: "/os/apps/policy-workbench/backtesting",
  EvidenceExplorer: "/os/apps/policy-workbench/evidence-explorer",
  ConflictWorkbench: "/os/apps/policy-workbench/conflict-workbench",
  GeoEquityMap: "/os/apps/policy-workbench/geo-equity",
  Watchlists: "/os/apps/policy-workbench/watchlists",
  AlertsCenter: "/os/apps/policy-workbench/alerts",
  ApprovalsInbox: "/os/apps/policy-workbench/approvals",
  Workflows: "/os/apps/policy-workbench/workflows",

  // ── Policy Intake ─────────────────────────────────────────────────────
  PolicyRequestTable: "/os/apps/policy-intake",
  PolicyRequestForm: "/os/apps/policy-intake/new",
  PolicyRequestCardView: "/os/apps/policy-intake/cards",

  // ── Scaffold apps (single landing page) ──────────────────────────────
  PlanningKPI: "/os/apps/planning-kpi",
  HealthEquity: "/os/apps/health-equity",
  ResearchEvaluation: "/os/apps/research-evaluation",
  ProvincialWellness: "/os/apps/provincial-wellness",
  ContractsReporting: "/os/apps/contracts-reporting",

  // ── Legacy / dropped from primary nav but still routable ─────────────
  // PolicyStudio was folded into Policy Workbench; keep the route so any
  // remaining links don't 404.
  PolicyStudio: "/os/apps/policy-workbench",

  // ── Shared admin (appears under any app for admins) ──────────────────
  Team: "/os/admin/team",
  Admin: "/os/admin",
};

/**
 * Reverse map: URL path → page name.
 * Used by Layout to derive currentPageName from the current URL.
 */
export const ROUTE_TO_PAGE_MAP = Object.fromEntries(
  Object.entries(PAGE_ROUTE_MAP).map(([page, route]) => [route, page])
);

/**
 * Resolve a page name to its canonical URL path.
 * Falls back to /${pageName} (old-style) if no mapping found.
 * @param {string} pageName
 * @returns {string}
 */
export function resolveRoute(pageName) {
  return PAGE_ROUTE_MAP[pageName] ?? `/${pageName}`;
}

/**
 * Resolve a URL path to its logical page name.
 * Falls back to stripping the leading slash.
 * @param {string} pathname
 * @returns {string}
 */
export function resolvePageName(pathname) {
  // Exact match
  if (ROUTE_TO_PAGE_MAP[pathname]) return ROUTE_TO_PAGE_MAP[pathname];
  // Fallback: strip leading slash for legacy routes
  return pathname.replace(/^\//, "");
}