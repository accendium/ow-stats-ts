import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

export const createSnapshot = internalMutation({
  args: {
    tier: v.string(),
    map: v.string(),
    input: v.string(),
    region: v.string(),
    timestamp: v.number(),
    payload: v.any(),
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
