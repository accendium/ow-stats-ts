import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.weekly(
  "Query Blizzard API for Hero Data and Cache All",
  { dayOfWeek: "monday", hourUTC: 0, minuteUTC: 0 },
  internal.fetchBlizzard.queryAll
)

crons.hourly(
  "Monitor Blizzard rq parameter health",
  { minuteUTC: 30 },
  internal.monitor.checkRq
)

export default crons;