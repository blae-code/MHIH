/**
 * Red River OS — Route Map
 *
 * Maps logical page names (used throughout the codebase) to their canonical
 * URL paths within the Red River OS route structure.
 *
 * URL conventions:
 *   /os                          OS home
 *   /os/ministry                 Ministry Overview
 *   /os/settings                 Settings
 *   /os/apps/:appId              App landing page
 *   /os/apps/:appId/:pageSlug    App inner page
 *
 * Usage:
 *   import { createPageUrl } from "@/utils";
 *   <Link to={createPageUrl("Dashboard")}>Dashboard</Link>
 *   // → /os/apps/mhih
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

  // ── MHIH app — workspace ──────────────────────────────────────────────
  Dashboard: "/os/apps/mhih",
  DataRepository: "/os/apps/mhih/data-repository",
  Visualizations: "/os/apps/mhih/visualizations",
  AIInsights: "/os/apps/mhih/ai-insights",
  DataAnalyst: "/os/apps/mhih/ai-analyst",

  // ── MHIH app — Red River module ───────────────────────────────────────
  RedRiverOS: "/os/apps/mhih/redriver-module",
  MetricCatalog: "/os/apps/mhih/metric-catalog",
  MetricForge: "/os/apps/mhih/metric-forge",
  EvidenceSnapshots: "/os/apps/mhih/evidence-snapshots",

  // ── MHIH app — policy ─────────────────────────────────────────────────
  PolicyLab: "/os/apps/mhih/policy-lab",
  Recommendations: "/os/apps/mhih/recommendations",
  Watchlists: "/os/apps/mhih/watchlists",
  Interventions: "/os/apps/mhih/interventions",
  ApprovalsInbox: "/os/apps/mhih/approvals",
  Backtesting: "/os/apps/mhih/backtesting",
  ConflictWorkbench: "/os/apps/mhih/conflict-workbench",
  EvidenceExplorer: "/os/apps/mhih/evidence-explorer",
  AlertsCenter: "/os/apps/mhih/alerts-center",
  GeoEquityMap: "/os/apps/mhih/geo-equity",
  KnowledgeAdmin: "/os/apps/mhih/knowledge-admin",
  HansardIntel: "/os/apps/mhih/hansard",

  // ── MHIH app — data ───────────────────────────────────────────────────
  DataSources: "/os/apps/mhih/data-sources",
  MyDataSources: "/os/apps/mhih/my-sources",
  DataQuality: "/os/apps/mhih/data-quality",
  AgentCenter: "/os/apps/mhih/ai-agents",
  Export: "/os/apps/mhih/export",

  // ── MHIH app — analytics ─────────────────────────────────────────────
  PredictiveAnalytics: "/os/apps/mhih/predictive",
  GeoMap: "/os/apps/mhih/geo-map",
  Alerts: "/os/apps/mhih/alerts",
  DataPrep: "/os/apps/mhih/data-prep",
  Workflows: "/os/apps/mhih/workflows",
  DataGovernance: "/os/apps/mhih/data-governance",
  Reports: "/os/apps/mhih/reports",

  // ── MHIH app — admin ─────────────────────────────────────────────────
  Team: "/os/apps/mhih/team",
  Admin: "/os/apps/mhih/admin",

  // ── Policy Intake and Management ──────────────────────────────────────
  PolicyRequestTable: "/os/apps/policy-intake",
  PolicyRequestForm: "/os/apps/policy-intake/new",
  PolicyRequestCardView: "/os/apps/policy-intake/cards",

  // ── Platform app modules ──────────────────────────────────────────────
  PolicyStudio: "/os/apps/policy-studio",
  HealthEquity: "/os/apps/health-equity",
  ResearchEvaluation: "/os/apps/research-evaluation",
  ProvincialWellness: "/os/apps/provincial-wellness",
  ContractsReporting: "/os/apps/contracts-reporting",
  PlanningKPI: "/os/apps/planning-kpi",
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