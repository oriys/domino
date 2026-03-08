# Domino Copilot Instructions

## Commands

- Use `pnpm` in this repo (`pnpm-lock.yaml` is committed).
- Install dependencies: `pnpm install`
- Start the dev server: `pnpm dev`
- Build for production: `pnpm build`
- Start the production server: `pnpm start`
- Lint the repo: `pnpm lint`
- Start PostgreSQL locally: `docker compose up -d`
- Generate a new Drizzle migration: `pnpm db:generate`
- Apply migrations: `pnpm db:migrate`
- Open Drizzle Studio: `pnpm db:studio`
- There is no test framework or `test` script configured right now, so there is no single-test command to run.

## Architecture

- This is a Next.js 16 App Router project with a single client-side screen for the product UI: `app/layout.tsx` provides metadata, theme wiring, and Vercel Analytics, while `app/page.tsx` owns the frontend state machine, search filtering, and data fetching.
- `app/page.tsx` keeps view-mode/navigation state (`viewMode`, `sidebarCollapsed`, `selectedApiId`, `searchQuery`) on the client, but API data now comes from `/api/apis` instead of in-memory seed state.
- `components/api-platform/` contains the domain-specific UI for those four surfaces:
  - `api-list.tsx` groups APIs by status and raises create/select/delete/preview/publish actions back to the page.
  - `api-editor.tsx` keeps a local editable copy of the selected API, including request/response field descriptions that can be generated from example JSON and edited in both UI and raw JSON modes.
  - `api-preview.tsx` renders documentation, field-level request/response descriptions, example code, and a mocked "Try It" flow.
  - `publish-workflow.tsx` is a real multi-step release flow with persisted changelogs, semantic version choices, and validation-driven publish gating.
- Shared app chrome also includes `components/theme-provider.tsx` and `components/theme-toggle.tsx` for class-based appearance switching via `next-themes`; the header uses a one-click sun/moon toggle instead of a settings menu.
- Backend persistence is split across:
  - `app/api/apis/route.ts` and `app/api/apis/[id]/route.ts` for CRUD route handlers.
  - `app/api/apis/[id]/publish/route.ts` for release publishing.
  - `lib/api-platform/server.ts` for Drizzle-backed CRUD/release helpers and first-run sample-data bootstrapping.
  - `lib/api-platform/publishing.ts` for semantic-version helpers and publish validation checks shared by the UI and backend.
  - `lib/api-platform/field-descriptions.ts` for generating field docs from JSON examples and parsing the raw JSON field editor.
  - `lib/db/schema.ts` and `drizzle/` for the PostgreSQL schema and generated migrations, including `api_releases`, `request_fields`, and `response_fields`.
  - `lib/db/index.ts` for the shared `pg` + Drizzle connection.
- Local PostgreSQL development is expected to run through `docker-compose.yml`.
- Shared UI primitives live in `components/ui/` and follow shadcn/Radix patterns; shared class merging lives in `lib/utils.ts` via `cn()`.

## Key conventions

- Use the `@/*` path alias from `tsconfig.json` for imports.
- Shared domain types and validation live in `lib/api-platform/types.ts`; import `ApiItem`, `ViewMode`, `httpMethods`, and `apiWriteSchema` from there instead of from UI files.
- Keep feature state lifted to `app/page.tsx`. The api-platform components stay callback-driven; persisted data mutations go through `lib/api-platform/client.ts`.
- Release history is stored in PostgreSQL through the `api_releases` table and exposed on each `ApiItem` as `releaseHistory`.
- Request/response field documentation is stored on each API row as `requestFields` and `responseFields`, separate from the raw example JSON bodies.
- Runtime design tokens live in `app/globals.css`, and `components.json` also points shadcn there. A second stylesheet exists at `styles/globals.css`, but the app layout imports `app/globals.css`.
- `app/globals.css` now defines both the light theme token set (`:root`) and the dark override (`.dark`), so appearance work should update both palettes together.
- The UI layer follows the generated shadcn style closely: components use `cva(...)` for variants, `cn(...)` for class merging, and `data-slot` attributes throughout the primitive wrappers.
- If you touch the shared sidebar or toast helpers, prefer the versions under `@/hooks/*`. Generated duplicates also exist under `components/ui/`, but the active UI helpers (`components/ui/sidebar.tsx`, `components/ui/toaster.tsx`) import from `@/hooks`.
- A repo-shared Playwright MCP configuration now lives at `.vscode/mcp.json` and launches with `npx -y @playwright/mcp@latest`.
- `GET /api/apis` bootstraps the demo sample rows when the table is empty, so a freshly migrated local database still matches the original UI experience.
- Publishing is validation-gated on both the client and the API route; blocked publish requests return 400s instead of silently creating bad releases.
- Field descriptions can be generated from the request/response example JSON, then refined via either the visual table editor or the raw JSON field editor.
- `next.config.mjs` sets `typescript.ignoreBuildErrors = true`, so a successful `pnpm build` does not guarantee type safety.
- Theme and toast scaffolding already exists (`components/theme-provider.tsx`, `components/ui/toaster.tsx`, `components/ui/sonner.tsx`), but `app/layout.tsx` does not mount them yet.
