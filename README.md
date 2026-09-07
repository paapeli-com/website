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
---

# 🚢 CI/CD and deployment

Three apps, one monorepo, one pipeline. The rule is the same as the gateway's:
**CI never talks to Kubernetes, and never writes to git.** It builds images. A
human commit deploys.

| You do | CI does | Result |
|---|---|---|
| push to `dev` | build + push `web`, `docs`, `panel` as `:latest`, redeploy on tb-mini | staging updated, Kubernetes untouched |
| push a tag `v1.2.3` | build + push all three as `:v1.2.3`, then stop | images published, nothing deployed |
| edit `deployment/helm/values.yaml` on `dev` | nothing | Argo CD deploys within ~3 min |

The last row is the deployment. There is no deploy pipeline for Kubernetes — and
therefore no pipeline holding cluster or git-write credentials.

Only `dev` and tags run a pipeline at all — feature branches (`eric`,
`amirkian`, …) build nothing, which is what the `workflow:` block at the top
enforces.

## Staging (tb-mini)

Each app has its own `deploy-*` job gated on `needs:` for its own build, so a
failed `panel` build cannot ship a stale `panel` alongside a fresh `web`.

## The chart lives here

`deployment/helm/` — next to the code it ships, so one commit changes the code
and the manifest that deploys it. Argo CD reads this path from the **`dev`**
branch of this repository.

**Only `dev` deploys.** A values change on a feature branch, or in an open merge
request, deploys nothing — Argo CD reads no other ref. The branch is the gate.

One chart, one template, one Deployment per enabled entry in the `apps:` map —
adding a fourth front end is an entry there, not a new chart. Ports come from
the Dockerfiles: `web` 3000 (Next.js standalone), `panel` 8080 (node server),
`docs` 80 (nginx).

### Three apps, two environments

| App | tb-mini (staging) | Kubernetes (production) |
|---|---|---|
| `web` | yes | yes — `paapeli.me` |
| `panel` | yes | yes — `panel.paapeli.me` |
| `docs` (UI kit) | yes — `uikit-mini.paapeli.me` | **no** |

`docs` is `enabled: false` in the chart. The UI kit is a development aid for the
people building the front ends, not something a customer opens, so it lives on
staging where its audience already is. A second production copy meant a second
thing to keep current and a public surface nobody had asked for.

`enabled: false` renders nothing — no Deployment, no Service, no PDB, no
NodePort — and Argo CD prunes what it had created. The vhost, DNS record and
Caddy upstream are gone from the infra repo as well, so `docs.paapeli.me`
neither resolves nor answers. Re-enabling it is one line here plus the vhost
back in `group_vars`; nothing is deleted that would need rebuilding.

CI still builds the `docs` image on every push, because tb-mini deploys all
three.

## Releasing

```bash
git tag v1.2.3 && git push origin v1.2.3     # 1. publish all three images
# 2. then, on dev, edit deployment/helm/values.yaml:
#      apps:
#        web:   { tag: v1.2.3 }      # was: latest
#        panel: { tag: v1.2.3 }
git commit -am "client: release v1.2.3" && git push origin dev
```

Only the two production apps have a tag to move; `docs` keeps `latest` because
it is only ever deployed to staging, which tracks `latest` by design.

**web and panel move together, deliberately.** They are built from one commit of
one monorepo and share `packages/`; releasing them independently means a panel
talking to a `web` build it was never tested against.

Argo CD picks it up within ~3 minutes. **Rollback** is the same edit in reverse,
or `git revert` — no rebuild, no pipeline.

Staging uses the moving `:latest` tag and Kubernetes uses immutable ones on
purpose: with `:latest`, git and the cluster can agree while the running image
is stale, and Argo CD has no way to notice.

## Runner tags

GitLab matches tags **exactly and completely** — a job asking for one tag a
runner lacks queues forever as "no matching runners", which does not read as a
tag problem.

| Job | Tags | Runner |
|---|---|---|
| `build-web` / `build-docs` / `build-panel` | `ci`, `docker` | git01 (`ci, docker, build`) |
| `deploy-web` / `deploy-docs` / `deploy-panel` | `cd`, `mini` | tb-mini01 (`cd, stage, deploy, mini`) |

Separate runners because tb-mini01 runs `concurrent: 1` — one runner doing both
would queue every build behind a deploy.

Full GitOps explanation, components and token map:
`paapeli/infra` → `ansible/docs/gitops.md`.
