# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

DOUBLEcheck is a film production management platform — a pnpm monorepo (Turborepo) with one main Next.js 15 app (`apps/web`) and shared packages (`packages/schemas`, `packages/ui`, configs). All data is stored in Firebase (Firestore, Auth, Storage) via client SDK — no separate backend server is needed.

### Environment Variables

Firebase credentials must be present as `NEXT_PUBLIC_FIREBASE_*` environment variables. The update script auto-generates `apps/web/.env.local` from these. If secrets are missing, the app will fail at startup with Zod validation errors from `src/lib/env.ts`.

### Running the Dev Server

```bash
pnpm --filter web dev   # starts Next.js on http://localhost:3000
```

Or `pnpm dev` from root (starts all workspace dev tasks via Turborepo).

### Available Commands

See `package.json` scripts in root. Key commands:
- `pnpm lint` — runs ESLint (only `web` package has eslint installed; `ui`/`schemas` lint scripts will fail)
- `pnpm --filter web lint` — lint just the web app (recommended)
- `pnpm type-check` — TypeScript checking (deprecated `@doublecheck/api` package has pre-existing errors)
- `pnpm build` — production build via Turborepo (use `SKIP_ENV_VALIDATION=1` if env vars aren't set)

### Known Issues (Pre-existing)

- `pnpm type-check` fails in `@doublecheck/api` (deprecated) and has many errors in `web` due to `zod` module resolution in pnpm strict mode. The Next.js build uses SWC and succeeds regardless.
- `packages/ui` and `packages/schemas` reference `eslint` in their lint scripts but don't list it as a devDependency, so `pnpm lint` (via turbo) fails for those packages. Use `pnpm --filter web lint` instead.
- Node engine warning: `.nvmrc` says 20 but Node 22 works fine; the root `engines` field requires `>=18`.
- There is a stale `apps/web/package-lock.json` that triggers a Next.js warning about multiple lockfiles. It can be safely ignored.

### No Test Framework

This codebase has no automated test framework (no Jest, Vitest, Playwright, Cypress). Testing is limited to `pnpm lint` and `pnpm type-check`.
