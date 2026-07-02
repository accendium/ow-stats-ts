import { v } from 'convex/values'
import { internalAction, internalMutation, internalQuery, query } from './_generated/server'
import { internal } from './_generated/api'
import type { ParameterVariation, RqHealthReport } from '@/lib/rq-monitor'
import { evaluateRqHealth, formatRqHealthReport } from '@/lib/rq-monitor'

/**
 * Monitors the health of Blizzard's `rq` query parameter.
 *
 * When `rq` silently flips (it has moved between 1 and 2 for competitive
 * role queue), the API keeps answering 200 with plausible-looking data but
 * stops honoring query parameters — the tell is stale data: `map=rialto`
 * returns exactly the same rates as `map=all-maps`. This cron probes one
 * variation per parameter against a baseline and flags any parameter whose
 * data does not change. `role` is deliberately not probed: the API always
 * returns heroes of every role regardless of it, so identical data there
 * is normal.
 */

// As of the 2026-07 API change, rq=1 is the live competitive role queue
// dataset; rq=2 serves stale data that ignores query parameters. These
// swap when Blizzard flips rq again — the alert says which value works.
const RQ_IN_USE = '1'
const RQ_ALTERNATIVE = '2'

const BASELINE = {
  input: 'PC',
  map: 'all-maps',
  region: 'Americas',
  tier: 'All',
} as const

// One probe per query parameter that should affect the data.
const PROBES = [
  { parameter: 'map', override: { map: 'rialto' }, label: 'all-maps vs rialto' },
  { parameter: 'tier', override: { tier: 'Grandmaster' }, label: 'All vs Grandmaster' },
  { parameter: 'region', override: { region: 'Asia' }, label: 'Americas vs Asia' },
  { parameter: 'input', override: { input: 'Console' }, label: 'PC vs Console' },
] as const

async function fetchRates(
  params: { input: string; map: string; region: string; tier: string },
  rq: string,
): Promise<unknown> {
  const origin = process.env.BLIZZARD_API_ORIGIN || 'https://overwatch.blizzard.com'
  try {
    const res = await fetch(
      `${origin}/en-us/rates/data/?input=${params.input}&map=${params.map}&region=${params.region}&role=All&rq=${rq}&tier=${params.tier}`,
    )
    if (!res.ok) return { httpError: `${res.status} ${res.statusText}` }
    return await res.json()
  } catch (error) {
    return { fetchError: error instanceof Error ? error.message : String(error) }
  }
}

async function runProbes(rq: string): Promise<RqHealthReport> {
  const baseline = await fetchRates(BASELINE, rq)
  const variations: Array<ParameterVariation> = []
  for (const probe of PROBES) {
    const payload = await fetchRates({ ...BASELINE, ...probe.override }, rq)
    variations.push({ parameter: probe.parameter, label: probe.label, payload })
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return evaluateRqHealth(baseline, variations)
}

async function postDiscordAlert(text: string): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN
  const channelId = process.env.DISCORD_ALERT_CHANNEL_ID
  if (!token || !channelId) {
    console.warn('[monitor] Discord not configured, alert not sent:\n' + text)
    return
  }
  const res = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: text }),
    },
  )
  if (!res.ok) {
    console.error(`[monitor] Discord alert failed: ${res.status} ${res.statusText}`)
  }
}

export const checkRq = internalAction({
  handler: async (ctx) => {
    if (process.env.DISABLE_CRON === 'true') {
      console.log('Cron disabled, skipping internal.monitor.checkRq')
      return
    }

    const report = await runProbes(RQ_IN_USE)
    let summary = formatRqHealthReport(report)

    // When the current rq looks broken, probe the alternative value so the
    // alert says what to switch to instead of just that something is wrong.
    if (!report.healthy) {
      const alternativeReport = await runProbes(RQ_ALTERNATIVE)
      summary += alternativeReport.healthy
        ? `\n\n➡️ rq=${RQ_ALTERNATIVE} responds correctly to all parameters — the app should switch from rq=${RQ_IN_USE} to rq=${RQ_ALTERNATIVE}.`
        : `\n\nrq=${RQ_ALTERNATIVE} does not look healthy either — likely an API outage or format change rather than an rq flip.`
    }

    const previous = await ctx.runQuery(internal.monitor.getLatestInternal, {})
    await ctx.runMutation(internal.monitor.saveStatus, {
      checkedAt: Date.now(),
      healthy: report.healthy,
      summary,
    })

    const wasHealthy = previous?.healthy ?? true
    if (report.healthy !== wasHealthy) {
      const heading = report.healthy
        ? '✅ **rq recovered** — all query parameters affect the data again.'
        : `🚨 **rq=${RQ_IN_USE} looks broken** — the Blizzard API is returning stale or malformed data.`
      await postDiscordAlert(`${heading}\n${summary}`)
    }
    console.log(`[monitor] rq check complete, healthy=${report.healthy}`)
  },
})

export const saveStatus = internalMutation({
  args: {
    checkedAt: v.number(),
    healthy: v.boolean(),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('monitorStatus', args)
  },
})

export const getLatestInternal = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query('monitorStatus').order('desc').first()
  },
})

export const getStatus = query({
  handler: async (ctx) => {
    const latest = await ctx.db.query('monitorStatus').order('desc').first()
    if (!latest) return null
    return {
      checkedAt: latest.checkedAt,
      healthy: latest.healthy,
      summary: latest.summary,
    }
  },
})
