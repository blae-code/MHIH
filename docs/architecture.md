# Red River OS — Architecture

## Overview

Red River OS is a platform-style ministry operating environment built on React + Vite + Base44. It consists of a persistent OS shell that hosts multiple application modules, with the Métis Health Implementation Hub (MHIH) as the primary active module.

---

## Platform Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 |
| Build tool | Vite 6 |
| Routing | React Router v6 |
| State management | React Context + TanStack Query |
| Backend platform | Base44 (BaaS — auth, entities, cloud functions) |
| Styling | Tailwind CSS + Radix UI (shadcn/ui) |
| Design tokens | MNBC brand (CSS custom properties) |
| Type system | TypeScript (contracts, validators, utilities) |

---

## Directory Structure

```
src/
├── platform/                  # OS platform layer — the heart of Red River OS
│   ├── appRegistry.js         # Central app/module manifest
│   ├── permissions.js         # Centralised RBAC (roles + permission checks)
│   ├── platformContext.jsx    # Platform-level React context (active app, nav, logs)
│   └── routes.js              # Canonical URL map: page name → /os/... path
│
├── pages/                     # All page components
│   ├── RedRiverOSHome.jsx     # OS landing page (flagship home)
│   ├── MinistryOverview.jsx   # Ministry strategic overview
│   ├── Dashboard.jsx          # MHIH dashboard (main analytics view)
│   ├── PolicyStudio.jsx       # Policy Studio module
│   ├── HealthEquity.jsx       # Health Equity module
│   ├── ResearchEvaluation.jsx # Research & Evaluation module
│   ├── ProvincialWellness.jsx # Provincial Wellness module
│   ├── ContractsReporting.jsx # Contracts & Reporting module
│   ├── PlanningKPI.jsx        # Planning & KPIs module
│   └── [... existing MHIH pages ...]
│
├── components/                # Shared components
│   ├── ui/                    # Radix/shadcn primitive components
│   ├── dashboard/             # Dashboard widget components
│   ├── analyst/               # Analytics panel components
│   ├── datasources/           # Data source browser components
│   ├── notifications/         # Notification system
│   ├── search/                # Command palette & global search
│   └── [...]
│
├── api/
│   ├── base44Client.js        # Base44 SDK client instance
│   └── redriverModuleApi.js   # Red River module API helpers
│
├── lib/
│   ├── AuthContext.jsx        # Auth state (user, session, role)
│   ├── app-params.js          # Base44 app configuration
│   ├── healthMetrics.js       # Health metric utilities
│   ├── metricSemantics.js     # Metric direction/polarity logic
│   └── query-client.js        # TanStack Query client
│
├── utils/
│   └── index.ts               # createPageUrl() — uses route map
│
├── App.jsx                    # Router root — builds routes from route map
├── Layout.jsx                 # Red River OS shell (header, sidebar, app context)
├── pages.config.js            # Page registry (all imports + pagesConfig export)
└── globals.css                # MNBC design tokens + global styles
```

---

## URL Structure

All URLs follow the `/os/...` convention:

```
/os                              → OS Home (RedRiverOSHome)
/os/ministry                     → Ministry Overview
/os/settings                     → Settings
/os/changelog                    → Changelog
/os/onboarding                   → Onboarding

/os/apps/mhih                    → MHIH Dashboard (app landing)
/os/apps/mhih/data-repository    → Data Repository
/os/apps/mhih/visualizations     → Visualizations
/os/apps/mhih/ai-insights        → AI Insights
/os/apps/mhih/ai-analyst         → AI Data Analyst
/os/apps/mhih/redriver-module    → Red River Analytics Module
/os/apps/mhih/metric-catalog     → Metric Catalog
/os/apps/mhih/metric-forge       → Metric Forge
/os/apps/mhih/evidence-snapshots → Evidence Snapshots
/os/apps/mhih/policy-lab         → Policy Lab
... (and more MHIH inner pages)

/os/apps/policy-studio           → Policy Studio
/os/apps/health-equity           → Health Equity
/os/apps/research-evaluation     → Research & Evaluation
/os/apps/provincial-wellness     → Provincial Wellness
/os/apps/contracts-reporting     → Contracts & Reporting
/os/apps/planning-kpi            → Planning & KPIs
```

Legacy paths (`/Dashboard`, `/PolicyLab`, etc.) redirect to their new canonical URLs.

---

## Platform Layer

### App Registry (`src/platform/appRegistry.js`)

The single source of truth for all registered applications. Each app entry defines:

```js
{
  id: "policy-studio",           // Unique identifier
  name: "Policy Studio",         // Full display name
  shortName: "Policy",           // Short label (app switcher, sidebar badge)
  description: "...",            // One-liner for app switcher cards
  icon: "Scale",                 // Lucide icon name
  accent: "#f472b6",             // Brand accent colour
  landingPage: "PolicyStudio",   // Page name for app landing
  status: APP_STATUS.SCAFFOLD,   // active | scaffold | planned
  roles: ALL_ROLES,              // Which roles can access
  navItems: [...],               // Navigation sections + items
}
```

### Permissions (`src/platform/permissions.js`)

Centralised RBAC. All permission checks go through `can(user, permission)`.

Roles:
- `admin` — full access
- `executive`, `director`, `senior_manager` — governance + approval
- `program_manager`, `analyst`, `coordinator` — operational
- `research_staff`, `community_staff` — specialist
- `viewer` — read-only
- `user` — base44 default (coordinator-equivalent)

### Platform Context (`src/platform/platformContext.jsx`)

Platform-level React context providing:
- `activeApp` / `switchApp()` — which app is active
- `sidebarOpen` / `toggleSidebar()` — sidebar state
- `commandPaletteOpen` / `setCommandPaletteOpen()` — command palette
- `statusLogs` / `addLog()` — activity log (visible in sidebar footer)

### Route Map (`src/platform/routes.js`)

Defines the canonical URL for every page name. Used by:
- `createPageUrl(pageName)` in `src/utils/index.ts`
- `App.jsx` to build the React Router route table
- `platformContext` to derive the active app from the current URL

---

## OS Shell (`src/Layout.jsx`)

The persistent application shell. Wraps all pages and provides:

**Header bar:**
- Red River OS identity + logo
- Active app badge (click to open app switcher)
- Global search (opens command palette)
- Notification bell
- User menu (settings, feedback, sign out)

**Left sidebar:**
- App identity strip with accent colour
- OS-level navigation (Home, Ministry Overview, Planning & KPIs)
- Active-app navigation (context-sensitive, changes per app)
- Admin section (admin users only)
- Status log footer

**App switcher overlay:**
- Grid of all registered apps
- Shows app status (active / beta)
- Navigates and activates the selected app

**Legacy `AppContext`:**
The `AppContext` and `useApp()` hook are preserved for backward compatibility with existing MHIH pages that call `addLog()` and `setContextPanel()`.

---

## MHIH as an App Module

The current MHIH application lives at `/os/apps/mhih/...`. All existing MHIH pages are preserved exactly as-is. The transformation is:

1. They now route under `/os/apps/mhih/` instead of `/{PageName}`
2. They render inside the Red River OS shell
3. When a MHIH page is visited, the sidebar shows MHIH-specific navigation
4. The app registry identifies them as owned by the `mhih` app

No business logic was rewritten. The MHIH data layer (Base44 entities, cloud functions, analytics) is unchanged.

---

## Design System

Red River OS uses:
- **MNBC brand colours** as CSS custom properties (`--mnbc-blue`, `--mnbc-yellow`, `--mnbc-red`, etc.)
- **Dark mode** with carefully calibrated contrast (`--bg-base` through `--bg-overlay`)
- **Sofia Sans** (heading, MNBC brand) + Inter (body)
- **Accent colours per app** — each app module has its own accent colour to build identity
- **Radix UI + shadcn/ui** for accessible, consistent component primitives
- **Recharts** for data visualisation

Visual principles:
- Serious and restrained — governance workspace, not SaaS toy
- High legibility — dense but calm
- Cultural grounding through structure and naming, not decoration overload

---

## Adding New Content

### New page to an existing app

1. Create `src/pages/MyNewPage.jsx`
2. Add to `PAGE_ROUTE_MAP` in `src/platform/routes.js`
3. Add to `src/pages.config.js`
4. Add a nav item in the app's `navItems` in `src/platform/appRegistry.js`

### New app module

1. Create the landing page `src/pages/MyNewApp.jsx`
2. Add the app entry to `APP_REGISTRY` in `src/platform/appRegistry.js`
3. Add the route to `src/platform/routes.js`
4. Add page imports to `src/pages.config.js`

See [app-registry.md](app-registry.md) for the detailed guide.
