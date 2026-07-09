/**
 * Red River OS — App Registry
 *
 * Central manifest of all platform applications. Each app entry defines:
 *   - identity (id, name, description, icon, accent)
 *   - routing (the page names it owns, its primary landing page)
 *   - navigation (the sub-nav items shown when the app is active)
 *   - access (which roles can enter the app)
 *   - status (active | scaffold | planned)
 *
 * Adding a new app: add an entry here, create the page file(s), and register
 * the pages in pages.config.js. The shell wires up everything else.
 *
 * ── Organization principles ──
 *   1. Each app has a single, focused purpose (one user job-to-be-done).
 *   2. Sidebar nav for an app should fit comfortably without scrolling
 *      (target: ≤ 12 items, including section labels).
 *   3. Scaffold apps show only their landing page until built out — no
 *      anchor-only ghost links.
 *   4. Pages appear in exactly ONE app (no cross-listing).
 */

// ── App status constants ───────────────────────────────────────────────────
export const APP_STATUS = {
  ACTIVE: "active",       // fully functional
  SCAFFOLD: "scaffold",   // skeleton structure in place, minimal content
  PLANNED: "planned",     // registered but not yet built
};

// ── Role constants ─────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: "admin",
  EXECUTIVE: "executive",
  DIRECTOR: "director",
  SENIOR_MANAGER: "senior_manager",
  PROGRAM_MANAGER: "program_manager",
  ANALYST: "analyst",
  COORDINATOR: "coordinator",
  RESEARCH_STAFF: "research_staff",
  COMMUNITY_STAFF: "community_staff",
  VIEWER: "viewer",
  USER: "user", // base44 default role — treated as coordinator-level
};

// Convenience: all roles that can access the platform
export const ALL_ROLES = Object.values(ROLES);

// Roles with write/approval rights
export const GOVERNANCE_ROLES = [
  ROLES.ADMIN,
  ROLES.EXECUTIVE,
  ROLES.DIRECTOR,
  ROLES.SENIOR_MANAGER,
];

// ── Shared admin nav (appears in any app for admins) ───────────────────────
const SHARED_ADMIN_NAV = [
  { label: "Team", page: "Team", icon: "Users" },
  { label: "Admin Panel", page: "Admin", icon: "Shield" },
  { label: "Settings", page: "Settings", icon: "Settings" },
  { label: "Changelog", page: "Changelog", icon: "BookOpen" },
];

// ── App Registry ───────────────────────────────────────────────────────────
export const APP_REGISTRY = [
  // ── OS-level entries (always visible, not "apps" per se) ──────────────
  {
    id: "os-home",
    name: "Red River OS",
    shortName: "Home",
    description: "Ministry operating environment — home and strategic overview",
    icon: "Command",
    accent: "#FEDD00",
    landingPage: "RedRiverOSHome",
    status: APP_STATUS.ACTIVE,
    roles: ALL_ROLES,
    isOsLevel: true,
    navItems: [
      { label: "Home", page: "RedRiverOSHome", icon: "LayoutDashboard" },
      { label: "Ministry Overview", page: "MinistryOverview", icon: "Building2" },
    ],
  },

  // ── Data & Evidence ───────────────────────────────────────────────────
  // The data foundation: ingest, govern, model, and surface evidence.
  {
    id: "data-evidence",
    name: "Data & Evidence",
    shortName: "Data & Evidence",
    description:
      "Ingest, govern, model, and surface health data — the evidence backbone of the ministry.",
    icon: "Database",
    accent: "#40c4ff",
    landingPage: "Dashboard",
    status: APP_STATUS.ACTIVE,
    roles: ALL_ROLES,
    navItems: [
      {
        section: "Overview",
        items: [
          { label: "Dashboard", page: "Dashboard", icon: "LayoutDashboard" },
          { label: "Visualizations", page: "Visualizations", icon: "BarChart3" },
          { label: "Reports", page: "Reports", icon: "FileDown" },
          { label: "Analysis Workbench", page: "AnalysisWorkbench", icon: "FlaskConical" },
        ],
      },
      {
        section: "Data Foundation",
        items: [
          { label: "Data Repository", page: "DataRepository", icon: "Database" },
          { label: "Data Sources", page: "DataSources", icon: "BookOpen" },
          { label: "My Sources", page: "MyDataSources", icon: "Database" },
          { label: "Data Quality", page: "DataQuality", icon: "ShieldCheck" },
          { label: "Data Prep", page: "DataPrep", icon: "Wrench" },
          { label: "Governance", page: "DataGovernance", icon: "Shield" },
          { label: "Export", page: "Export", icon: "FileDown" },
        ],
      },
      {
        section: "Metrics & Evidence",
        items: [
          { label: "Metric Catalog", page: "MetricCatalog", icon: "Database" },
          { label: "Metric Forge", page: "MetricForge", icon: "SlidersHorizontal" },
          { label: "Evidence Snapshots", page: "EvidenceSnapshots", icon: "Camera" },
          { label: "Red River Module", page: "RedRiverOS", icon: "Layers3" },
        ],
      },
    ],
    adminNavItems: SHARED_ADMIN_NAV,
  },

  // ── Intelligence ──────────────────────────────────────────────────────
  // AI-driven analysis, agents, and predictive work.
  {
    id: "intelligence",
    name: "Intelligence",
    shortName: "Intelligence",
    description:
      "AI insights, autonomous agents, predictive analytics, and knowledge intelligence.",
    icon: "Brain",
    accent: "#a78bfa",
    landingPage: "AIInsights",
    status: APP_STATUS.ACTIVE,
    roles: ALL_ROLES,
    navItems: [
      {
        section: "Analysis",
        items: [
          { label: "AI Insights", page: "AIInsights", icon: "Brain" },
          { label: "AI Analyst", page: "DataAnalyst", icon: "Sparkles" },
          { label: "Predictive Analytics", page: "PredictiveAnalytics", icon: "TrendingUp" },
        ],
      },
      {
        section: "Knowledge & Agents",
        items: [
          { label: "AI Agents", page: "AgentCenter", icon: "Bot" },
          { label: "Knowledge Admin", page: "KnowledgeAdmin", icon: "BookMarked" },
          { label: "Hansard Intel", page: "HansardIntel", icon: "FileText" },
        ],
      },
    ],
    adminNavItems: SHARED_ADMIN_NAV,
  },

  // ── Policy ────────────────────────────────────────────────────────────
  // The full policy lifecycle in one app: intake → develop → evidence →
  // monitor. (Merged from the former Policy Workbench + Policy Intake apps.)
  {
    id: "policy-workbench",
    name: "Policy",
    shortName: "Policy",
    description:
      "The full policy lifecycle — request intake, development labs, evidence, recommendations, approvals, and monitoring.",
    icon: "Scale",
    accent: "#f472b6",
    landingPage: "PolicyHome",
    status: APP_STATUS.ACTIVE,
    roles: ALL_ROLES,
    navItems: [
      {
        section: "Overview",
        items: [
          { label: "Policy Home", page: "PolicyHome", icon: "LayoutDashboard" },
          { label: "Policy Studio", page: "PolicyStudio", icon: "Scale" },
        ],
      },
      {
        section: "Intake",
        items: [
          { label: "New Request", page: "PolicyRequestForm", icon: "FileSignature" },
          { label: "Requests — Table", page: "PolicyRequestTable", icon: "ClipboardCheck" },
          { label: "Requests — Cards", page: "PolicyRequestCardView", icon: "Layers3" },
        ],
      },
      {
        section: "Develop",
        items: [
          { label: "Policy Lab", page: "PolicyLab", icon: "FlaskConical" },
          { label: "Recommendations", page: "Recommendations", icon: "ListOrdered" },
          { label: "Interventions", page: "Interventions", icon: "Activity" },
          { label: "Backtesting", page: "Backtesting", icon: "BrainCircuit" },
        ],
      },
      {
        section: "Evidence",
        items: [
          { label: "Evidence Explorer", page: "EvidenceExplorer", icon: "Link2" },
          { label: "Conflict Workbench", page: "ConflictWorkbench", icon: "GitCompare" },
          { label: "Geo Equity Map", page: "GeoEquityMap", icon: "MapPinned" },
        ],
      },
      {
        section: "Monitor",
        items: [
          { label: "Watchlists", page: "Watchlists", icon: "BellRing" },
          { label: "Alerts Center", page: "AlertsCenter", icon: "Siren" },
          { label: "Approvals Inbox", page: "ApprovalsInbox", icon: "ClipboardCheck" },
          { label: "Workflows", page: "Workflows", icon: "Workflow" },
        ],
      },
    ],
    adminNavItems: SHARED_ADMIN_NAV,
  },

  // ── Planning & KPIs ───────────────────────────────────────────────────
  // Strategic planning, goals, and KPI tracking.
  {
    id: "planning-kpi",
    name: "Planning & KPIs",
    shortName: "Planning",
    description:
      "Ministry and department goals, action items, milestones, and KPI dashboards.",
    icon: "Target",
    accent: "#f59e0b",
    landingPage: "PlanningKPI",
    status: APP_STATUS.SCAFFOLD,
    roles: ALL_ROLES,
    navItems: [
      { label: "Overview", page: "PlanningKPI", icon: "LayoutDashboard" },
    ],
    adminNavItems: SHARED_ADMIN_NAV,
  },

  // ── Health Equity ─────────────────────────────────────────────────────
  {
    id: "health-equity",
    name: "Health Equity",
    shortName: "Equity",
    description:
      "Anti-racism initiatives, systems barriers, complaints process, and health authority workplan coordination.",
    icon: "HeartHandshake",
    accent: "#34d399",
    landingPage: "HealthEquity",
    status: APP_STATUS.SCAFFOLD,
    roles: ALL_ROLES,
    navItems: [
      { label: "Overview", page: "HealthEquity", icon: "LayoutDashboard" },
    ],
    adminNavItems: SHARED_ADMIN_NAV,
  },

  // ── Research & Evaluation ─────────────────────────────────────────────
  {
    id: "research-evaluation",
    name: "Research & Evaluation",
    shortName: "Research",
    description:
      "Research projects, evaluation plans, metrics frameworks, data governance, and ROI methodology.",
    icon: "FlaskConical",
    accent: "#c084fc",
    landingPage: "ResearchEvaluation",
    status: APP_STATUS.SCAFFOLD,
    roles: ALL_ROLES,
    navItems: [
      { label: "Overview", page: "ResearchEvaluation", icon: "LayoutDashboard" },
    ],
    adminNavItems: SHARED_ADMIN_NAV,
  },

  // ── Provincial Wellness ───────────────────────────────────────────────
  {
    id: "provincial-wellness",
    name: "Provincial Wellness",
    shortName: "Wellness",
    description:
      "Community-facing health initiatives, wellness workshops, health promotion, and regional coordination.",
    icon: "Leaf",
    accent: "#4ade80",
    landingPage: "ProvincialWellness",
    status: APP_STATUS.SCAFFOLD,
    roles: ALL_ROLES,
    navItems: [
      { label: "Overview", page: "ProvincialWellness", icon: "LayoutDashboard" },
    ],
    adminNavItems: SHARED_ADMIN_NAV,
  },

  // ── Contracts & Reporting ─────────────────────────────────────────────
  {
    id: "contracts-reporting",
    name: "Contracts & Reporting",
    shortName: "Contracts",
    description:
      "Contribution agreements, deliverables, reporting deadlines, budget tracking, and cashflow forecasting.",
    icon: "FileSignature",
    accent: "#fb923c",
    landingPage: "ContractsReporting",
    status: APP_STATUS.SCAFFOLD,
    roles: ALL_ROLES,
    navItems: [
      { label: "Overview", page: "ContractsReporting", icon: "LayoutDashboard" },
    ],
    adminNavItems: SHARED_ADMIN_NAV,
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────

/** @param {string} appId */
export function getApp(appId) {
  return APP_REGISTRY.find((a) => a.id === appId) ?? null;
}

/** Returns all non-OS-level apps (shown in app switcher) */
export function getApps() {
  return APP_REGISTRY.filter((a) => !a.isOsLevel);
}

/** Returns apps the given role can access */
export function getAccessibleApps(role) {
  return APP_REGISTRY.filter(
    (a) => !a.isOsLevel && a.roles.includes(role ?? ROLES.USER)
  );
}

/**
 * Given a page name, return the app that owns it.
 * Falls back to the Data & Evidence app for legacy pages not explicitly claimed.
 */
export function getAppForPage(pageName) {
  for (const app of APP_REGISTRY) {
    if (app.landingPage === pageName) return app;
    const flatItems = (app.navItems ?? []).flatMap((s) =>
      Array.isArray(s.items) ? s.items : [s]
    );
    if (flatItems.some((i) => i.page === pageName)) return app;
    if ((app.adminNavItems ?? []).some((i) => i.page === pageName)) return app;
  }
  // Default: Data & Evidence owns unclaimed pages
  return getApp("data-evidence");
}