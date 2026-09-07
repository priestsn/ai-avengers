# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Harid AI Chat: `src/routes/harid.ts` — SSE streaming chat with Gemini 2.5 Flash. Opening message is hardcoded (no API call). Server-side `cleanForSpeech()` strips all markdown before sending to client. One-question-per-response enforced via server-side truncation after first `?`. `[END_INTERVIEW]` tag detection uses raw (uncleaned) response text. Server sends `{ done: true, endInterview: true/false }` as final SSE event.
- Candidate Auth: `src/routes/candidate-auth.ts` — POST register/login, GET me/applications, PUT profile, GET cv-text. JWT tokens include `type: "candidate"` claim. Separate from HR auth.
- Pipeline Management: PATCH `/api/interviews/:id/pipeline-status` (HR auth required). Statuses: completato, in_valutazione, secondo_colloquio, proposta, assunto, rifiutato.
- Auth Middleware: `src/middlewares/auth.ts` — `requireAuth` rejects tokens with `type: "candidate"` (HR-only). `candidateId` for interview saves is derived server-side from candidate JWT, not trusted from client body.
- Feedback: `src/routes/feedback.ts` — POST `/api/feedback` (public, candidates), GET `/api/feedback` (auth required, HR only). Stores candidate bug reports/feedback in `feedback` DB table.
- Server TTS: `src/routes/tts.ts` — POST `/api/tts` accepts `{ text, lang }`, returns `audio/mpeg` via `msedge-tts`. Voice per language: it→DiegoNeural, en→GuyNeural, es→AlvaroNeural. No API key needed.
- Evaluate: `src/routes/evaluate.ts` — POST `/api/harid/evaluate` with `responseMimeType: "application/json"`, stores `conversationSummary` + `rawTranscript` in DB. Accepts optional `visualObservations` array; builds visual block with sanitized sub-scores and descriptions for Gemini prompt; returns `presentationAnalysis` narrative field for HR report.
- Score Cap Enforcement: Server-side enforcement of keyboard-only 60/100 score cap. When `aiAnalysis` JSON contains `deviceMode: "keyboard-only"` or `scoreCapped: true`, all scores (total, skills, speech, confidence) are capped at 60 before DB insert.
- Analyze Frame: `src/routes/harid.ts` — POST `/api/harid/analyze-frame` accepts `imageBase64`, optional `positionTitle`/`positionDescription`. Returns `score`, `issues`, `notes`, sub-scores (expression/gesture/attire/background/posture), `visualDescription`, and optional `appearanceScore` (for model positions).
- Depends on: `@workspace/db`, `@workspace/api-zod`, `@workspace/integrations-gemini-ai`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/video-interview` (`@workspace/video-interview`)

React + Vite frontend for the AI Avengers Video Interview Platform.

- **i18n**: Full multi-language support (Italian, English, Spanish, Mandarin Chinese). Files: `src/i18n/types.ts` (type definitions), `src/i18n/it.ts`, `src/i18n/en.ts`, `src/i18n/es.ts`, `src/i18n/zh.ts` (translations), `src/i18n/index.tsx` (context provider, `useI18n`/`useLang` hooks, `LANG_OPTIONS`). Language auto-detected from browser, persisted in localStorage.
- **AI language-awareness**: `lang` param is passed to `/api/harid/chat`, `/api/harid/evaluate`, `/api/tts`. Harid AI uses `LANG_CONFIG` in `harid.ts` to switch system prompts, greetings, and all UI-facing text per language. TTS voices: it→DiegoNeural, en→GuyNeural, es→AlvaroNeural, zh→YunxiNeural.
- **Microphone**: `getUserMedia` requests video-only (audio:false) for camera-mic mode to avoid conflict with `SpeechRecognition` API which manages its own audio capture. Previous recognition instance is aborted before creating a new one.
- **3D Avatar**: `HaridAvatar3D` (React Three Fiber + drei) renders a stylized 3D head/bust with lip-sync, blinking, thinking eye movement, and listening nod animations. Falls back to `HaridDigitalAvatar` (2D SVG) when WebGL is unavailable. Dependencies: `@react-three/fiber`, `@react-three/drei`, `three`.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
