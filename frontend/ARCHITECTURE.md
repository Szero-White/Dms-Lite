# Frontend Architecture

## Goal

DMS Lite frontend follows a feature-first architecture.

The goal is to keep each business domain owned in one place, reduce cross-domain coupling, and align frontend structure with the backend package-by-feature structure.

## Target Structure

```text
frontend/src/
├── app/
│   ├── layouts/
│   ├── providers/
│   └── router/
├── components/
│   └── common/
├── features/
│   ├── auth/
│   ├── products/
│   ├── customers/
│   ├── inventory/
│   ├── sales/
│   ├── payments/
│   ├── dashboard/
│   ├── reports/
│   ├── notifications/
│   └── audit/
├── lib/
├── styles/
├── main.tsx
└── vite-env.d.ts
```

Each feature only creates the subfolders it actually needs:

```text
features/feature-name/
├── api/
├── components/
├── hooks/
├── pages/
├── types/
├── lib/
└── index.ts
```

Do not create empty folders just to match a template.

## Architecture Principles

### 1. Frontend uses feature-first architecture

- Business code is grouped by domain first, not by technical layer across the whole app.
- Each feature owns its pages, domain hooks, API calls, local components, types, and helper logic.
- Shared code stays outside features only when it is truly shared.

### 2. Backend keeps package-by-feature

- Backend stays organized by feature/domain.
- Frontend must mirror that organization at the domain level.
- The frontend structure should make it obvious which backend module a screen belongs to.

### 3. Frontend and backend align by domain

```text
backend/product      -> frontend/features/products
backend/customer     -> frontend/features/customers
backend/inventory    -> frontend/features/inventory
backend/sales        -> frontend/features/sales
backend/payment      -> frontend/features/payments
backend/report       -> frontend/features/reports
backend/auth         -> frontend/features/auth
backend/notification -> frontend/features/notifications
backend/audit        -> frontend/features/audit
```

The naming may differ slightly where frontend routes use plural form, but ownership must stay aligned by domain.

## Ownership Rules

- Code that belongs to only one feature must live inside that feature.
- Truly shared UI components belong in `src/components/common`.
- Application shell, navigation, route guards, and provider composition belong in `src/app`.
- App-level layouts belong in `src/app/layouts`.
- Shared utilities such as `apiClient`, formatters, and reusable helpers belong in `src/lib`.
- CSS Modules must sit next to the component that owns them.
- Global CSS must stay inside `src/styles`.
- A component used by only one page must not be moved into shared.
- A page-specific helper component should stay close to that page or feature, not in global shared folders.

## Import Rules

- Do not import deeply into another feature's internals.
- Each feature should expose only its public API through `index.ts`.
- Inside a feature, prefer direct imports over local barrel indirection when that avoids circular dependency.
- Do not create deeply nested barrel chains.
- After a feature is migrated, do not import from old page/service locations for that feature.
- Feature A must not import from an internal path inside feature B.
- Cross-feature usage must go through the public entry of the target feature.

## Naming Rules

- Feature folder names use lowercase.
- Frontend feature names may use plural form to match routes.
- Component names and component folders use PascalCase.
- CSS Module files use `ComponentName.module.css`.
- Type files use `*.types.ts`.
- Service files use `*Service.ts`.
- Query hook files use `use*Queries.ts`.
- Page folders use PascalCase.

## Migration Rules

- Migrate one feature at a time.
- Use one commit per feature migration.
- Keep API, endpoints, query keys, request/response shapes, props, logic, routes, and UI unchanged during migration.
- Delete old files only after all imports are removed.
- Run build and runtime checks after each feature migration.
- Do not modify another feature unless there is a direct dependency that must be updated safely.

## Anti-Patterns

- `useAppQueries.ts` containing queries for the entire system.
- `types/index.ts` acting as one global dumping ground for all domains.
- One feature split across `pages`, `hooks`, `services`, and `types` at app root with no clear ownership.
- Shared folders containing components used by only one page.
- Keeping legacy app shell code in `src/components/layout` after it has moved to `src/app/layouts`.
- Creating empty folders for appearance only.
- Creating abstractions only to make structure look more advanced.
- Over-engineering architecture before the code needs it.
- Deep cross-feature imports.
- One commit mixing multiple unrelated feature migrations.

## Definition Of Done For Each Feature Migration

- `npm run build` passes.
- The route renders normally.
- No resource 404 occurs.
- No runtime error occurs.
- Business logic does not change.
- Old imports for the migrated feature are removed.
- No old file remains that can confuse module resolution.
- The working tree contains only the intended changes for that feature.
- API, query keys, props, and UI remain unchanged.

## Practical Guidance

- Start from the current working feature and move only the files that clearly belong to that domain.
- Keep shared dependencies stable while migrating.
- Prefer small, reversible moves over large repo-wide rewrites.
- If a helper is reused by multiple domains, keep it in `lib` or shared only after confirming that it is truly generic.
- If a component looks shared but is only used by one route, keep it inside that feature until reuse is real.

## Migration Boundary

This document defines the target architecture and migration rules.

It does not require all features to be migrated immediately.

The migration should proceed incrementally, safely, and feature by feature.
