## 📚 Table of Contents

  - [🧩 Monorepo](#-monorepo)
  - [📁 Repository Structure](#-repository-structure)
  - [🚀 Technologies](#-technologies)
  - [⚙️ Getting Started](#️-getting-started)
    - [Install dependencies](#1-install-dependencies-in-all-apps)
    - [Run all apps](#2-run-all-apps-in-development)
    - [Run a specific app](#3-run-a-specific-app)
  - [📦 Shared Packages](#-shared-packages)
  - [Testing](#testing)
  - [Adding a New App or Package](#adding-a-new-app-or-package)
    - [Adding a New App](#adding-a-new-app)
    - [Adding a New Package](#adding-a-new-package)
  - [🧱 Apps vs Packages](#-apps-vs-packages)
    - [📱 Apps](#-apps)
    - [📦 Packages](#-packages)
    - [🔗 Dependency Rules](#-dependency-rules)


# 🧩 Monorepo

A **Turbo-powered monorepo** containing multiple applications (Web, Mobile, Desktop) and shared packages.  
This setup enables **code sharing**, **consistent tooling**, and **fast builds** across platforms.

---

## 📁 Repository Structure
```
.
├── apps/
│ ├── panel/ # panel.paapeli.com — the signed-in product panel (Vite + React)
│ ├── web/ # paapeli.com — marketing site (Next.js)
│ ├── web_old/ # previous marketing site, kept for reference
│ └── docs/ # Storybook
│
├── packages/
│ ├── paapeli-api/ # Shared API client + React Query hooks (@paapeli/api)
│ ├── brand/ # Tenant config, design tokens, shared session (@paapeli/brand)
│ ├── ui-kit/ # Shared UI components
│ ├── ui/ # Legacy shared UI components
│ ├── paapeli-font/ # Font assets
│ ├── eslint-config/ # Shared eslint config
│ └── typescript-config/ # Shared tsconfig bases
│
├── ci/docker/panel/ # Panel container image
├── turbo.json # Turborepo pipeline configuration
├── package.json # Root package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 🖥️ The panel app

`apps/panel` is **one Vite app** serving everything at `panel.paapeli.com`:

```
apps/panel/
├── index.html            # the SPA shell
├── login/index.html      # standalone sign-in page, served at /login
├── server.mjs            # production static server (one dist, one port)
└── src/
    ├── app/              # entry, router, feature registry
    ├── shell/            # persistent chrome: header, sidebar, nav, providers
    ├── shared/           # cross-feature helpers
    └── features/
        ├── factory/      # Smart Factory   → /AIoT/SmartFactory/*
        ├── track/        # GPS Tracking    → /AIoT/GPSTracking/*
        └── cloud-management/  #            → /CloudManagement/*
```

Each feature is a lazily-imported route module (`src/app/features.ts`), so it
still ships as its own chunk fetched on first navigation — the split is just
resolved at **build time**.

> This replaced a Module Federation setup (a host plus three remotes, each its
> own Vite project and dev server). That bought independent deployability the
> project never used — the container built and served all of them as one unit —
> while costing HMR, duplicating dependencies in every remote, and causing
> intermittent `couldn't load remote` errors when the host fetched
> `remoteEntry.js` while a remote's `vite build --watch` was rewriting `dist/`.

Run it:

```bash
pnpm --filter panel dev      # http://localhost:8080  (real HMR)
pnpm --filter panel build    # one build → apps/panel/dist
pnpm --filter panel start    # serve that build on :8080
```

---

## 🚀 Technologies

- **Turborepo** – High-performance build system for monorepos
- **TypeScript** – Type safety across all apps and packages
- **React ecosystem** – Shared UI and logic
- **Package Manager** – `pnpm` / `yarn` / `npm`

---

## ⚙️ Getting Started

### 1. Install dependencies in all apps

```bash
pnpm install
```

### 2. Run all apps in development
```bash
pnpm run dev
```
### 3. Run a specific app
```bash
pnpm --filter web dev
pnpm --filter mobile dev
pnpm --filter desktop dev
```


# 📦 Shared Packages
Packages inside `/packages` are framework-agnostic when possible and can be consumed by any app.

```ts
import { Button } from "@repo/ui";
import { formatDate } from "@repo/utils";
```

# Testing
Run all tests.

```bash
pnpm run test
```
# Adding a New App or Package
## Adding a New App
Create a new directory under apps:
```bash
apps/new-app/
```
Each app should include:
- package.json
- dev and build scripts
- Workspace references to shared packages
## Adding a New Package
Create a new directory under apps:
```bash
packages/new-package/
```
- Exports a clear public API
- Uses workspace dependencies
- Is platform-agnostic when possible

# 🧱 Apps vs Packages
## 📱 Apps
Apps are end-user–facing applications.
They represent complete, runnable products and live under the apps/ directory.

Characteristics:

- Deployable or distributable
- Can depend on multiple packages
- Platform-specific
- Contain routing, screens/pages, and app-level state
- Never imported by other apps

Examples:
```
apps/web        # Web application
apps/mobile     # Mobile application
apps/desktop    # Desktop application
```
- Typical responsibilities:
- Application bootstrap
- Platform-specific configuration
- Routing & navigation
- App-level state management
- Consuming shared packages

## 📦 Packages

📦 Packages

Packages are shared, reusable libraries used by one or more apps.
They live under the packages/ directory.

Characteristics:

- Not directly deployable
- Framework-agnostic when possible
- Can be imported by apps or other packages
- Contain no platform-specific code unless explicitly required

Examples:
```
packages/ui       # Shared UI components
packages/utils    # Shared utility functions
packages/api      # Shared API / SDK layer
packages/config   # Shared tooling & configuration
```

Typical responsibilities:
- Reusable UI components
- Business logic
- Utilities & helpers
- API clients
- Shared configuration (eslint, tsconfig, etc.)

## 🔗 Dependency Rules

To keep the monorepo healthy and scalable, follow these rules:
```
✅ Apps can import Packages
✅ Packages can import other Packages
❌ Apps must NOT import other Apps
❌ Packages must NOT depend on Apps
```