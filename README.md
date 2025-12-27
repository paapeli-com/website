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
│ ├── web/ # Web application (e.g. Next.js / Vite)
│ ├── mobile/ # Mobile application (e.g. React Native / Expo)
│ └── desktop/ # Desktop application (e.g. Electron / Tauri)
│
├── packages/
│ ├── ui/ # Shared UI components
│ ├── utils/ # Shared utility functions
│ ├── config/ # Shared configs (eslint, tsconfig, etc.)
│ └── api/ # Shared API / SDK layer
│
├── turbo.json # Turborepo pipeline configuration
├── package.json # Root package.json
├── pnpm-workspace.yaml / yarn.lock / package-lock.json
└── README.md
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
pnpm test
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