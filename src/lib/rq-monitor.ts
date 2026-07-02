/**
 * Pure logic for monitoring the health of Blizzard's `rq` query parameter.
 *
 * The failure mode is deceptive: when `rq` flips (competitive role queue has
 * switched between 1 and 2 in the past), the API keeps returning 200s with a
 * well-shaped payload, but query parameters like `map` stop affecting the
 * data. The observable symptom is stale data: `map=all-maps` and
 * `map=rialto` return byte-for-byte identical rates, which never happens
 * with real per-map statistics.
 *
 * These functions are shared by the Convex monitor cron and unit tests.
 * `role` is intentionally never checked: the API always returns heroes of
 * all roles regardless of the role parameter, so identical data there is
 * expected, not a failure.
 */

export type HeroRate = {
  id: string
  cells: {
    name: string
    pickrate: number
    winrate: number
  }
}

export type RatesPayload = {
  rates: Array<HeroRate>
}

/**
 * Structural check for the payload shape the app depends on: a `rates`
 * array whose entries carry numeric pickrate and winrate. This is the same
 * shape enforced by the Convex schema and shown in example-blizz-api-res.json.
 */
export function isValidRatesPayload(value: unknown): value is RatesPayload {
  if (typeof value !== 'object' || value === null) return false
  const rates = (value as { rates?: unknown }).rates
  // An empty rates array is unusual but renderable — reject only payloads
  // the UI cannot use at all. The monitor cron still catches empty/stale
  // responses via fingerprint comparison.
  if (!Array.isArray(rates)) return false
  return rates.every((entry) => {
    if (typeof entry !== 'object' || entry === null) return false
    const { id, cells } = entry as { id?: unknown; cells?: unknown }
    if (typeof id !== 'string') return false
    if (typeof cells !== 'object' || cells === null) return false
    const { pickrate, winrate } = cells as {
      pickrate?: unknown
      winrate?: unknown
    }
    return typeof pickrate === 'number' && typeof winrate === 'number'
  })
}

/**
 * Stable fingerprint of the statistical content of a payload, independent
 * of hero ordering. Two fingerprints are equal iff every hero has the same
 * pickrate and winrate in both payloads.
 */
export function ratesFingerprint(payload: RatesPayload): string {
  return payload.rates
    .map((entry) => `${entry.id}=${entry.cells.pickrate}/${entry.cells.winrate}`)
    .sort()
    .join('|')
}

/**
 * Short human-readable description of an arbitrary payload, for logs and
 * alerts when validation rejects it. Never includes payload contents
 * beyond structure.
 */
export function describePayload(value: unknown): string {
  if (typeof value !== 'object' || value === null) return `a ${typeof value}`
  const keys = Object.keys(value)
  const rates = (value as { rates?: unknown }).rates
  if (rates === undefined) {
    return `an object without a rates key (keys: ${keys.join(', ') || 'none'})`
  }
  if (!Array.isArray(rates)) return `an object whose rates is a ${typeof rates}`
  const firstInvalid = rates.findIndex(
    (entry) =>
      typeof entry !== 'object' ||
      entry === null ||
      typeof (entry as { id?: unknown }).id !== 'string' ||
      typeof (entry as { cells?: { pickrate?: unknown } }).cells?.pickrate !==
        'number' ||
      typeof (entry as { cells?: { winrate?: unknown } }).cells?.winrate !==
        'number',
  )
  if (firstInvalid === -1) return `a valid payload with ${rates.length} rates`
  return `a rates array of ${rates.length} entries where entry ${firstInvalid} is missing a string id or numeric cells.pickrate/cells.winrate`
}

export type ParameterVariation = {
  /** Which query parameter this variation exercises, e.g. "map" */
  parameter: string
  /** Human-readable description, e.g. "all-maps vs rialto" */
  label: string
  /** Parsed JSON body returned for the varied query, unknown until validated */
  payload: unknown
}

export type ParameterCheck = {
  parameter: string
  label: string
  /** "changed" = data differs from baseline (healthy), "stale" = identical, "invalid" = payload malformed */
  result: 'changed' | 'stale' | 'invalid'
}

export type RqHealthReport = {
  healthy: boolean
  /** Baseline payload failed shape validation (the crash-on-mount class of error) */
  baselineInvalid: boolean
  checks: Array<ParameterCheck>
}

/**
 * Compare a baseline query result against variations of individual query
 * parameters. A healthy `rq` means every varied parameter produces
 * different data than the baseline; any identical (stale) result means the
 * API is silently ignoring that parameter — the broken-rq signature.
 */
export function evaluateRqHealth(
  baseline: unknown,
  variations: Array<ParameterVariation>,
): RqHealthReport {
  if (!isValidRatesPayload(baseline)) {
    return {
      healthy: false,
      baselineInvalid: true,
      checks: variations.map(({ parameter, label }) => ({
        parameter,
        label,
        result: 'invalid',
      })),
    }
  }

  const baselineFingerprint = ratesFingerprint(baseline)
  const checks = variations.map(({ parameter, label, payload }): ParameterCheck => {
    if (!isValidRatesPayload(payload)) {
      return { parameter, label, result: 'invalid' }
    }
    const identical = ratesFingerprint(payload) === baselineFingerprint
    return { parameter, label, result: identical ? 'stale' : 'changed' }
  })

  return {
    healthy: checks.every((check) => check.result === 'changed'),
    baselineInvalid: false,
    checks,
  }
}

/** Render a report as a compact human-readable summary for alerts. */
export function formatRqHealthReport(report: RqHealthReport): string {
  if (report.baselineInvalid) {
    return 'Baseline query returned a malformed payload (no usable `rates` array) — the API response shape has changed or rq is invalid.'
  }
  const lines = report.checks.map((check) => {
    const icon =
      check.result === 'changed' ? '✅' : check.result === 'stale' ? '🟠' : '❌'
    const meaning =
      check.result === 'changed'
        ? 'data changes'
        : check.result === 'stale'
          ? 'STALE — identical data, parameter ignored'
          : 'INVALID — malformed payload'
    return `${icon} ${check.parameter} (${check.label}): ${meaning}`
  })
  return lines.join('\n')
}
