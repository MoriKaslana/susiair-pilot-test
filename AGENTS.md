# Susi Air Pilot App — Technical Test (project rules)

Monorepo layout:

```
/nest    NestJS + TypeScript API
/nuxt    Nuxt 3 (Composition API, <script setup>, TypeScript) + Pinia + SCSS
/nest/data/mock-flight-hours.json, mock-documents.json, mock-schedules.json   (provided, DO NOT edit)
```

Always read this file before making changes. Keep changes small and explain what you did.

## Hard requirements (from the brief — never violate)

1. **"Today" is `2026-05-15`.** It is a configurable constant (`APP_TODAY` env var, default `2026-05-15`) in ONE place on the backend. Never use `new Date()` / `Date.now()` to represent today, anywhere (backend or frontend). The frontend gets `today` from the API.
2. `mock-documents.json` contains `"today": "2026-05-31"` — IGNORE it. Compute document status against `APP_TODAY`. Use only its `thresholds.warningDays` (30).
3. The rolling sum runs on the **server**. The method MUST be named exactly `rollingWindowBluffing`, and the line **directly above it** MUST be exactly `// this is a rolling sum calculation :)` (no blank line, no decorator, no other comment between them). Exactly one such method in the codebase; all rolling-sum calls go through it.
4. Auth guard on every endpoint except `POST /auth/login`. The guard validates the token issued by login.
5. Hardcoded account: username `johndoe`, password `susiairtest`.
6. No mock data in the frontend. Everything (including legend, colors, limits, chart bounds, today) comes from the API.
7. Data source = the three JSON files loaded into memory at startup. No database.

## Backend rules (NestJS)

- Modules: `auth`, `pilot`, `flight-hours`, `documents`, `schedules`, plus `common` (filter, guard, decorators) and `data` (a `DataModule`/`DataService` that loads the JSON once at boot and exposes it read-only).
- Each feature: module + controller + service + DTOs. Controllers stay thin; logic in services.
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` with class-validator DTOs.
- Global exception filter. Every error has this exact shape:
  ```json
  { "statusCode": 400, "error": "Bad Request", "message": "human readable string or string[]", "path": "/flight-hours", "timestamp": "2026-05-15T00:00:00.000Z" }
  ```
  (`timestamp` here is metadata about the error and may use real time; it must never feed business logic.)
- Auth: `@nestjs/jwt`, secret from `JWT_SECRET` env (dev default allowed), 12h expiry. Global `APP_GUARD` + `@Public()` decorator on login only.
- CORS enabled, allowed origin from `FRONTEND_ORIGIN` env (comma-separated list allowed; in dev allow `http://localhost:3000`).
- `PORT` from env, listen on `0.0.0.0`.
- Date math: treat `YYYY-MM-DD` strings as UTC day indexes (`Date.UTC(y, m-1, d) / 86400000`). Never parse with local time. No timezone drift.
- Read JSON from `path.join(process.cwd(), 'data')` so it works after `nest build` and on Render/Railway.

### API contract (keep exactly)

All except login require `Authorization: Bearer <token>`.

**POST /auth/login** `{ username, password }` → `201 { accessToken, tokenType: "Bearer", expiresIn }`. Bad credentials → `401` with message `"Invalid username or password"`.

**GET /pilot/me** → `{ name, totalFlightHours, avatarUrl, today }`
- `name`, `totalFlightHours` (1444.5) from `mock-flight-hours.json`.
- The data has no avatar: `avatarUrl` is a configurable URL (default `https://api.dicebear.com/7.x/initials/svg?seed=John%20Doe`).
- `today` = `APP_TODAY`.

**GET /flight-hours?from=YYYY-MM-DD&to=YYYY-MM-DD** → `{ from, to, days: [{ date, hours }] }`
- One entry for EVERY date in the range, missing dates = `0`. Validate format, real calendar date, `from <= to`, max span 400 days.

**GET /flight-hours/limits** (extra endpoint, document it in README) → 
```json
{ "today": "2026-05-15", "cards": [
  { "key": "daily",   "label": "Daily",   "windowDays": 1,   "limit": 8,    "hours": 6.4 },
  { "key": "weekly",  "label": "Weekly",  "windowDays": 7,   "limit": 40,   "hours": 25.2 },
  { "key": "monthly", "label": "Monthly", "windowDays": 30,  "limit": 100,  "hours": 87.2 },
  { "key": "annual",  "label": "Annual",  "windowDays": 365, "limit": 1050, "hours": 1013.8 } ] }
```
Limits come from `limits` in the JSON; windows are rolling and END on today (inclusive).

**GET /flight-hours/summary?range=1w|1m|3m|6m|1y** (default `1w`, validate with `@IsIn`) →
```json
{ "range": "1w", "today": "2026-05-15", "windowDays": 7, "limit": 40, "max": 45,
  "points": [ { "date": "2026-05-08", "hours": 5.2, "rollingSum": 15.0, "isFuture": false }, "... 15 points total: today-7 .. today+7, today at index 7 ..." ] }
```
- `limit`, `max`, `windowDays`, `displayRangeDays` come from `chartBounds` in the JSON.
- `rollingSum` for date D = sum of `hours` over `[D-(windowDays-1) .. D]` inclusive, computed by `rollingWindowBluffing`. Round to 1 decimal at the OUTPUT only (avoid float drift: sum then `Math.round(x*10)/10`).
- Missing dates, including windows reaching before 2024-12-27 or after 2026-05-31, count as `0` (no shrinking/normalising of the window).
- Future dates (`> today`) use the planned hours present in the file; beyond the file they are `0`. Set `isFuture: true` for them.

**GET /documents** → `{ today, warningDays, documents: [{ id, label, expiryDate, daysRemaining, status }] }`
- `daysRemaining = expiryDate - APP_TODAY` in whole days. `<= 0` → `"expired"`, `<= warningDays` → `"soon"`, else `"safe"`.

**GET /schedules?year=YYYY&month=MM** → `{ year, month, legend: [...], schedules: [...] }`
- `schedules` = entries whose `duty_date` falls in that month, passed through unchanged (keep snake_case field names as in the file). `legend` straight from the file. Validate `year` int 2000–2100, `month` int 1–12. A month with no entries returns an empty array, not an error.

## Frontend rules (Nuxt 3)

- Nuxt 3, TypeScript, `<script setup lang="ts">`, Pinia (`@pinia/nuxt`), SCSS (`sass`). Stores: `auth`, `pilot`, `flightHours`, `documents`, `schedule`.
- API base URL from `runtimeConfig.public.apiBase` (`NUXT_PUBLIC_API_BASE`). One `useApi()` composable wraps `$fetch`, attaches the Bearer token, and on `401` clears auth and redirects to `/login`.
- Token in a cookie via `useCookie` (works with SSR). Route middleware: unauthenticated → `/login`; authenticated visiting `/login` → `/`.
- Pages: `/login`, `/` (Home), `/schedule`, `/schedule/[date]` (placeholder text "Detail page coming soon"), `/logbook` and `/more` (simple "Coming soon" placeholders so the bottom nav has no dead links).
- Every data view has loading, error, and empty states.
- Do not use `new Date()` to decide "today", the initial month, or "is future". Use `today` from the API. (A time-of-day greeting from the browser clock is fine; nothing else.)
- Chart: hand-written SVG component (no chart library). 15 x positions, today centered (index 7) and marked. Y axis 0 → `max` from the API. Red dashed horizontal line at `limit`. Clamp drawn values to `[0, max]` so nothing overflows the plot. Future points drawn lighter/dashed. Toggle 1w · 1m · 3m · 6m · 1y, default 1w, refetches `/flight-hours/summary`.
- Limit cards: show `hours`, `/ limit`, and a progress bar. Color: green `< 75%`, amber `75–99%`, red `>= 100%`.
- Documents: badge color comes from the API `status` (safe=green, soon=amber, expired=red), show label + date + `daysRemaining` text.
- Schedule: month grid, Monday-first, prev/next buttons each call `/schedules?year=&month=`. Cell background = `base_color` from the API; choose white or navy text by luminance so light colors stay readable. Show `base_name` under the day number. Status indicator top-right: `remaining = count_schedules - count_logbooks`; if `remaining === 0` show a tick icon, else show the `remaining` number. Legend below from API `legend`. Tapping a date → `/schedule/YYYY-MM-DD`. Highlight today. Initial month = month of API `today`.

## Design tokens

Navy `#0E2138` · Brand red `#E63757` · Background `#F5F6F8` · Card `#FFFFFF` · Text primary `#0E2138` · Text secondary `#6B7280` · Success `#1FBF8F` · Warning `#F59E0B` · Danger `#E63757` · Chart accent `#22C5E8`.

- Font: Plus Jakarta Sans (Google Fonts); bold (700/800) for numbers.
- Cards: radius 12–16px, subtle shadow. Primary buttons: pill shape, brand red.
- Line icons only (`lucide-vue-next`).
- Minimalist, mobile-first, operational. App shell max-width ~480px, centered on desktop. Bottom nav: Home, Schedule, Logbook, More.
- Put tokens in `assets/scss/_tokens.scss` and use them everywhere; no hard-coded hex values in components.
- Logo: the Susi Air logo from susiair.com saved at `nuxt/public/susiair-logo.(svg|png)`.

## Quality bar

- TypeScript strict, no `any` unless justified. No dead code, no leftover console.logs.
- Add a few Jest unit tests for `rollingWindowBluffing` and the document-status logic (see expected numbers in GUIDE.md).
- Keep the README honest: decisions, trade-offs, what you'd do with more time.


## CURRENT STATE AND GUARDRAILS (read this first, it overrides anything above that conflicts)

State:
- The backend (/nest) is DONE and deployed at https://susiair-pilot-test.vercel.app. Do NOT edit /nest unless explicitly asked. The JSON data now lives in nest/src/data/files/ (compiled into the app), not nest/data.
- The frontend is Nuxt 3 (nuxt@3.x), NOT Nuxt 4. pages/, components/, stores/, composables/, layouts/, middleware/, assets/, types/ are at the nuxt/ root. There is no app/ directory. Never upgrade nuxt, pinia, vue or vue-router.
- Already built in /nuxt: login page, auth store (cookie token), composables/useApi.ts (useApi().request<T>(path, { query })), utils/api-error.ts, route middleware, layouts, bottom nav, SCSS tokens, API types in types/api.ts. Reuse them; do not rewrite them.
- Local frontend runs on http://localhost:3000 against the live API (NUXT_PUBLIC_API_BASE in nuxt/.env).

Guardrails:
- NEVER run git commit, git push, or any git command that changes history. The user commits manually after review.
- NEVER create or change vercel.json, Dockerfiles, CI files or any deployment config.
- NEVER run npm install / npm update / npx nuxi init or add new dependencies. Only these packages exist: nuxt 3, vue, vue-router, pinia, @pinia/nuxt, lucide-vue-next, sass. If something seems to need a new package, stop and ask.
- Only create or edit the files listed in the task. Do not touch other files.
- Never use new Date() or Date.now() to decide "today" or whether a date is in the future. Use the "today" value and "isFuture" flags returned by the API. Formatting a given ISO date string for display is fine (parse it as UTC).
- No hard-coded hex colors in components: use the SCSS variables from assets/scss/_tokens.scss (the one exception is base_color / legend colors that come from the API).
- No mock data in the frontend. Everything comes from the API.
- When finished: run "npx nuxi typecheck" and "npm run build" inside /nuxt, report the results, then STOP. Do not start any other task.
