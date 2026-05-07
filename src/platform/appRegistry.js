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
      { label: "Planning & KPIs", page: "PlanningKPI", icon: "Target" },
    ],
  },

  // ── MHIH — Métis Health Implementation Hub ────────────────────────────
  {
    id: "mhih",
    name: "Métis Health Implementation Hub",
    shortName: "MHIH",
    description:
      "Health metrics, data governance, analytics, and evidence platform for MNBC health implementation.",
    icon: "HeartPulse",
    accent: "#40c4ff",
    landingPage: "Dashboard",
    status: APP_STATUS.ACTIVE,
    roles: ALL_ROLES,
    navItems: [
      {
        section: "Workspace",
        items: [
          { label: "Dashboard", page: "Dashboard", icon: "LayoutDashboard" },
          { label: "Data Repository", page: "DataRepository", icon: "Database" },
          { label: "Visualizations", page: "Visualizations", icon: "BarChart3" },
          { label: "AI Insights", page: "AIInsights", icon: "Brain" },
          { label: "AI Analyst", page: "DataAnalyst", icon: "Sparkles" },
        ],
      },
      {
        section: "Red River Module",
        items: [
          { label: "Red River OS", page: "RedRiverOS", icon: "Layers3" },
          { label: "Metric Catalog", page: "MetricCatalog", icon: "Database" },
          { label: "Metric Forge", page: "MetricForge", icon: "SlidersHorizontal" },
          { label: "Evidence Snapshots", page: "EvidenceSnapshots", icon: "Camera" },
        ],
      },
      {
        section: "Policy",
        items: [
          { label: "Policy Lab", page: "PolicyLab", icon: "FlaskConical" },
          { label: "Recommendations", page: "Recommendations", icon: "ListOrdered" },
          { label: "Watchlists", page: "Watchlists", icon: "BellRing" },
          { label: "Interventions", page: "Interventions", icon: "Activity" },
          { label: "Approvals Inbox", page: "ApprovalsInbox", icon: "ClipboardCheck" },
          { label: "Backtesting", page: "Backtesting", icon: "BrainCircuit" },
          { label: "Conflict Workbench", page: "ConflictWorkbench", icon: "GitCompare" },
          { label: "Evidence Explorer", page: "EvidenceExplorer", icon: "Link2" },
          { label: "Alerts Center", page: "AlertsCenter", icon: "Siren" },
          { label: "Geo Equity Map", page: "GeoEquityMap", icon: "MapPinned" },
          { label: "Knowledge Admin", page: "KnowledgeAdmin", icon: "BookMarked" },
          { label: "Hansard Intel", page: "HansardIntel", icon: "FileText" },
        ],
      },
      {
        section: "Data",
        items: [
          { label: "Data Sources", page: "DataSources", icon: "BookOpen" },
          { label: "My Sources", page: "MyDataSources", icon: "Database" },
          { label: "Data Quality", page: "DataQuality", icon: "ShieldCheck" },
          { label: "AI Agents", page: "AgentCenter", icon: "Bot" },
          { label: "Export", page: "Export", icon: "FileDown" },
        ],
      },
      {
        section: "Analytics",
        items: [
          { label: "Predictive", page: "PredictiveAnalytics", icon: "TrendingUp" },
          { label: "Geo Map", page: "GeoMap", icon: "MapPin" },
          { label: "Alerts", page: "Alerts", icon: "BellRing" },
          { label: "Data Prep", page: "DataPrep", icon: "Wrench" },
          { label: "Workflows", page: "Workflows", icon: "Workflow" },
          { label: "Governance", page: "DataGovernance", icon: "Shield" },
          { label: "Reports", page: "Reports", icon: "FileDown" },
        ],
      },
    ],
    adminNavItems: [
      { label: "Team", page: "Team", icon: "Users" },
      { label: "Admin", page: "Admin", icon: "Shield" },
      { label: "Settings", page: "Settings", icon: "Settings" },
      { label: "Changelog", page: "Changelog", icon: "BookOpen" },
    ],
  },

  // ── Policy Intake and Management ──────────────────────────────────────
  {
    id: "policy-intake",
    name: "Policy Intake and Management",
    shortName: "Policy Intake",
    description:
      "Submit, triage, assign, and track policy assistance requests across the ministry.",
    icon: "FileSignature",
    accent: "#fbbf24",
    landingPage: "PolicyRequestTable",
    status: APP_STATUS.ACTIVE,
    roles: ALL_ROLES,
    navItems: [
      {
        section: "Policy Intake and Management",
        items: [
          { label: "New Policy Request", page: "PolicyRequestForm", icon: "FileSignature" },
          { label: "All Requests (Table)", page: "PolicyRequestTable", icon: "ClipboardCheck" },
          { label: "All Requests (Cards)", page: "PolicyRequestCardView", icon: "Layers3" },
        ],
      },
    ],
  },

  // ── Policy Studio ─────────────────────────────────────────────────────
  {
    id: "policy-studio",
    name: "Policy Studio",
    shortName: "Policy",
    description:
      "Policy development lifecycle — from rechèrche to implementation. Registry, stages, evidence, and approval workflows.",
    icon: "Scale",
    accent: "#f472b6",
    landingPage: "PolicyStudio",
    status: APP_STATUS.SCAFFOLD,
    roles: ALL_ROLES,
    navItems: [
      {
        section: "Policy Studio",
        items: [
          { label: "Overview", page: "PolicyStudio", icon: "LayoutDashboard" },
          { label: "Policy Registry", page: "PolicyStudio", icon: "ScrollText", anchor: "registry" },
          { label: "Lifecycle Stages", page: "PolicyStudio", icon: "GitBranch", anchor: "lifecycle" },
          { label: "Evidence Library", page: "PolicyStudio", icon: "Library", anchor: "evidence" },
          { label: "Review & Approval", page: "PolicyStudio", icon: "ClipboardCheck", anchor: "approvals" },
        ],
      },
    ],
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
      {
        section: "Health Equity",
        items: [
          { label: "Overview", page: "HealthEquity", icon: "LayoutDashboard" },
          { label: "Anti-Racism Work", page: "HealthEquity", icon: "Shield", anchor: "anti-racism" },
          { label: "Complaints & Feedback", page: "HealthEquity", icon: "MessageSquare", anchor: "complaints" },
          { label: "Systems Barriers", page: "HealthEquity", icon: "AlertTriangle", anchor: "barriers" },
          { label: "LOU / HA Workplans", page: "HealthEquity", icon: "FileText", anchor: "lous" },
        ],
      },
    ],
  },

  // ── Research & Evaluation ─────────────────────────────────────────────
  {
    id: "research-evaluation",
    name: "Research & Evaluation",
    shortName: "Research",
    description:
      "Research projects, evaluation plans, metrics frameworks, data governance, and ROI methodology.",
    icon: "FlaskConical",
    accent: "#a78bfa",
    landingPage: "ResearchEvaluation",
    status: APP_STATUS.SCAFFOLD,
    roles: ALL_ROLES,
    navItems: [
      {
        section: "Research & Evaluation",
        items: [
          { label: "Overview", page: "ResearchEvaluation", icon: "LayoutDashboard" },
          { label: "Research Projects", page: "ResearchEvaluation", icon: "BookOpen", anchor: "projects" },
          { label: "Evaluation Plans", page: "ResearchEvaluation", icon: "ClipboardList", anchor: "evaluations" },
          { label: "Data Governance", page: "ResearchEvaluation", icon: "Shield", anchor: "governance" },
          { label: "ROI & Methodology", page: "ResearchEvaluation", icon: "TrendingUp", anchor: "roi" },
        ],
      },
    ],
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
      {
        section: "Provincial Wellness",
        items: [
          { label: "Overview", page: "ProvincialWellness", icon: "LayoutDashboard" },
          { label: "Initiatives", page: "ProvincialWellness", icon: "Activity", anchor: "initiatives" },
          { label: "Workshops", page: "ProvincialWellness", icon: "Users", anchor: "workshops" },
          { label: "Regional Coordination", page: "ProvincialWellness", icon: "MapPin", anchor: "regional" },
          { label: "Community Engagement", page: "ProvincialWellness", icon: "Heart", anchor: "engagement" },
        ],
      },
    ],
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
      {
        section: "Contracts & Reporting",
        items: [
          { label: "Overview", page: "ContractsReporting", icon: "LayoutDashboard" },
          { label: "Agreements", page: "ContractsReporting", icon: "FileSignature", anchor: "agreements" },
          { label: "Deliverables", page: "ContractsReporting", icon: "CheckSquare", anchor: "deliverables" },
          { label: "Reporting Calendar", page: "ContractsReporting", icon: "Calendar", anchor: "calendar" },
          { label: "Budget & Cashflow", page: "ContractsReporting", icon: "DollarSign", anchor: "budget" },
        ],
      },
    ],
  },

  // ── Planning & KPIs ───────────────────────────────────────────────────
  {
    id: "planning-kpi",
    name: "Planning & KPIs",
    shortName: "Planning",
    description:
      "Ministry and department goals, action items, milestones, KPI dashboards, and reporting cadence.",
    icon: "Target",
    accent: "#f59e0b",
    landingPage: "PlanningKPI",
    status: APP_STATUS.SCAFFOLD,
    roles: ALL_ROLES,
    navItems: [
      {
        section: "Planning & KPIs",
        items: [
          { label: "Overview", page: "PlanningKPI", icon: "LayoutDashboard" },
          { label: "Ministry Goals", page: "PlanningKPI", icon: "Flag", anchor: "goals" },
          { label: "Action Items", page: "PlanningKPI", icon: "CheckSquare", anchor: "actions" },
          { label: "Milestones", page: "PlanningKPI", icon: "Milestone", anchor: "milestones" },
          { label: "KPI Dashboard", page: "PlanningKPI", icon: "BarChart3", anchor: "kpis" },
        ],
      },
    ],
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
 * Falls back to the MHIH app for legacy pages not explicitly claimed.
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
  // Default: MHIH owns unclaimed pages
  return getApp("mhih");
}