import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  blizzardSnapshots: defineTable({
    tier: v.string(),
    map: v.string(),
    input: v.string(),
    region: v.string(),
    timestamp: v.number(),
    payload: v.any(),
  }).index("by_tier_map_input_region", ["tier", "map", "input", "region"]),
});