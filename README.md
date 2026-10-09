# Susi Air Pilot App

Fullstack technical test: a **NestJS** REST API and a mobile-first **Nuxt 3** app. Pilots sign in, see their flight-hour limits with a rolling-sum chart, check document expiry, browse a monthly duty schedule and review their logbook.

> Built with AI assistance (Claude and Zed's agent). I reviewed, tested and ran the code myself.

## Live demo

| | |
| --- | --- |
| Frontend | https://susiair-pilot-test-1cyv.vercel.app |
| Backend | https://susiair-pilot-test.vercel.app (try `/health`) |
| Login | `johndoe` / `susiairtest` |

Best viewed at phone width.

## Repo structure

```
nest/   NestJS + TypeScript API (data in src/data/files/, no database)
nuxt/   Nuxt 3 + Pinia + SCSS (pages, components, stores, composables)
```

## Run locally

Requires Node.js 20+.

```bash
# backend: http://localhost:3001
cd nest && npm install && npm run start:dev

# frontend: http://localhost:3000 (start the backend first)
cd nuxt && npm install && cp .env.example .env && npm run dev
```

Tests: `npm test` and `npm run test:e2e` in `nest/` (23 unit and 17 e2e tests).

## Environment variables

| App | Variable | Default | Purpose |
| --- | --- | --- | --- |
| nest | `JWT_SECRET` | `dev-secret-change-me` | Token signing secret |
| nest | `APP_TODAY` | `2026-05-15` | The app's "today" |
| nest | `FRONTEND_ORIGIN` | `http://localhost:3000` | Allowed CORS origin(s), comma-separated |
| nest | `AVATAR_URL` | DiceBear initials URL | Pilot avatar |
| nest | `PORT` | `3001` | HTTP port |
| nuxt | `NUXT_PUBLIC_API_BASE` | `http://localhost:3001` | API base URL |

## API

All routes need `Authorization: Bearer <token>` except login and health. Errors always use one shape: `{ statusCode, error, message, path, timestamp }`.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/login` | `{ username, password }` returns `{ accessToken, tokenType, expiresIn }` |
| `GET` | `/pilot/me` | `{ name, totalFlightHours, avatarUrl, today }` |
| `GET` | `/flight-hours?from=&to=` | Hours per day, `0` for missing days |
| `GET` | `/flight-hours/summary?range=1w\|1m\|3m\|6m\|1y` | 15 chart points with `rollingSum`, `limit`, `max` |
| `GET` | `/flight-hours/limits` | **Extra.** The four limit cards (daily, weekly, monthly, annual) |
| `GET` | `/documents` | Documents with `daysRemaining` and a server-computed `status` |
| `GET` | `/schedules?year=&month=` | Month entries plus the legend |
| `GET` | `/health` | `{ "status": "ok" }` |
| `GET` | `/` | No route, returns `404` in the standard error shape |

## Key decisions

- **"Today" is `APP_TODAY`, never the system clock.** The frontend takes `today` from the API. The `today` inside `documents.json` is ignored.
- **Rolling sums are computed on the server** in `rollingWindowBluffing()`: the window includes the end date, missing days count as `0`, and the window never shrinks before the dataset start.
- **Future dates** use the planned hours in the file (flagged `isFuture`); beyond the file they are `0`.
- **`totalFlightHours`** (1444.5) comes from the data file, so it includes 59.1 planned hours after today.
- **Document status** (`safe` / `soon` / `expired`) is computed by the API.
- **Data is imported into the code**, so any host bundles it.
- **Auth:** JWT with one hardcoded account and a global guard. A global exception filter keeps one error shape.
- **Chart is hand-written SVG.** Values are clamped to the API's `[0, max]`, with a red dashed line at the limit.
- **Schedule colours and codes follow the data** (`base_color` and the API legend). The duty indicator is `count_schedules - count_logbooks`.
- **Logbook and More are simple screens**, and the schedule detail page is a placeholder.
- **Backend is on Vercel**, not Railway, Render or Fly, because the free options asked for a card that my bank declined. It works because the API is stateless.

## With more time

- A real user store with hashed passwords, and refresh tokens.
- Frontend and end-to-end tests in CI (the frontend has none yet, and no type-checker).
- An accessibility audit.
- A real logbook API and the schedule detail screen.
- Caching.
