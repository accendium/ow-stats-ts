import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

const heroRateValidator = v.object({
  id: v.string(),
  cells: v.object({
    name: v.string(),
    pickrate: v.number(),
    winrate: v.number(),
  }),
  hero: v.object({
    color: v.string(),
    name: v.string(),
    portrait: v.string(),
    role: v.string(),
    roleIcon: v.string(),
  }),
})

const extremaBucketValidator = v.object({
  maxwr: v.number(),
  minwr: v.number(),
  maxpr: v.number(),
  minpr: v.number(),
})

const blizzardRatesPayloadValidator = v.object({
  rates: v.array(heroRateValidator),
  extrema: v.object({
    all: extremaBucketValidator,
    tank: extremaBucketValidator,
    damage: extremaBucketValidator,
    support: extremaBucketValidator,
  }),
  selected: v.object({
    input: v.string(),
    map: v.string(),
    region: v.string(),
    role: v.string(),
    rq: v.string(),
    tier: v.string(),
  }),
})

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
