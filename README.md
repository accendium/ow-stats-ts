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

## Notes For Contributors

- `src/routes/index.tsx` is the fastest place to start if you want to understand the user-facing app.
- `src/lib/overwatch-constants.ts` is the source of truth for query/filter options.
- `src/routeTree.gen.ts` is generated code.
- `example-blizz-api-res.json` shows the shape of Blizzard's response payload.
- Vitest is configured, but there are currently no test files in the repo.

