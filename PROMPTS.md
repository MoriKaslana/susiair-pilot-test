# Zed prompts: paste one at a time, in order

Before you start: put `AGENTS.md` at the repo root (Zed reads it automatically as project rules), and copy the 3 JSON files into `nest/data/`. Open the repo ROOT folder in Zed so the agent can see both apps.

Rule of thumb: run the prompt, read the diff, run the verification step, `git commit`, then move on. Don't paste the next prompt until the current one passes.

---

## Prompt 0: Scaffold

```
Read AGENTS.md first. Then scaffold the monorepo:

1. /nest: a NestJS project (TypeScript). Install @nestjs/jwt, class-validator, class-transformer, @nestjs/config. Add Jest (comes with Nest).
2. /nuxt: a Nuxt 3 project (TypeScript). Install @pinia/nuxt, pinia, sass, lucide-vue-next.
3. Root: .gitignore (node_modules, dist, .nuxt, .output, .env), a short root README stub, and .env.example files in both apps listing: nest -> PORT, JWT_SECRET, APP_TODAY, FRONTEND_ORIGIN, AVATAR_URL; nuxt -> NUXT_PUBLIC_API_BASE.
4. Make sure nest/data/ exists and is read at runtime from process.cwd()/data (do not move or edit the JSON files).

Don't build any features yet. Tell me the commands to run each app and confirm both start.
```

**Verify:** `cd nest && npm run start:dev` boots; `cd nuxt && npm run dev` boots.

---

## Prompt 1: Backend

```
Read AGENTS.md first, especially the "Hard requirements", "Backend rules" and "API contract" sections. Build the whole NestJS backend exactly to that contract.

Requirements checklist:
- DataModule/DataService loads the 3 JSON files once at startup into memory (read-only).
- A single config place for APP_TODAY (default 2026-05-15) via @nestjs/config; never use new Date() for today.
- Modules auth, pilot, flight-hours, documents, schedules, each with controller + service + DTOs.
- Global ValidationPipe, global exception filter with the exact error shape in AGENTS.md, global JWT guard with a @Public() decorator used only on POST /auth/login.
- CORS from FRONTEND_ORIGIN.
- In flight-hours.service.ts, implement the rolling sum in a method named exactly rollingWindowBluffing(hoursByDate: Map<string, number>, endDate: string, windowDays: number): number, with the line directly above it being exactly:
  // this is a rolling sum calculation :)
  Everything (summary, limits cards) must call this method.
- UTC day-index date helpers in common/date.util.ts. Round to 1 decimal only at output.
- Jest tests: rollingWindowBluffing (missing days = 0, window before dataset start, future dates) and documents status (safe/soon/expired boundaries incl. daysRemaining === 0 and === 30).

When done, print a table of curl commands for every endpoint (login first, then the rest with the Bearer token).
```

**Verify** (numbers from the guide, section 3):

```bash
TOKEN=$(curl -s -X POST localhost:3001/auth/login -H 'content-type: application/json' \
  -d '{"username":"johndoe","password":"susiairtest"}' | jq -r .accessToken)
curl -s localhost:3001/flight-hours/limits -H "authorization: Bearer $TOKEN"     # 6.4 / 25.2 / 87.2 / 1013.8
curl -s "localhost:3001/flight-hours/summary?range=1w" -H "authorization: Bearer $TOKEN"
curl -s localhost:3001/documents -H "authorization: Bearer $TOKEN"                # soon, soon, expired, safe, safe
curl -s "localhost:3001/schedules?year=2026&month=5" -H "authorization: Bearer $TOKEN"   # 21 entries
curl -s localhost:3001/pilot/me                                                   # must be 401
curl -s "localhost:3001/schedules?year=2026&month=13" -H "authorization: Bearer $TOKEN"  # 400, standard error shape
```

---

## Prompt 2: Frontend foundation + Sign In

```
Read AGENTS.md first (Frontend rules + Design tokens). Build the Nuxt foundation and the Sign In page:

1. assets/scss/_tokens.scss with the palette, radii, shadows, spacing; global styles; load Plus Jakarta Sans from Google Fonts (weights 400-800) via nuxt.config.
2. runtimeConfig.public.apiBase from NUXT_PUBLIC_API_BASE (default http://localhost:3001).
3. composables/useApi.ts ($fetch wrapper: base URL, Bearer token, 401 -> logout + redirect to /login, normalises the backend error shape { statusCode, error, message } into a thrown error with a usable message).
4. Pinia auth store (login, logout, token via useCookie) + route middleware (guard all routes except /login).
5. layouts: "default" (mobile app shell, max-width 480px centered, bottom nav Home/Schedule/Logbook/More with lucide icons, active state) and "auth" (no nav).
6. pages/login.vue: Susi Air logo (nuxt/public/susiair-logo.* - leave a clearly named placeholder file if I haven't added it yet), username + password form, pill primary button in brand red, loading state, and a clear inline error message on bad credentials ("Invalid username or password"). Also handle network errors with a separate message ("Can't reach the server, try again").
7. Placeholder pages: /logbook and /more ("Coming soon").

Don't build Home or Schedule yet. Tell me how to test the login flow.
```

**Verify:** wrong password shows the red error; correct login lands on `/`; refreshing keeps you signed in; visiting `/` while logged out redirects to `/login`.

---

## Prompt 3: Home page

```
Read AGENTS.md first. Build pages/index.vue (Home) wired to the real API, using Pinia stores pilot, flightHours, documents.

1. Header: greeting (time-of-day greeting is fine), pilot name, total flight hours (bold number), avatar, from GET /pilot/me.
2. "Hours to Limit" section:
   a. Four limit cards from GET /flight-hours/limits: label, hours in window, "/ limit", progress bar, color green <75%, amber 75-99%, red >=100%. Bold numerals.
   b. components/FlightHoursChart.vue: hand-written SVG, no chart library. Data from GET /flight-hours/summary?range=. 15 points, today centered and visibly marked, Y axis 0..max from the API, red dashed limit line at `limit` with a label, x labels as day numbers (and weekday or month where helpful), future points lighter/dashed. Clamp plotted values to [0, max] so nothing breaks the layout when the sum is near/over the limit. Responsive (viewBox), readable on a 360px-wide screen. Show the value of today's point and let me tap a point to see its date/value.
   c. Toggle 1w | 1m | 3m | 6m | 1y (pill segmented control), default 1w, refetches on change, keeps previous chart visible with a subtle loading state instead of flashing empty.
3. "My Documents": list from GET /documents. Each row: label, expiry date formatted (e.g. 29 May 2026), and a badge colored by the API `status` (safe=green, soon=amber, expired=red) with text like "14 days left" / "Expired 14 days ago". Do not recompute status on the client.
4. Loading skeletons, error + retry state per section, so one failing call doesn't blank the page.

Format dates without using new Date() for "today". Tell me what to compare against: with today = 2026-05-15 the cards should read 6.4/8, 25.2/40, 87.2/100, 1013.8/1050.
```

**Verify:** card numbers above; chart shows 15 points with today in the middle; 1w line peaks around 44.7 on 20 May (just under the 45 max, above the 40 line) without breaking layout; documents show amber, amber, red, green, green.

---

## Prompt 4: Schedule page

```
Read AGENTS.md first. Build pages/schedule/index.vue and pages/schedule/[date].vue using a Pinia schedule store.

1. Month calendar, Monday-first, header with "May 2026" and previous/next buttons. Initial month = month of `today` from the API (GET /pilot/me), NOT new Date(). Every month change calls GET /schedules?year=YYYY&month=MM (no client-side caching that skips the call is fine, but the call must happen on change).
2. Each day cell: day number, `base_name` under it, background = `base_color` from the API. Pick white or navy text automatically by luminance so light colors (e.g. #9CA3AF, #FBA577) stay readable. Days with no entry are plain.
3. Status indicator top-right of the cell: remaining = count_schedules - count_logbooks. If remaining === 0 show a tick icon, otherwise show the remaining number. (Examples: 2026-04-13 has 4 schedules / 2 logbooks -> "2"; 2026-05-15 has 6/6 -> tick.)
4. Highlight today with an outline.
5. Legend below the calendar, rendered from the API `legend` (color swatch + code + label). No hard-coded legend.
6. Loading + error + empty month states (e.g. March 2026 has no entries).
7. Tapping a day navigates to /schedule/YYYY-MM-DD, which shows the date and the text "Detail page coming soon" plus a back button.

Mobile-first: cells must stay tappable (min ~44px) at 360px wide.
```

**Verify:** April shows 17 colored days, May 21, June 16; 22 Apr shows "1", 13 Apr shows "2", 15 May shows a tick; legend has 10 items; navigating to March shows an empty-state, not an error.

---

## Prompt 5: Polish, deploy config, README

```
Read AGENTS.md first.

1. Review the whole repo against AGENTS.md "Hard requirements" and report anything that violates them (especially: no new Date() for today anywhere, the exact rollingWindowBluffing name and the exact comment directly above it, guard on all routes except login, no mock data in the frontend). Fix violations.
2. Deployment readiness:
   - nest: `npm run build` + `node dist/main` works; data folder is found at runtime from process.cwd(); PORT honored; CORS from FRONTEND_ORIGIN; add a GET /health endpoint marked @Public().
   - nuxt: builds for Vercel/Netlify; NUXT_PUBLIC_API_BASE used at runtime; no localhost hard-coding.
3. Write the root README.md covering: overview, repo structure, how to set up and run each app, required environment variables (table), live URLs placeholders, API endpoint table incl. the extra /flight-hours/limits and /health, and the main decisions with reasons:
   - APP_TODAY configurable, documents.json "today" ignored
   - rolling window inclusive of the end date, missing days = 0, no window shrinking before 27 Dec 2024
   - future dates use planned hours from the data (isFuture flag), beyond data = 0
   - totalFlightHours taken from the data file (it includes planned hours after today; say so)
   - duty codes follow the data (DTY/RLV/TRD/TRX/ULV), colors from base_color
   - hand-written SVG chart instead of a library
   - remaining-duties indicator = count_schedules - count_logbooks
   - hardcoded user + JWT instead of a user DB
   And a "What I'd change with more time" section (real user store + hashed passwords, refresh tokens, e2e tests, caching, accessibility audit, real avatar upload, logbook module, offline support, Render free-tier cold start mitigation).
4. Run all tests and a final production build of both apps and report the results.
```

---

## Prompt 6 (only if something breaks): debugging

```
Here is the problem: <what you did / what you expected / what happened>.
Error output: <paste>.
Check against AGENTS.md first. Find the root cause before changing code, and make the smallest fix.
```
