/**
 * Discord observability bot, built on Vercel's Chat SDK (`chat` +
 * `@chat-adapter/discord`). Server-side only — never import from client code.
 *
 * Two responsibilities:
 * 1. Proactive alerts: `postDiscordAlert` pushes error reports and rq
 *    monitor transitions into the alert channel.
 * 2. Interactions: the `/owstats` slash command (delivered over Discord's
 *    HTTP interactions endpoint, wired up in /api/webhooks/discord) replies
 *    with the latest rq monitor status from Convex.
 *
 * The bot is optional: when the DISCORD_* env vars are absent every entry
 * point degrades to a console.warn so local development works untouched.
 */
import { Chat } from 'chat'
import { createDiscordAdapter } from '@chat-adapter/discord'
import { createMemoryState } from '@chat-adapter/state-memory'
import { ConvexHttpClient } from 'convex/browser'
import { anyApi } from 'convex/server'

export function isDiscordConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_BOT_TOKEN &&
      process.env.DISCORD_PUBLIC_KEY &&
      process.env.DISCORD_APPLICATION_ID,
  )
}

type ObservabilityBot = Chat<{ discord: ReturnType<typeof createDiscordAdapter> }>

let bot: ObservabilityBot | null = null

async function fetchMonitorStatusText(): Promise<string> {
  const convexUrl = process.env.VITE_CONVEX_URL ?? import.meta.env.VITE_CONVEX_URL
  if (!convexUrl) {
    return 'Monitor status unavailable: VITE_CONVEX_URL is not configured.'
  }
  try {
    const client = new ConvexHttpClient(convexUrl)
    const status = (await client.query(anyApi.monitor.getStatus, {})) as {
      checkedAt: number
      healthy: boolean
      summary: string
    } | null
    if (!status) {
      return 'No rq monitor results yet — the Convex cron has not run.'
    }
    const heading = status.healthy
      ? '✅ rq looks healthy'
      : '🚨 rq looks BROKEN (stale or malformed data)'
    const checked = new Date(status.checkedAt).toISOString()
    return `${heading}\nLast checked: ${checked}\n\n${status.summary}`
  } catch (error) {
    return `Could not read monitor status from Convex: ${error instanceof Error ? error.message : String(error)}`
  }
}

export function getBot(): ObservabilityBot | null {
  if (!isDiscordConfigured()) return null
  if (bot) return bot

  bot = new Chat({
    userName: 'ow-stats',
    adapters: {
      discord: createDiscordAdapter(),
    },
    state: createMemoryState(),
  })

  bot.onSlashCommand('/owstats', async (event) => {
    const query = event.text.trim().toLowerCase()
    if (query === 'status' || query === '') {
      await event.channel.post(await fetchMonitorStatusText())
      return
    }
    await event.channel.post(
      'Usage: `/owstats status` — report the latest Blizzard rq monitor result.',
    )
  })

  return bot
}

// Suppress duplicate alerts for the same key within this window. Memory
// state is per-instance; in serverless deployments a cold start resets the
// window, which only means an occasional repeated alert, never a lost one.
const ALERT_DEDUPE_MS = 15 * 60 * 1000
const recentAlerts = new Map<string, number>()

/**
 * Post an alert to the Discord alert channel. `key` groups repeats: alerts
 * sharing a key within 15 minutes are dropped so a hot error loop cannot
 * flood the channel.
 */
export async function postDiscordAlert(key: string, text: string): Promise<void> {
  const now = Date.now()
  const lastSent = recentAlerts.get(key)
  if (lastSent !== undefined && now - lastSent < ALERT_DEDUPE_MS) return
  recentAlerts.set(key, now)
  for (const [existingKey, sentAt] of recentAlerts) {
    if (now - sentAt >= ALERT_DEDUPE_MS) recentAlerts.delete(existingKey)
  }

  const channelId = process.env.DISCORD_ALERT_CHANNEL_ID
  const activeBot = getBot()
  if (!activeBot || !channelId) {
    console.warn(
      `[observability] Discord not configured, alert not sent: ${key}\n${text}`,
    )
    return
  }

  try {
    await activeBot.channel(`discord:${channelId}`).post(text)
  } catch (error) {
    // Never let alerting break the request that triggered it.
    console.error('[observability] failed to post Discord alert', error)
  }
}
