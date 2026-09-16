# Frontend Architecture

The frontend uses a **feature-first** structure aligned with backend business domains.

## Structure

```text
frontend/src/
├── app/                 application shell, providers, router, theme
├── components/common/   genuinely shared UI components
├── features/            business features
├── i18n/                locale resources
├── lib/                 shared pure helpers
├── services/            shared transport client
├── styles/              design tokens, global styles, Ant Design overrides
└── types/               cross-feature transport contracts only
```

A feature creates only the folders it needs:

```text
features/<feature>/
├── api/
├── components/
├── hooks/
├── pages/
├── types/
├── lib/
└── index.ts
```

## Ownership Rules

- Feature-specific code stays inside the owning feature.
- Cross-feature imports use the target feature's public `index.ts` when practical.
- Shared UI belongs in `components/common` only when more than one domain uses it.
- App shell, theme, navigation, and routing belong in `app`.
- Shared formatters and deterministic helpers belong in `lib`.
- CSS Modules live next to their component.
- Global design decisions live in `styles/foundations` and `appTheme.ts`.

## Data Access

Pages/components do not call arbitrary URLs directly. Feature API modules and React Query hooks own remote data access.

The UI must not duplicate backend business calculations when a canonical backend value/query exists.

## Tables

All operational data tables follow the same rules:

- API/data source uses deterministic newest-first default ordering where appropriate.
- No sort arrow is active on initial render.
- User sorting cycles `neutral -> ascending -> descending -> neutral`.
- Shared sorter tooltip behavior is enabled.
- Multi-value filters use the shared checkbox multi-select control.
- Single-entity fields remain single-select when the domain allows only one value.
- Empty values use a clear placeholder such as `-`.

The consistency script in `frontend/scripts/ui-consistency.mjs` protects these conventions.

## Visual System

Authenticated business screens use a restrained B2B visual language:

- one brand accent for actions and focus;
- neutral page/card/table surfaces;
- semantic success/warning/danger colors only when they communicate state;
- minimal elevation and no decorative card motion;
- shared spacing, radius, typography, and border tokens;
- data density takes priority over promotional decoration.

Feature CSS should consume tokens from `styles/foundations/tokens.css` instead of introducing unrelated color systems.

## Forms

- Labels and validation remain close to the field.
- Business identifiers managed by the server are read-only in the UI.
- Searchable selects are used for large entity lists.
- Drawer/modal actions use consistent primary/cancel placement.

## i18n

Application copy uses translation keys. Vietnamese and English locale files must keep key parity.

Run:

```bash
npm run quality:ui
```

before committing frontend changes.

## Naming

- Feature directories: lowercase.
- React components and component directories: PascalCase.
- CSS Modules: `ComponentName.module.css`.
- Types: `*.types.ts`.
- API/service modules: `*Service.ts` where a service naming pattern is used.
- Query hooks: `use*Queries.ts`.

## Avoid

- repository-wide helper dumping grounds;
- deep imports into another feature's private folders;
- one component owning API calls, business rules, table columns, modal state, and unrelated page sections;
- abstractions created only to reduce line count;
- decorative colors/gradients with no semantic meaning;
- frontend permission checks used as a replacement for backend authorization.

## Definition of Done

For a frontend change:

```bash
npm run quality:ui
npm run build
```

Then verify the affected route, loading/empty/error states, permissions, mutations, and VI/EN behavior in the browser.
