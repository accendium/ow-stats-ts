import { describe, expect, it } from 'vitest'
import fixture from '../../example-blizz-api-res.json'
import {
  describePayload,
  evaluateRqHealth,
  formatRqHealthReport,
  isValidRatesPayload,
  normalizeRatesPayload,
  ratesFingerprint,
} from './rq-monitor'
import type { RatesPayload } from './rq-monitor'

const baseline = fixture as RatesPayload

function cloneWithShiftedRates(payload: RatesPayload): RatesPayload {
  return {
    ...payload,
    rates: payload.rates.map((entry) => ({
      ...entry,
      cells: {
        ...entry.cells,
        pickrate: entry.cells.pickrate + 1.4,
        winrate: entry.cells.winrate - 0.6,
      },
    })),
  }
}

describe('isValidRatesPayload', () => {
  it('accepts the checked-in rq=2 sample response', () => {
    expect(isValidRatesPayload(baseline)).toBe(true)
  })

  it('rejects payloads without a rates array (the crash-on-mount shape)', () => {
    expect(isValidRatesPayload({ selected: { rq: '1' } })).toBe(false)
    expect(isValidRatesPayload(null)).toBe(false)
    expect(isValidRatesPayload('<!doctype html>')).toBe(false)
  })

  it('accepts an empty rates array — unusual but renderable', () => {
    expect(isValidRatesPayload({ rates: [] })).toBe(true)
  })

  it('rejects rates entries missing numeric pickrate/winrate', () => {
    const missingWinrate = {
      rates: [{ id: 'ana', cells: { name: 'Ana', pickrate: 22.3 } }],
    }
    expect(isValidRatesPayload(missingWinrate)).toBe(false)
  })
})

// The envelope shipped by the API since 2026-07: the legacy payload moved
// under a top-level `rates` key, next to a new `columns` array, and cells
// gained `banrate`.
function wrapInCurrentEnvelope(payload: RatesPayload) {
  return {
    rates: {
      ...payload,
      rates: payload.rates.map((entry) => ({
        ...entry,
        cells: { ...entry.cells, banrate: 0 },
      })),
    },
    columns: [
      { id: 'name', text: 'Name', sortable: true, sortDirection: 'asc' },
      { id: 'winrate', text: 'Win rate', sortable: true, sortDirection: 'desc' },
    ],
  }
}

describe('normalizeRatesPayload', () => {
  it('passes the legacy flat payload through unchanged', () => {
    expect(normalizeRatesPayload(baseline)).toBe(baseline)
  })

  it('unwraps the 2026-07 envelope (rates nested under rates)', () => {
    const normalized = normalizeRatesPayload(wrapInCurrentEnvelope(baseline))
    expect(normalized).not.toBeNull()
    expect(Array.isArray(normalized!.rates)).toBe(true)
    expect(normalized!.rates[0].id).toBe(baseline.rates[0].id)
    expect(normalized!.rates[0].cells.banrate).toBe(0)
  })

  it('returns null for unusable payloads', () => {
    expect(normalizeRatesPayload({ selected: { rq: '1' } })).toBeNull()
    expect(normalizeRatesPayload({ rates: { columns: [] } })).toBeNull()
    expect(normalizeRatesPayload(null)).toBeNull()
  })
})

describe('ratesFingerprint', () => {
  it('is order-independent', () => {
    const reversed = { ...baseline, rates: [...baseline.rates].reverse() }
    expect(ratesFingerprint(reversed)).toBe(ratesFingerprint(baseline))
  })

  it('changes when any rate changes', () => {
    expect(ratesFingerprint(cloneWithShiftedRates(baseline))).not.toBe(
      ratesFingerprint(baseline),
    )
  })
})

describe('evaluateRqHealth', () => {
  it('reports healthy when every parameter variation changes the data', () => {
    const report = evaluateRqHealth(baseline, [
      {
        parameter: 'map',
        label: 'all-maps vs rialto',
        payload: cloneWithShiftedRates(baseline),
      },
      {
        parameter: 'tier',
        label: 'All vs Grandmaster',
        payload: cloneWithShiftedRates(cloneWithShiftedRates(baseline)),
      },
    ])
    expect(report.healthy).toBe(true)
    expect(report.baselineInvalid).toBe(false)
    expect(report.checks.every((check) => check.result === 'changed')).toBe(true)
  })

  it('evaluates health across enveloped payloads (current API shape)', () => {
    const report = evaluateRqHealth(wrapInCurrentEnvelope(baseline), [
      {
        parameter: 'map',
        label: 'all-maps vs rialto',
        payload: wrapInCurrentEnvelope(cloneWithShiftedRates(baseline)),
      },
      {
        parameter: 'tier',
        label: 'All vs Grandmaster',
        payload: wrapInCurrentEnvelope(baseline),
      },
    ])
    expect(report.baselineInvalid).toBe(false)
    expect(report.checks.map((check) => check.result)).toEqual([
      'changed',
      'stale',
    ])
  })

  it('flags a broken rq when rialto returns data identical to all-maps', () => {
    const report = evaluateRqHealth(baseline, [
      {
        parameter: 'map',
        label: 'all-maps vs rialto',
        payload: structuredClone(baseline),
      },
    ])
    expect(report.healthy).toBe(false)
    expect(report.checks[0].result).toBe('stale')
  })

  it('flags mixed results per parameter', () => {
    const report = evaluateRqHealth(baseline, [
      {
        parameter: 'map',
        label: 'all-maps vs rialto',
        payload: structuredClone(baseline),
      },
      {
        parameter: 'region',
        label: 'Americas vs Asia',
        payload: cloneWithShiftedRates(baseline),
      },
      {
        parameter: 'input',
        label: 'PC vs Console',
        payload: { unexpected: true },
      },
    ])
    expect(report.healthy).toBe(false)
    expect(report.checks.map((check) => check.result)).toEqual([
      'stale',
      'changed',
      'invalid',
    ])
  })

  it('flags an invalid baseline and does not compare against it', () => {
    const report = evaluateRqHealth(
      { selected: { rq: '1' } },
      [
        {
          parameter: 'map',
          label: 'all-maps vs rialto',
          payload: structuredClone(baseline),
        },
      ],
    )
    expect(report.healthy).toBe(false)
    expect(report.baselineInvalid).toBe(true)
    expect(report.checks[0].result).toBe('invalid')
  })
})

describe('describePayload', () => {
  it('names the missing rates key and lists what was there instead', () => {
    const description = describePayload({ selected: { rq: '1' } })
    expect(description).toContain('without a rates key')
    expect(description).toContain('selected')
  })

  it('points at the first invalid entry', () => {
    const description = describePayload({
      rates: [baseline.rates[0], { id: 'broken', cells: { pickrate: 1 } }],
    })
    expect(description).toContain('entry 1')
  })
})

describe('formatRqHealthReport', () => {
  it('summarizes stale parameters in the alert text', () => {
    const report = evaluateRqHealth(baseline, [
      {
        parameter: 'map',
        label: 'all-maps vs rialto',
        payload: structuredClone(baseline),
      },
    ])
    const text = formatRqHealthReport(report)
    expect(text).toContain('map')
    expect(text).toContain('STALE')
  })
})
