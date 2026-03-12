# Red River OS — Migration Notes

## What Changed in This Refactor

This document describes the architectural transformation from the original single-purpose MHIH app into the Red River OS platform.

---

## Before: MHIH Single App

**Structure:**
- Flat page registry (`pages.config.js`) mapping all pages to `/{PageName}` routes
- Single `Layout.jsx` monolith (~56KB) containing all navigation, state, and UI
- No module boundaries — MHIH analytics, policy, data, and admin pages all at the same level
- Navigation organised as flat sections within one sidebar
- No formal app registry or permission system
- "Red River OS" existed as a single page (`/RedRiverOS`), not as an OS shell

**Route shape:**
```
/Dashboard
/PolicyLab
/DataRepository
/RedRiverOS     ← was just one analytics page, not an OS
...
```

---

## After: Red River OS Platform

**Structure:**
- Platform layer in `src/platform/` with app registry, permissions, route map, and context
- `Layout.jsx` is now a clean Red River OS shell (~8KB) using `platformContext`
- MHIH is one app module within the OS, with its own navigation context
- Six additional app module scaffolds in place
- Centralised `PAGE_ROUTE_MAP` drives all routing from one source of truth
- RBAC designed and ready to wire to real data

**Route shape:**
```
/os                           ← OS Home (flagship landing)
/os/ministry                  ← Ministry Overview
/os/apps/mhih                 ← MHIH Dashboard
/os/apps/mhih/policy-lab      ← MHIH policy pages
/os/apps/policy-studio        ← Policy Studio module
/os/apps/health-equity        ← Health Equity module
...
```

Legacy routes (`/Dashboard`, `/PolicyLab`, etc.) now redirect to their new canonical paths.

---

## Files Created

| File | Purpose |
|---|---|
| `src/platform/appRegistry.js` | Central app manifest — all registered apps and their nav |
| `src/platform/permissions.js` | RBAC — roles, permissions, and `can()` helper |
| `src/platform/platformContext.jsx` | Platform-level React context |
| `src/platform/routes.js` | Canonical URL map for every page |
| `src/pages/RedRiverOSHome.jsx` | Flagship OS landing page |
| `src/pages/MinistryOverview.jsx` | Ministry strategic overview |
| `src/pages/PolicyStudio.jsx` | Policy Studio module (beta) |
| `src/pages/HealthEquity.jsx` | Health Equity module (beta) |
| `src/pages/ResearchEvaluation.jsx` | Research & Evaluation module (beta) |
| `src/pages/ProvincialWellness.jsx` | Provincial Wellness module (beta) |
| `src/pages/ContractsReporting.jsx` | Contracts & Reporting module (beta) |
| `src/pages/PlanningKPI.jsx` | Planning & KPIs module (beta) |
| `docs/architecture.md` | Full architecture documentation |
| `docs/app-registry.md` | App registry guide |
| `docs/migration-notes.md` | This file |

---

## Files Modified

| File | Change |
|---|---|
| `src/Layout.jsx` | Complete redesign as Red River OS shell |
| `src/App.jsx` | Route generation from `PAGE_ROUTE_MAP`, legacy redirects |
| `src/utils/index.ts` | `createPageUrl()` now uses centralised route map |
| `src/pages.config.js` | Added 8 new pages, mainPage → `RedRiverOSHome` |
| `README.md` | Updated for Red River OS platform |

---

## What Was Preserved

- All existing MHIH page components — **no business logic was deleted or rewritten**
- All Base44 entity calls and cloud function invocations
- All dashboard widgets and customisation system
- All data source browsers and connectors
- All analytics, charting, and visualisation components
- All notification, feedback, and command palette systems
- All auth and role normalization logic
- `AppContext` and `useApp()` hook — backward-compatible with existing pages
- MNBC brand colours, Sofia Sans typography, and dark-mode design tokens
- All cloud functions and backend validation scripts

---

## Breaking Changes

1. **URLs changed** — All page URLs now follow `/os/...` pattern. Legacy `/{PageName}` URLs redirect automatically.
2. **`Layout.jsx` rewritten** — Any code that imported internal functions from Layout (other than `useApp()`) may need updating.
3. **`createPageUrl()` behaviour changed** — Now returns `/os/apps/mhih/...` paths. If any code built URLs manually or expected `/{PageName}`, update to use `createPageUrl()`.

---

## What Still Needs Implementation

### High Priority

1. **MHIH app inner page sub-routing** — MHIH inner pages currently render correctly under the OS shell, but could be further refined with a MHIH-specific secondary nav bar.

2. **Policy lifecycle wiring** — `PolicyStudio.jsx` has real UI structure but no backend entity connections yet. Wire to `PolicyScenario` entities and the approval workflow.

3. **Health Equity data connections** — `HealthEquity.jsx` has static demo data. Connect to real complaint, barriers, and HA workplan entities.

4. **Research & Evaluation project data** — Wire `ResearchEvaluation.jsx` to real research project entities.

5. **Contracts & Reporting backend** — Wire agreement/deliverable/budget entities to `ContractsReporting.jsx`.

6. **Planning & KPIs ministry plan data** — The goals and KPIs in `PlanningKPI.jsx` are static. Connect to the planning cycle data model.

### Medium Priority

7. **RBAC enforcement** — `permissions.js` is designed; wire `can()` checks into pages and components.

8. **Ministry Overview live data** — Connect KPI values to real metrics from MHIH data platform.

9. **OS Home activity feed** — Wire recent activity to real entity change events or audit log.

10. **Shared platform components** — Extract reusable StatCard, PriorityItem, ProgressBar, PageHeader, etc. from the new module pages into `src/components/platform/`.

### Lower Priority

11. **Mental Health & Harm Reduction module** — Scaffold an additional module for this portfolio.

12. **Data Governance / ROI Metrics module** — Scaffold dedicated module (some exists in MHIH).

13. **Community Engagement / LOU Tracker module** — Scaffold for LOU and engagement tracking.

14. **Elders / Cultural Guidance module** — Scaffold for cultural guidance registry.

15. **Deep link and breadcrumb system** — Implement OS-level breadcrumbs reflecting the app → page hierarchy.

16. **Command palette enhancements** — Add OS-aware navigation to the command palette (current implementation is MHIH-specific).

---

## Development Conventions

Going forward, keep these principles:

- All new features go through the **app registry** first — no orphan pages
- All URLs are defined in `src/platform/routes.js` — no hardcoded paths
- All permission checks use `can()` from `src/platform/permissions.js` — no ad-hoc role checks
- All new modules follow the `src/pages/ModuleName.jsx` pattern + registry entry
- Keep MHIH-specific components in `src/components/` with clear folder names
- Extract genuinely shared components into `src/components/platform/` (to be created)
