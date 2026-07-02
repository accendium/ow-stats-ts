import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Snapshots cache raw Blizzard responses. The upstream shape churns
// (2026-07 added banrate, subrole, and a new envelope) and Convex object
// validators reject unknown fields, so a strict validator here makes the
// weekly ingestion cron fail on every upstream addition. Payloads are
// normalized before storage (see fetchBlizzard.ts) and validated at read
// time with normalizeRatesPayload in src/lib/rq-monitor.ts.
const blizzardRatesPayloadValidator = v.any();

export default defineSchema({
  monitorStatus: defineTable({
    checkedAt: v.number(),
    healthy: v.boolean(),
    summary: v.string(),
  }),
  blizzardSnapshots: defineTable({
    tier: v.string(),
    map: v.string(),
    input: v.string(),
    region: v.string(),
    timestamp: v.number(),
    payload: blizzardRatesPayloadValidator,
  }).index("by_tier_map_input_region", ["tier", "map", "input", "region"]),
});