# ow-stats-ts

`ow-stats-ts` is an Overwatch hero stats viewer built with TanStack Start, React, and Convex.

The app lets you filter hero data by `role`, `tier`, `map`, `region`, and `input`, then view the results as:

- a scatterplot of pick rate vs. win rate
- a sortable hero stats table

The UI fetches live data through this app's server route, while the repo also contains a separate Convex snapshot pipeline for caching Blizzard responses on a schedule.

## Stack

- React 19 + TypeScript
- TanStack Start + TanStack Router
- Vite
- Tailwind CSS v4
- Radix UI primitives
- Recharts
- TanStack Table
- Convex

## Development

Install dependencies and start the dev server:

```bash
npm install
npx convex dev
npm run dev
```

The Vite dev server runs on port `3000`.

Other useful scripts:

```bash
npm run build
npm run preview
npm run test
npm run lint
npm run format
npm run check
```

## Environment

The router initializes a Convex client, so local development expects:

```bash
CONVEX_DEPLOYMENT=...
VITE_CONVEX_URL=...
VITE_CONVEX_SITE_URL=...
```

The Convex cron pipeline also checks:

```bash
DISABLE_CRON=true
```

Set `DISABLE_CRON=true` when you want Convex functions available locally without running the scheduled Blizzard ingestion flow.

The Discord observability bot (optional — everything degrades to console logging without it) expects:

```bash
DISCORD_BOT_TOKEN=...        # Bot token from the Discord Developer Portal
DISCORD_PUBLIC_KEY=...       # Application public key (verifies interaction webhooks)
DISCORD_APPLICATION_ID=...   # Application ID
DISCORD_ALERT_CHANNEL_ID=... # Channel that receives error and monitor alerts
```

Set `DISCORD_BOT_TOKEN` and `DISCORD_ALERT_CHANNEL_ID` in the Convex deployment too, so the rq monitor cron can post alerts.

## Observability

The app reports errors and Blizzard API anomalies to a Discord channel through a bot built on [Vercel's Chat SDK](https://chat-sdk.dev) (`chat` + `@chat-adapter/discord`).

### Discord bot setup

1. Create an application at the [Discord Developer Portal](https://discord.com/developers/applications), create its bot, and collect the application ID, public key, and bot token.
2. Set the **Interactions Endpoint URL** to `https://<your-domain>/api/webhooks/discord`.
3. Invite the bot to your server with the `bot` and `applications.commands` scopes and Send Messages permission.
4. Register the slash commands once: `DISCORD_APPLICATION_ID=... DISCORD_BOT_TOKEN=... node scripts/register-discord-commands.mjs`
5. Fill in the environment variables listed above (app server and Convex deployment).

Use `/owstats status` in Discord to get the latest rq monitor result on demand.

### Global error reporting

- **Server**: `/api/data` validates the Blizzard payload shape (`src/lib/rq-monitor.ts`) and reports upstream failures or malformed payloads via `src/lib/observability.server.ts`.
- **Client**: `src/components/error-reporting.tsx` wires `window.onerror`, `unhandledrejection`, and the root route's `errorComponent` (React render crashes) to `/api/client-error`, which forwards to Discord.
- Alerts are deduplicated (15-minute window per error signature) so a crash loop cannot flood the channel.

### rq monitor

Blizzard's `rq` query parameter is fragile: it has flipped between `1` and `2` for competitive role queue. When it flips, the API keeps returning well-shaped 200 responses but silently ignores query parameters — the observable symptom is stale data, e.g. `map=rialto` returning data identical to `map=all-maps`. As of 2026-07, `rq=1` is the live competitive dataset (probed live via the `Probe Blizzard rates API shape` GitHub Actions workflow, which can be dispatched manually whenever the shape needs inspecting).

The response envelope also changed in 2026-07: the legacy payload (`{ rates: [...], extrema, selected }`) moved under a top-level `rates` key next to a new `columns` array, and hero cells gained `banrate`. `normalizeRatesPayload` in `src/lib/rq-monitor.ts` accepts both envelopes and is applied at every ingestion point (`/api/data`, the Convex monitor, and the snapshot pipeline), so the rest of the app only ever sees the flat shape.

An hourly Convex cron (`convex/monitor.ts`) probes one variation per query parameter against a baseline query (`all-maps` / `All` / `Americas` / `PC`):

| Parameter | Probe |
|-----------|-------|
| `map` | `all-maps` vs `rialto` |
| `tier` | `All` vs `Grandmaster` |
| `region` | `Americas` vs `Asia` |
| `input` | `PC` vs `Console` |

`role` is intentionally not probed: the API always returns heroes of every role regardless of the role parameter, so identical data there is expected.

If any probe returns data identical to the baseline (or a malformed payload), the check is unhealthy. On a health transition the bot posts an alert; when the current `rq` looks broken, the monitor also probes the alternative `rq` value and says whether switching would fix it. The latest result is stored in the `monitorStatus` table and served by the `monitor.getStatus` query (used by `/owstats status`).

## How Data Flows

There are two distinct data paths in this repo.

### 1. Live app requests

This is the path the visible UI uses today.

1. The browser renders `/` from `src/routes/index.tsx`.
2. A client-side `useEffect` watches the selected filters.
3. The browser requests `/api/data?...` from `src/routes/api/data.ts`.
4. That server route fetches data from Blizzard's public rates endpoint.
5. The server returns JSON to the browser.
6. The browser renders the scatterplot and table.

SSR vs client execution:

- `src/routes/index.tsx` runs in the browser for the live fetch because the request is triggered inside `useEffect`.
- `src/routes/api/data.ts` runs on the server.
- That means the browser does not call Blizzard directly from the page component; it calls this app's server route first.

### 2. Convex snapshot pipeline

The repo also includes a background snapshot path:

1. `convex/crons.ts` schedules a weekly job.
2. `convex/fetchBlizzard.ts` iterates tiers, maps, inputs, and regions.
3. Each request fetches Blizzard data and stores a snapshot.
4. `convex/blizzardSnapshots.ts` writes the payload into the `blizzardSnapshots` table defined in `convex/schema.ts`.

At the moment, the visible UI uses the live `/api/data` path rather than reading from Convex snapshots. This is a temporary feature to ensure that the database pipeline is functional before it is implemented.

## Project Layout

```text
src/
  components/
    hero-query-fields.tsx      Filter controls
    hero-rates-scatterplot.tsx Pick rate vs. win rate chart
    hero-table.tsx             Sortable hero stats table
  lib/
    overwatch-constants.ts     Roles, tiers, maps, regions, inputs
  routes/
    index.tsx                  Main page
    api/data.ts                Server route that proxies Blizzard data
  router.tsx                   Router, React Query, and Convex wiring

convex/
  schema.ts                    Convex schema
  blizzardSnapshots.ts         Snapshot write mutation
  fetchBlizzard.ts             Blizzard ingestion actions
  crons.ts                     Weekly schedule
```

## Roadmap Ideas

Ban rate data (`cells.banrate`) has been available in the competitive role queue payload since the 2026-07 API change and is not surfaced in the UI yet:

- **Ban rate vs. win rate matrix** — a second viability scatterplot with ban rate on the y-axis and win rate on the x-axis, revealing which strong heroes the community actually bans.
- **Pick rate vs. ban rate matrix** — a scatterplot pairing pick rate and ban rate to separate "banned because oppressive" heroes from "banned but rarely played" ones.
- **Ban rate column in Hero Stats** — a third rate bar in the table alongside pick rate and win rate, using red (`bg-destructive` or a red chart token) for the bar color.
- **Tabs on the graph components** — let each graph card switch between the plot matrix and a second visualization medium. Suggested medium: **historic trend lines** — the Convex snapshot pipeline already caches weekly payloads, so each tab could render a per-hero line chart of pick/win/ban rate over time and turn the stored history into something visible. (A simpler alternative: a ranked horizontal bar chart of the selected stat.)

## Notes For Contributors

- `src/routes/index.tsx` is the fastest place to start if you want to understand the user-facing app.
- `src/lib/overwatch-constants.ts` is the source of truth for query/filter options.
- `src/routeTree.gen.ts` is generated code.
- `example-blizz-api-res.json` shows the shape of Blizzard's response payload (legacy flat envelope).
- Vitest is configured; tests live next to their subject (e.g. `src/lib/rq-monitor.test.ts`).

