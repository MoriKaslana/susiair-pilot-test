Susi Air Pilot App: Fullstack Developer Technical Test

A small slice of the Susi Air Pilot App: a NestJS REST API and a Nuxt 3 mobile-first web app. Pilots sign in, see how close they are to their flight-hour limits, check document expiry, and browse their monthly duty schedule.

Quick start for reviewers
	
Frontend (live)	https://susiair-pilot-test-1cyv.vercel.app
Backend API (live)	https://susiair-pilot-test.vercel.app (try /health)
Login	username johndoe / password susiairtest
Repository	https://github.com/MoriKaslana/susiair-pilot-test

Best viewed at phone width (it is a mobile-first app; on desktop it renders as a centered column).

Things to try:

Sign in with a wrong password, to see the clear error message.
On Home, switch the chart between 1w, 1m, 3m, 6m, 1y.
Open Schedule and move between months (each move calls the API).
Tap a date, which opens the "Detail page coming soon" placeholder.
Table of contents
Tech stack
Repository structure
Setup and run
Environment variables
API reference
Frontend overview
Key decisions and why
Edge cases handled
Verifying the numbers
Testing
Deployment
Note on AI assistance
What I would change with more time
Tech stack

Frontend (/nuxt): Nuxt 3 (Composition API, <script setup lang="ts">), Pinia, SCSS, lucide-vue-next for line icons, Plus Jakarta Sans from Google Fonts. The chart is hand-written SVG (no chart library).

Backend (/nest): NestJS 10 on Node.js, TypeScript, class-validator / class-transformer for validation, @nestjs/jwt for tokens, @nestjs/config for configuration. Jest for unit and e2e tests.

Data source: the three provided JSON files, loaded into memory at startup. There is no database.

Repository structure
/
├── nest/                          NestJS API
│   ├── src/
│   │   ├── main.ts                bootstrap
│   │   ├── app.module.ts
│   │   ├── app.setup.ts           validation pipe + CORS (shared by main.ts and e2e tests)
│   │   ├── config/                configuration (env vars, defaults)
│   │   ├── common/
│   │   │   ├── decorators/        @Public()
│   │   │   ├── guards/            JwtAuthGuard (global)
│   │   │   ├── filters/           AllExceptionsFilter (global)
│   │   │   ├── validators/        @IsIsoDate()
│   │   │   └── utils/             UTC date helpers
│   │   ├── data/                  DataService + the three JSON files (data/files/)
│   │   ├── auth/                  module, controller, service, DTO
│   │   ├── pilot/
│   │   ├── flight-hours/          includes rollingWindowBluffing()
│   │   ├── documents/
│   │   ├── schedules/
│   │   └── health/
│   └── test/                      e2e tests
└── nuxt/                          Nuxt 3 app
    ├── pages/                     login, index (Home), schedule/, logbook, more
    ├── components/                chart, cards, calendar, badges, nav, ...
    ├── stores/                    Pinia: auth, pilot, flightHours, documents, schedule
    ├── composables/               useApi, useDateFormat, useContrastColor
    ├── middleware/                global auth redirect
    ├── layouts/                   default (app shell + bottom nav), auth
    ├── utils/                     API error normalisation
    ├── types/                     API response types
    └── assets/scss/               design tokens and base styles
Setup and run

Requirements: Node.js 20 or newer and npm.

Backend
bash
cd nest
npm install
cp .env.example .env      # optional: every variable has a sensible default
npm run start:dev         # http://localhost:3001

Production-style run: npm run build && node dist/main.

Frontend
bash
cd nuxt
npm install
echo "NUXT_PUBLIC_API_BASE=http://localhost:3001" > .env
npm run dev               # http://localhost:3000

Start the backend first. Run the frontend on port 3000, because the backend's default CORS setting allows that origin (see FRONTEND_ORIGIN). To run against the live API instead, set NUXT_PUBLIC_API_BASE=https://susiair-pilot-test.vercel.app.

Production build: npm run build.

Environment variables
Backend (nest/.env)
Variable	Default	Purpose
PORT	3001	HTTP port (hosting platforms set this themselves)
JWT_SECRET	dev-secret-change-me	Secret used to sign tokens. Set a long random value in production.
APP_TODAY	2026-05-15	The app's "today" (see decisions)
FRONTEND_ORIGIN	http://localhost:3000	Allowed CORS origin(s). Comma-separated list, exact origins, no trailing slash.
AVATAR_URL	DiceBear initials URL for "John Doe"	Pilot avatar (the data has none)
Frontend (nuxt/.env)
Variable	Default	Purpose
NUXT_PUBLIC_API_BASE	http://localhost:3001	Base URL of the API
API reference

All endpoints except POST /auth/login and GET /health require Authorization: Bearer <token>.

Method	Path	Description
POST	/auth/login	Body { username, password }. Returns { accessToken, tokenType, expiresIn }. Bad credentials return 401 with "Invalid username or password".
GET	/pilot/me	{ name, totalFlightHours, avatarUrl, today }
GET	/flight-hours?from=YYYY-MM-DD&to=YYYY-MM-DD	One entry for every day in the range (missing days are 0).
GET	/flight-hours/summary?range=1w|1m|3m|6m|1y	Rolling-sum series for the chart: 15 points (today ± 7 days) plus limit, max, windowDays.
GET	/flight-hours/limits	Extra endpoint. The four limit cards (daily 8 h, weekly 40 h, monthly 100 h, annual 1050 h) with the hours flown in each window ending today.
GET	/documents	Documents with daysRemaining and a server-computed status (safe, soon, expired).
GET	/schedules?year=YYYY&month=M	Schedule entries for that month, plus the duty-type legend.
GET	/health	Public health check.

Example, GET /flight-hours/summary?range=1w (shortened):

json
{
  "range": "1w",
  "today": "2026-05-15",
  "windowDays": 7,
  "limit": 40,
  "max": 45,
  "points": [
    { "date": "2026-05-08", "hours": 5.2, "rollingSum": 15, "isFuture": false },
    "... 15 points, today is index 7 ...",
    { "date": "2026-05-22", "hours": 0, "rollingSum": 36.3, "isFuture": true }
  ]
}

Validation (global ValidationPipe with whitelist and forbidNonWhitelisted): dates must be real calendar dates in YYYY-MM-DD (so 2026-02-30 is rejected), from must not be after to, a range is at most 400 days, range must be one of the five values, year is 2000 to 2100 and month is 1 to 12.

Errors always have one shape, from a global exception filter:

json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["month must not be greater than 12"],
  "path": "/schedules?year=2026&month=13",
  "timestamp": "2026-10-09T01:10:00.293Z"
}

Unexpected errors are logged on the server and returned as a generic 500 without internal details.

Frontend overview
Sign In: username and password form, show/hide password, loading state, and a clear inline message for bad credentials (and a separate message when the server cannot be reached).
Home: header (greeting, name, total flight hours, avatar); four limit cards with progress bars; the rolling-sum chart with a 1w / 1m / 3m / 6m / 1y toggle (default 1w); the My Documents list with expiry badges. Each section loads independently with its own skeleton and Retry button.
Schedule: monthly calendar (Monday first) with previous/next buttons that each call /schedules, day cells colored by the API's base_color, a tick or a remaining-duties number per day, a legend from the API, and today highlighted. Tapping a date opens the "Detail page coming soon" placeholder.
Logbook and More: lightweight screens so the bottom navigation has no dead links. More includes Sign out.
Bottom navigation: Home, Schedule, Logbook, More.
Design: palette, radii, shadows and typography follow the brief. Tokens live in assets/scss/_tokens.scss, and components do not hard-code brand colors. The Susi Air logo comes from susiair.com.
Auth flow: the token is kept in a cookie, a global route middleware redirects anonymous users to /login, and any 401 from the API clears the session and returns to the login page.
Key decisions and why

"Today" is a configured constant, not the system clock. The backend reads APP_TODAY (default 2026-05-15) and exposes it as today in /pilot/me and the other responses. The frontend uses that value for the chart's centre, the calendar's initial month and the today highlight. Nothing uses new Date() to decide "today", so the app behaves identically whenever it is reviewed. (The only clock use is the time-of-day greeting.) The today stored inside mock-documents.json (2026-05-31) is deliberately ignored, because the brief says today is 15 May.

The rolling sum runs on the server in rollingWindowBluffing(), as required, with the specified comment directly above it. The method is pure: it takes the date-to-hours map, an end date and a window size.

The window is inclusive of the end date: a 7-day window ending on D covers D-6 to D.
Missing days count as 0 and are never skipped, and the window is never shrunk or normalised.
Windows reaching before the dataset's first day (27 Dec 2024) simply contribute 0 for the missing days. With today fixed at 15 May 2026 every displayed point has full data, but the behaviour is defined and unit-tested.
Values are rounded to one decimal only at the output, to avoid floating-point noise.
All dates are handled as UTC day indexes, so there is no timezone drift.

Future dates use the planned hours already present in the data. The file runs until 31 May 2026, which is after "today". For future days the rolling sum includes those planned hours, and each point carries isFuture, which the chart draws lighter and dashed. Beyond the end of the file the hours are 0. This is why the 1w line crosses the red limit around 18 to 21 May (peak 44.7 h on 20 May).

Total flight hours (1444.5) is taken from the data file as provided. It equals the sum of all 521 days, including 59.1 planned hours after today; the hours flown up to 15 May are 1385.4. I kept the file's value and documented the difference.

Document status is computed by the API against APP_TODAY, so the frontend only renders the badge. daysRemaining <= 0 is expired, <= 30 (from the data's warningDays) is soon, otherwise safe.

Schedule data follows the dataset. Duty codes and colors come from the API (DTY, RLV, TRD, TRX, ULV, and so on, which differ slightly from the abbreviations in the brief). Each day uses the entry's own base_color, and the legend comes from the API legend. The status indicator uses count_logbooks === count_schedules (not the status field): a tick when equal, otherwise the number of remaining duties (count_schedules - count_logbooks). Text color on each cell is chosen by contrast so light colors stay readable.

An extra endpoint, GET /flight-hours/limits. The four limit cards need different windows (1, 7, 30, 365 days) than the chart range, so a dedicated endpoint avoids refetching them when the chart toggle changes. It calls the same rollingWindowBluffing().

Hand-written SVG chart. No dependency and no SSR issues, with full control of the clamp and limit line. Plotted values are clamped to [0, max] so nothing can break the layout, while the tooltip still shows the real value. The Y maximum and the red limit line come from the API for each range.

Authentication. One hardcoded pilot account, signed JWTs (12 hours), and a global guard applied to every route with a @Public() decorator to opt out (login and health only).

Data is imported into the code, not read from disk. The three JSON files live in nest/src/data/files/ and are imported by DataService, so every host bundles them automatically. An earlier approach read them from process.cwd(), which failed on a serverless host.

Backend hosting. The brief suggests Railway, Render or Fly for the backend. Those options required a payment card (my bank's card was declined) or a trial that expires, so I deployed the backend to Vercel, which has a free plan without a card. The API is stateless (in-memory read-only data and JWTs), so it runs fine as a serverless function. Its code is a plain Node app and can be moved to any Node host without changes.

Other choices. The calendar starts on Monday. Limit-card bars are green below 75 %, amber from 75 % to 99 %, and red at 100 % or more. The token is stored in a cookie so it is also available during server rendering. Stale responses are ignored (for example when switching chart ranges or months quickly). Logbook and More are minimal because the brief only requires them as navigation items.

Edge cases handled
Zero-hour days contribute 0 and are never skipped.
Windows before the dataset start and dates after its end return 0 for the missing days.
Future dates return a value (planned hours) and are flagged.
Rolling sums above the red line render without breaking the chart layout (clamped).
Invalid dates, reversed ranges, oversized ranges, a bad range value and out-of-range year/month return a 400 in the standard error shape.
A month without schedule entries returns an empty list, and the UI shows an empty state instead of an error.
Network failures and expired sessions are handled in the UI (clear message, or redirect to sign in).
Verifying the numbers

With today = 15 May 2026 the API should return:

Check	Expected
Limit cards (daily / weekly / monthly / annual)	6.4 / 25.2 / 87.2 / 1013.8 hours
Rolling sum at today for 1w, 1m, 3m, 6m, 1y	25.2, 87.2, 247.6, 488.2, 1013.8
1w peak in the display range	44.7 h on 20 May (limit 40, chart max 45)
Document status (recurrent, PPC, license, medical, security)	safe, safe, soon (14 days), soon (27 days), expired (14 days ago)
Schedule entries for April / May / June 2026	17 / 21 / 16
13 Apr and 22 Apr (unfinished logbooks)	badge 2 and badge 1
15 May	tick (6 of 6 logged)
Testing

Backend tests (run from nest/):

bash
npm test            # 4 suites, 23 unit tests
npm run test:e2e    # 17 end-to-end tests against the real HTTP app

They cover rollingWindowBluffing() (inclusive window, missing days, windows before the dataset, dates beyond it), the four limit cards and the 15-point series against the real data, document-status boundaries (including 0 and 30 days and a different APP_TODAY), schedule month filtering, the exception filter shape, and the guard, validation and error responses end to end.

The frontend has no automated tests yet (see below). It was checked manually against the numbers above.

Deployment

Both apps are deployed on Vercel from this repository as two separate projects.

Project	Root Directory	Environment variables
Backend	nest	JWT_SECRET, APP_TODAY, FRONTEND_ORIGIN (the frontend's exact URL; add http://localhost:3000 as well for local development)
Frontend	nuxt	NUXT_PUBLIC_API_BASE (the backend's URL, without a trailing slash)

Changing an environment variable needs a redeploy. The first request after a period of inactivity can be slower because of serverless cold starts.

Note on AI assistance

I built this project with AI assistance (Claude and Zed's coding agent). I reviewed, tested and ran the code myself, and I can walk through any part of it.

What I would change with more time
A real user store with hashed passwords, plus refresh tokens and token revocation.
A real logbook API and screen (with logging flights), and the schedule detail screen.
Frontend tests (component tests for the chart and calendar, Playwright for the main flows), and CI that runs the backend and frontend tests on every push.
Accessibility review (focus order, chart keyboard navigation and screen-reader summary, color contrast of schedule colors).
Caching headers and a small in-memory cache for the summary calculation.
A typed API client shared between the two apps (for example generated from an OpenAPI spec).
Pagination or limits for larger datasets, and a database (SQLite with Prisma) if the data were editable.
Observability: request logging, error tracking, and a proper health check.
