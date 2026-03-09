import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
});

const extremaBucketValidator = v.object({
  maxwr: v.number(),
  minwr: v.number(),
  maxpr: v.number(),
  minpr: v.number(),
});

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
});

export default defineSchema({
  blizzardSnapshots: defineTable({
    tier: v.string(),
    map: v.string(),
    input: v.string(),
    region: v.string(),
    timestamp: v.number(),
    payload: blizzardRatesPayloadValidator,
  }).index("by_tier_map_input_region", ["tier", "map", "input", "region"]),
});