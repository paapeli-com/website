# Next.js Migration Guide

This project has been transformed from a Vite SPA to a Next.js application with the App Router.

## Project Structure

```
paapeli-MainPage/
├── src/                    # Original Vite/React source code (PRESERVED)
│   ├── pages/             # Original page components
│   ├── components/        # Original components
│   ├── contexts/          # Original context providers (React Router based)
│   ├── hooks/             # Original custom hooks
│   ├── lib/               # Original utilities
│   └── assets/            # Original assets
│
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Root redirect to /en
│   ├── providers.tsx      # Client-side providers (React Query, Auth)
│   ├── globals.css        # Global styles
│   └── [lang]/            # Language-based routing
│       ├── layout.tsx     # Language layout with LanguageProvider
│       ├── page.tsx       # Home page
│       ├── (protected)/   # Protected routes group
│       │   ├── layout.tsx # Protected routes wrapper
│       │   ├── home/
│       │   ├── dashboard/
│       │   ├── devices/
│       │   ├── alarms/
│       │   └── aiot/      # AIoT features
│       ├── login/
│       ├── pricing/
│       ├── contact/
│       └── ...            # Other public pages
│
├── contexts/               # Next.js-compatible contexts
│   ├── AuthContext.tsx    # Auth provider (Next.js compatible)
│   └── LanguageContext.tsx # Language provider (Next.js compatible)
│
├── components/             # Shared components
│   ├── ui/                # UI components (shadcn/ui)
│   └── layouts/           # Layout components
│
└── lib/                    # Utilities and helpers
    ├── utils.ts           # Utility functions
    └── i18n/              # Internationalization
        └── translations.ts

```

## How It Works

### Dual Structure
- **src/** folder: Contains the original Vite/React application (preserved for reference or gradual migration)
- **app/** folder: Contains the new Next.js App Router structure

### Page Routing
All pages in the `app/[lang]` directory are wrappers that import and render the original page components from `src/pages/`. This approach:
- Preserves the original code
- Allows for gradual migration
- Maintains all existing functionality

Example:
```tsx
// app/[lang]/pricing/page.tsx
'use client';

import Pricing from '@/src/pages/Pricing';

export default function PricingPage() {
  return <Pricing />;
}
```

### Language Routing
The application supports three languages (en, ar, fa) through the `[lang]` dynamic segment:
- `/` → redirects to `/en`
- `/en/pricing` → English pricing page
- `/ar/pricing` → Arabic pricing page
- `/fa/pricing` → Persian pricing page

### Protected Routes
Protected routes are grouped under the `(protected)` folder, which uses a layout that wraps all child routes with the `ProtectedRoute` component.

### Context Providers
Two main context providers have been migrated to work with Next.js:
1. **AuthContext**: Handles Cognito authentication
2. **LanguageContext**: Manages language selection and RTL support

## Running the Application

### Development
```bash
# Run Next.js dev server
npm run dev

# Run Vite dev server (original SPA)
npm run dev:vite
```

### Build
```bash
# Build Next.js app
npm run build

# Build Vite app (original)
npm run build:vite
```

### Production
```bash
npm run start
```

## Migration Strategy

This migration uses a **wrapper approach**:
1. Next.js pages are created in the `app/` directory
2. Each page imports and renders the original component from `src/pages/`
3. The original `src/` code remains unchanged
4. Contexts have been adapted to work with Next.js (using `useRouter` from `next/navigation` instead of `react-router-dom`)

### Benefits
- ✅ Minimal code changes required
- ✅ Original code preserved
- ✅ Can gradually migrate components
- ✅ Both apps can run side-by-side during transition

## Key Files

### Configuration
- `next.config.js`: Next.js configuration
- `tsconfig.json`: TypeScript configuration (updated for Next.js)
- `package.json`: Scripts updated to support both Next.js and Vite

### Layouts
- `app/layout.tsx`: Root layout with providers
- `app/[lang]/layout.tsx`: Language-specific layout
- `app/[lang]/(protected)/layout.tsx`: Protected routes layout

### Contexts
- `contexts/AuthContext.tsx`: Authentication context (Next.js compatible)
- `contexts/LanguageContext.tsx`: Language context (Next.js compatible)

## Path Aliases

The project uses `@/` as a path alias that points to the root directory, allowing imports like:
```tsx
import { Button } from '@/components/ui/button';
import Dashboard from '@/src/pages/panel/Dashboard';
```

## Environment Variables

Make sure to copy your `.env.local` file with the necessary environment variables for Cognito and other services.

## Notes

- The `src/` folder is preserved and untouched (except for contexts which have Next.js versions in the root `contexts/` folder)
- All pages in `app/[lang]/` are client components ('use client')
- Static assets remain in `src/assets/` and are referenced with `@/src/assets/`
- UI components from shadcn/ui are in `components/ui/`
