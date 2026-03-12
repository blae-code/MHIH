# Red River OS

**Sovereign governance workspace for MNBC Health & Wellness**

Red River OS is a modular ministry operating environment for Métis Nation BC Health & Wellness. It provides a unified platform for health governance, policy development, data analytics, equity work, research, and reporting — with the Métis Health Implementation Hub (MHIH) as its first and primary application module.

---

## Platform Overview

Red River OS is structured as a shell with pluggable application modules:

| Module | Route | Status |
|---|---|---|
| **OS Home** | `/os` | Active |
| **Ministry Overview** | `/os/ministry` | Active |
| **MHIH** | `/os/apps/mhih` | Active |
| **Policy Studio** | `/os/apps/policy-studio` | Beta |
| **Health Equity** | `/os/apps/health-equity` | Beta |
| **Research & Evaluation** | `/os/apps/research-evaluation` | Beta |
| **Provincial Wellness** | `/os/apps/provincial-wellness` | Beta |
| **Contracts & Reporting** | `/os/apps/contracts-reporting` | Beta |
| **Planning & KPIs** | `/os/apps/planning-kpi` | Beta |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Base44 app ID and backend URL

### Local Development

```bash
# 1. Clone the repo
git clone <repo-url>
cd MHIH

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your Base44 app credentials:
# VITE_BASE44_APP_ID=your_app_id
# VITE_BASE44_APP_BASE_URL=https://your-app.base44.app

# 4. Start dev server
npm run dev
```

### Build & Validate

```bash
npm run build              # Production build
npm run validate:runtime   # Validate functions, routes, and roles
npm test                   # Run tests
npm run validate:all       # Full validation suite
```

---

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full architectural overview.

**Key layers:**

```
src/
  platform/          # OS platform layer
    appRegistry.js   # Central app manifest — add new apps here
    permissions.js   # RBAC — centralised permission checks
    platformContext  # Platform-level React context
    routes.js        # Canonical URL map for all pages
  pages/             # All page components (OS + MHIH + app modules)
  components/        # Shared UI components
    ui/              # Radix/shadcn primitives
    dashboard/       # Dashboard widgets
    analyst/         # Analytics components
    ...
  api/               # API client layer
  lib/               # Auth, utilities, config
```

---

## Adding a New App Module

1. Create your page(s) in `src/pages/MyNewApp.jsx`
2. Register the app in `src/platform/appRegistry.js`
3. Add routes to `src/platform/routes.js`
4. Add page imports to `src/pages.config.js`

See [docs/app-registry.md](docs/app-registry.md) for the full guide.

---

## Documentation

- [Architecture Overview](docs/architecture.md)
- [App Registry Guide](docs/app-registry.md)
- [Migration Notes](docs/migration-notes.md)
- [Analytics Audit](docs/analytics-audit.md)

---

## Base44 Platform

This app runs on the [Base44](https://base44.com) platform for the backend (auth, entities, cloud functions). See Base44 docs for deployment and publishing.
