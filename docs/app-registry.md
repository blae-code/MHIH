# Red River OS — App Registry Guide

## What is the App Registry?

`src/platform/appRegistry.js` is the single source of truth for all application modules registered in Red River OS. The OS shell reads from it to build navigation, the app switcher, permission checks, and routing context.

---

## Registered Apps

| ID | Name | Status | Landing Page |
|---|---|---|---|
| `mhih` | Métis Health Implementation Hub | Active | `Dashboard` |
| `policy-studio` | Policy Studio | Beta | `PolicyStudio` |
| `health-equity` | Health Equity | Beta | `HealthEquity` |
| `research-evaluation` | Research & Evaluation | Beta | `ResearchEvaluation` |
| `provincial-wellness` | Provincial Wellness | Beta | `ProvincialWellness` |
| `contracts-reporting` | Contracts & Reporting | Beta | `ContractsReporting` |
| `planning-kpi` | Planning & KPIs | Beta | `PlanningKPI` |

OS-level entries (not shown in app switcher):
| ID | Name | Landing Page |
|---|---|---|
| `os-home` | Red River OS | `RedRiverOSHome` |

---

## App Entry Schema

```js
{
  // Required
  id: "my-app",                  // Slug-style unique identifier
  name: "My Application",        // Full display name
  shortName: "My App",           // Short label (≤ 12 chars)
  description: "...",            // One-liner for app switcher card
  icon: "IconName",              // Lucide icon name (string, not import)
  accent: "#hexcolor",           // App accent colour
  landingPage: "MyAppHome",      // Page name (key in pages.config.js)
  status: APP_STATUS.SCAFFOLD,   // active | scaffold | planned
  roles: ALL_ROLES,              // Array of roles that can access

  // Navigation
  navItems: [
    {
      section: "Section Label",  // Shown as nav section header
      items: [
        { label: "Page Name", page: "PageKey", icon: "LucideIconName" },
        // ...
      ],
    },
    // Or flat items (no section grouping):
    { label: "Overview", page: "MyAppHome", icon: "LayoutDashboard" },
  ],

  // Optional
  adminNavItems: [               // Only shown to admin users
    { label: "Admin", page: "Admin", icon: "Shield" },
  ],
  isOsLevel: true,               // Set only for OS-level entries (not app switcher)
}
```

---

## Adding a New App Module

### Step 1: Create the page component

```jsx
// src/pages/MyNewApp.jsx
export default function MyNewApp() {
  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="section-label mb-1">Red River OS · My New App</div>
        <h1 className="mnbc-heading" style={{ fontSize: 24, color: "var(--text-primary)" }}>
          My New App
        </h1>
        {/* ... */}
      </div>
    </div>
  );
}
```

### Step 2: Register the app in `appRegistry.js`

```js
// src/platform/appRegistry.js
{
  id: "my-new-app",
  name: "My New App",
  shortName: "My App",
  description: "Brief description for app switcher.",
  icon: "Folder",          // Lucide icon name
  accent: "#60a5fa",
  landingPage: "MyNewApp",
  status: APP_STATUS.SCAFFOLD,
  roles: ALL_ROLES,
  navItems: [
    {
      section: "My New App",
      items: [
        { label: "Overview", page: "MyNewApp", icon: "LayoutDashboard" },
      ],
    },
  ],
},
```

### Step 3: Add the route to `routes.js`

```js
// src/platform/routes.js
MyNewApp: "/os/apps/my-new-app",
```

### Step 4: Register in `pages.config.js`

```js
// src/pages.config.js
import MyNewApp from './pages/MyNewApp';

export const PAGES = {
  // ... existing pages ...
  "MyNewApp": MyNewApp,
};
```

That's it. The app switcher, sidebar navigation, routing, and permission system all update automatically.

---

## Icon Reference

The app shell resolves icon names as strings to Lucide React icons. Current supported icons:

`LayoutDashboard`, `Database`, `Brain`, `Settings`, `Users`, `Search`, `Bell`, `FileDown`, `BookOpen`, `Shield`, `BarChart3`, `SlidersHorizontal`, `ShieldCheck`, `Bot`, `MapPin`, `TrendingUp`, `Wrench`, `BellRing`, `Workflow`, `Sparkles`, `LogOut`, `User`, `Activity`, `FlaskConical`, `ClipboardCheck`, `BrainCircuit`, `MapPinned`, `Siren`, `BookMarked`, `Link2`, `ListOrdered`, `GitCompare`, `FileText`, `MessageSquare`, `Command`, `Building2`, `Target`, `HeartPulse`, `Scale`, `HeartHandshake`, `Leaf`, `FileSignature`, `Camera`, `Layers3`

To add a new icon: import it in `Layout.jsx` and add it to the `ICON_MAP` object.

---

## Status Conventions

| Status | Label shown | Use when |
|---|---|---|
| `APP_STATUS.ACTIVE` | _(none)_ | Fully functional with real data wiring |
| `APP_STATUS.SCAFFOLD` | "beta" | Structure in place, integration in progress |
| `APP_STATUS.PLANNED` | "soon" | Registered but not yet built |

---

## Permissions

Each app entry's `roles` array controls who can see and access it in the app switcher. Use the `ROLES` constants from `appRegistry.js`.

For per-feature permission checks within a page:

```js
import { can, PERMISSIONS } from "@/platform/permissions";
import { useAuth } from "@/lib/AuthContext";

const { user } = useAuth();
if (can(user, PERMISSIONS.APPROVE_POLICY)) {
  // show approval UI
}
```
