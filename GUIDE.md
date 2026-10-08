# Susi Air Technical Test: Your Guide

Deadline: 5 calendar days from receiving the brief (email arrived ~1:24 PM). Submit to **it.admin@susiair.com**: GitHub repo link + live frontend URL + live backend URL.

Files in this kit:

| File | What it's for |
|---|---|
| `GUIDE.md` | This file: what I found in the data, decisions, expected numbers, plan |
| `AGENTS.md` | Put at your repo root. Zed's agent reads it automatically as project rules, including the full API contract |
| `PROMPTS.md` | 6 staged prompts to paste into Zed's agent panel, in order |

---

## 1. What's actually in the data

### mock-flight-hours.json
- Keys: `pilot` (`John Doe`, `totalFlightHours: 1444.5`), `limits` (8/40/100/1050), `chartBounds` (limit, max, windowDays per toggle, `displayRangeDays: 7`), `flightHours` (array of `{date, hours}`).
- 521 entries, 2024-12-27 to 2026-05-31, **no gaps, no duplicates, sorted**. 154 of them are explicit `0.0`.
- Max single day is 7.0h, so the 8h daily limit is never exceeded.
- **No avatar anywhere in the data.** You must supply an avatar URL yourself.

### The traps hiding in it
1. **The file runs 16 days past "today".** Today is 15 May but data continues to 31 May. These are future/planned hours. That's what the brief means by "future dates should still return a value". Recommended: use the planned hours from the file for future days, mark them `isFuture`, and treat anything beyond the file as 0.
2. **`totalFlightHours` (1444.5) equals the sum of ALL 521 days, including the 16 future ones.** Hours flown up to 15 May are actually 1385.4 (difference 59.1). Recommended: return 1444.5 from the file (that's what a reviewer will compare with) and state this in the README.
3. **The 1w line really does cross 40.** At today the 1w sum is 25.2, but it climbs to 44.7 on 20 May (future days). It's under the 45 chart max, so the line crosses the red limit without leaving the chart. Clamp anyway.
4. **Start of dataset**: with today fixed at 15 May 2026 the window start is always inside the data (the 1y window starts 16 May 2025), so this case won't show in the UI. Still handle it: missing days = 0, don't shrink the window. Write that in the README.
5. **documents.json says `today: 2026-05-31`; schedules.json says `2026-05-15`; the brief says 15 May.** Use 15 May for everything and make it an env var.
6. **Duty codes differ** between brief (DUTY, RL, TR, TX, UL) and data (DTY, RLV, TRD, TRX, ULV). Follow the data. Legend comes from the API.
7. **`base_color` is inconsistent in places** (e.g. the TRX day on 4 Jun uses the TRD orange). Use `base_color` from the API as the brief says; draw the legend from the API legend.
8. **`status` in schedules is not what drives the tick.** 15 May has `status: 1` but 6/6 logged, so it shows a tick. Use `count_logbooks === count_schedules`.
9. **Some past days have unfinished logbooks**: 13 Apr (4 schedules / 2 logged) and 22 Apr (2 / 1). They show "2" and "1".

### The odd rule in the brief
The brief says the rolling-sum method must be named `rollingWindowBluffing()` with the comment `// this is a rolling sum calculation :)` directly above it. The name looks odd, but it's an explicit requirement (stated twice in the PDF), so it's built into the rules file. Likely a check that you read the brief closely. Do exactly that and don't add a blank line between the comment and the method.

---

## 2. Decisions to make (recommended answers)

| Question | Recommendation |
|---|---|
| Is the window inclusive of the end date? | Yes. 1w at date D = D-6 … D. Matches the data's chart bounds ("last 7 days") |
| Missing / out-of-range days | Count as 0, never shrink or normalize the window |
| Future dates | Use planned hours in the file, `isFuture: true`, drawn lighter. Beyond the file = 0 |
| Where do the 4 cards get data? | Extra endpoint `GET /flight-hours/limits` (document it) so toggling the chart doesn't refetch cards |
| Chart library? | Hand-written SVG: zero dependencies, no SSR issues, total control over the clamp and red line |
| Token? | `@nestjs/jwt`, 12h expiry, `JWT_SECRET` env |
| Where does the frontend get "today"? | From the API (`/pilot/me`), never `new Date()` |
| Calendar week start | Monday |
| Card color thresholds | green < 75%, amber 75–99%, red ≥ 100% (document it) |
| Avatar | Configurable URL, default DiceBear initials |

---

## 3. Expected numbers: use these to check the build

With today = 2026-05-15:

**Limit cards** (`/flight-hours/limits`)

| Card | Hours | Limit | % |
|---|---|---|---|
| Daily | 6.4 | 8 | 80% (amber) |
| Weekly | 25.2 | 40 | 63% (green) |
| Monthly | 87.2 | 100 | 87% (amber) |
| Annual | 1013.8 | 1050 | 97% (amber) |

**Chart, 1w and 1m** (`/flight-hours/summary`, 15 points, today = index 7)

| Date | Hours | 1w sum | 1m sum |
|---|---|---|---|
| 05-08 | 5.2 | 15.0 | 102.2 |
| 05-09 | 0.0 | 15.0 | 96.4 |
| 05-10 | 1.6 | 16.6 | 92.5 |
| 05-11 | 0.0 | 12.6 | 86.9 |
| 05-12 | 4.6 | 16.3 | 85.3 |
| 05-13 | 5.9 | 22.2 | 84.8 |
| 05-14 | 6.7 | 24.0 | 87.0 |
| **05-15** | **6.4** | **25.2** | **87.2** |
| 05-16 | 6.2 | 31.4 | 87.6 |
| 05-17 | 6.6 | 36.4 | 88.0 |
| 05-18 | 6.4 | 42.8 | 89.3 |
| 05-19 | 5.8 | 44.0 | 92.6 |
| 05-20 | 6.6 | 44.7 | 96.2 |
| 05-21 | 4.7 | 42.7 | 100.9 |
| 05-22 | 0.0 | 36.3 | 98.7 |

At today: 3m = 247.6, 6m = 488.2, 1y = 1013.8.

**Documents** (against 15 May)

| Document | Expiry | Days | Status |
|---|---|---|---|
| Next Recurrent | 2026-10-14 | 152 | safe |
| PPC | 2026-12-25 | 224 | safe |
| Indonesian License | 2026-05-29 | 14 | soon (amber) |
| Indonesian Medical | 2026-06-11 | 27 | soon (amber) |
| Security Clearance | 2026-05-01 | -14 | expired (red) |

(If you wrongly used 31 May, license would be expired and medical 11 days. That's the check that your configurable "today" works.)

**Schedules**: April 17 entries, May 21, June 16 (54 total). 13 Apr shows "2", 22 Apr shows "1", 15 May shows a tick.

---

## 4. Working with Zed

1. Create the repo, e.g. `susiair-test/`, and open the **root folder** in Zed.
2. Save `AGENTS.md` at the root. Zed's agent picks it up as project rules. If your Zed version doesn't, rename it to `.rules`; keep only one of them.
3. Open the Agent panel, pick a Claude model, and use a profile that allows editing files and running terminal commands (usually "Write").
4. Run `PROMPTS.md` prompts 0 → 5 **one at a time**. After each: read the diff, run the verify step, `git commit -m "..."`.
5. In Zed's agent panel you can `@`-mention files (e.g. `@nest/src/flight-hours/flight-hours.service.ts`) to focus a follow-up.
6. Download the Susi Air logo from susiair.com yourself (the agent can't reliably fetch it) and put it in `nuxt/public/`.

Tip: smaller follow-up prompts beat giant ones. If the agent drifts, point it at `AGENTS.md` ("re-read AGENTS.md and fix your last change").

You will probably be asked to walk through your code afterward, so actually read what the agent writes, especially `rollingWindowBluffing`, the guard, and the exception filter. Write the README "decisions" section in your own words.

---

## 5. Suggested 5-day plan

| Day | Goal |
|---|---|
| 1 | Prompt 0 + 1: backend complete, tests pass, curl checks match section 3 |
| 2 | Deploy backend early (Render/Railway). Prompt 2: Nuxt foundation + login |
| 3 | Prompt 3: Home page |
| 4 | Prompt 4: Schedule page; deploy frontend, set `NUXT_PUBLIC_API_BASE` and `FRONTEND_ORIGIN` |
| 5 | Prompt 5: polish, README, test the live URLs on a phone, submit |

Deploying the backend early catches the classic problems while you still have time.

---

## 6. Deployment gotchas

- **JSON files not found after build**: read from `process.cwd()/data`, don't import from `src/` (it won't be in `dist/`).
- **CORS**: `FRONTEND_ORIGIN` must be the exact deployed frontend URL (https, no trailing slash).
- **Render/Railway free tiers sleep**: the first request after idle can take ~30–60 s. Open the backend URL right before submitting, and mention the cold start in the README. Your login page needs a visible loading state.
- **Mixed content**: frontend on https cannot call an http API. Use the https backend URL.
- **Env vars**: nest: `PORT`, `JWT_SECRET`, `APP_TODAY=2026-05-15`, `FRONTEND_ORIGIN`, `AVATAR_URL`. nuxt: `NUXT_PUBLIC_API_BASE`.

---

## 7. Final checklist before sending

- [ ] Login works with `johndoe` / `susiairtest`; wrong password shows a clear message
- [ ] Every endpoint except `/auth/login` returns 401 without a token (and `/health` if you add it)
- [ ] Exact error shape on 400/401/404/500
- [ ] `rollingWindowBluffing()` exists once, comment directly above it, character for character
- [ ] No `new Date()` representing today anywhere (search the repo)
- [ ] Cards read 6.4 / 25.2 / 87.2 / 1013.8
- [ ] Chart: 15 points, today centered, red limit line, Y max changes per toggle, 1w stays inside the chart when above 40
- [ ] Documents: amber, amber, red, green, green (badge comes from the API)
- [ ] Calendar: prev/next call the API, tick vs remaining number, legend from API, date tap → "Detail page coming soon"
- [ ] Logo, Plus Jakarta Sans, palette, pill buttons, line icons
- [ ] Bottom nav: Home, Schedule, Logbook, More (no dead links)
- [ ] README: setup, env vars, decisions + reasons, what you'd change
- [ ] Both live URLs tested on a phone; email sent to it.admin@susiair.com
