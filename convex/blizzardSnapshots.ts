import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

// Kept in sync with convex/schema.ts: raw upstream cache, so the payload
// is intentionally not strictly validated (upstream shape churns; see the
// schema comment). Read-time validation lives in src/lib/rq-monitor.ts.
const blizzardRatesPayloadValidator = v.any()

export const createSnapshot = internalMutation({
  args: {
    tier: v.string(),
    map: v.string(),
    input: v.string(),
    region: v.string(),
    timestamp: v.number(),
    payload: blizzardRatesPayloadValidator,
  },
  handler: async (ctx, args) => {
    const newSnapshot = await ctx.db.insert('blizzardSnapshots', {
      tier: args.tier,
      map: args.map,
      input: args.input,
      region: args.region,
      timestamp: args.timestamp,
      payload: args.payload,
    })
    return newSnapshot
  },
})
