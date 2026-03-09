import { internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { TIERS, MAPS, INPUTS, REGIONS, QUICKPLAY_MAPS } from '@/lib/overwatch-constants'
import { v } from "convex/values"

export const queryAll = internalAction({
  handler: async (ctx) => {
    if (process.env.DISABLE_CRON === "true") {
      console.log("Cron disabled, skipping internal.fetchBlizzard.queryAll")
      return
    }
    for (let index = 0; index < TIERS.length; index++) {
      const tier = TIERS[index]
      await ctx.scheduler.runAfter(index * 60000, internal.fetchBlizzard.queryForTier, { tier: tier })
    }
    await ctx.scheduler.runAfter(TIERS.length * 60000, internal.fetchBlizzard.queryQuickplay)
  },
})

export const queryForTier = internalAction({
  args: {
    tier: v.string(),
  },
  handler: async (ctx, { tier }) => {
    if (process.env.DISABLE_CRON === "true") {
      console.log("Cron disabled, skipping internal.fetchBlizzard.queryForTier")
      return
    }
    let errors = 0;
    for (const map of MAPS) {
      for (const input of INPUTS) {
        for (const region of REGIONS) {
          const res = await fetch(
            `https://overwatch.blizzard.com/en-us/rates/data/?input=${input}&map=${map}&region=${region}&role=All&rq=2&tier=${tier}`,
          )

          if (res.ok) {
            const data = await res.json()
            await ctx.runMutation(internal.blizzardSnapshots.createSnapshot, {
              map: map,
              tier: tier,
              input: input,
              region: region,
              timestamp: Date.now(),
              payload: data,
            })
          } else {
            console.error(`Failed to fetch from Blizzard API: '${map}' for tier ${tier} in ${region} with input ${input}`, res.statusText)
            errors++
          }
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }
    }
    let total = MAPS.length * INPUTS.length * REGIONS.length;
    console.log(`Completed ${total - errors}/${total} requests for tier ${tier} (${errors} errors)`)
  },
})

export const queryQuickplay = internalAction({
  handler: async (ctx) => {
    if (process.env.DISABLE_CRON === "true") {
      console.log("Cron disabled, skipping internal.fetchBlizzard.queryQuickplay")
      return
    }
    let errors = 0;
    for (const map of QUICKPLAY_MAPS) {
      for (const input of INPUTS) {
        for (const region of REGIONS) {
          const res = await fetch(
            `https://overwatch.blizzard.com/en-us/rates/data/?input=${input}&map=${map}&region=${region}&role=All&rq=0&tier=All`
          )
          if (res.ok) {
            const data = await res.json()
            await ctx.runMutation(internal.blizzardSnapshots.createSnapshot, {
              map: map,
              tier: 'Quickplay',
              input: input,
              region: region,
              timestamp: Date.now(),
              payload: data,
            })
          } else {
            console.error(`Failed to fetch from Blizzard API: '${map}' for Quickplay in ${region} with input ${input}`, res.statusText)
            errors++
          }
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }
    }
    let total = QUICKPLAY_MAPS.length * INPUTS.length * REGIONS.length;
    console.log(`Completed ${total - errors}/${total} requests for Quickplay (${errors} errors)`)
  },
})