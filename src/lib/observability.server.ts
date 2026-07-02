/**
 * Server-side error reporting into the Discord alert channel. Errors are
 * summarized into a stable dedupe key so a crash loop produces one alert
 * per window instead of one per request.
 */
import { postDiscordAlert } from '@/lib/bot.server'

export type ErrorReport = {
  /** Where the error surfaced, e.g. "api/data" or "client:render" */
  source: string
  message: string
  stack?: string
  url?: string
}

const MAX_FIELD_LENGTH = 1200

function truncate(value: string): string {
  return value.length > MAX_FIELD_LENGTH
    ? `${value.slice(0, MAX_FIELD_LENGTH)}…`
    : value
}

export async function reportError(report: ErrorReport): Promise<void> {
  const key = `error:${report.source}:${report.message}`
  const lines = [
    `🚨 **Error observed** in \`${report.source}\``,
    truncate(report.message),
  ]
  if (report.url) lines.push(`URL: ${truncate(report.url)}`)
  if (report.stack) lines.push('```\n' + truncate(report.stack) + '\n```')
  await postDiscordAlert(key, lines.join('\n'))
}

export function toErrorReport(source: string, error: unknown): ErrorReport {
  if (error instanceof Error) {
    return { source, message: error.message, stack: error.stack }
  }
  return { source, message: String(error) }
}
