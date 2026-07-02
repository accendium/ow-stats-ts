import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { describePayload, isValidRatesPayload } from '@/lib/rq-monitor'
import { reportError, toErrorReport } from '@/lib/observability.server'

// Overridable so tests can point the route at a mock upstream.
const BLIZZARD_ORIGIN =
  process.env.BLIZZARD_API_ORIGIN || 'https://overwatch.blizzard.com'

export const Route = createFileRoute('/api/data')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const tier = url.searchParams.get('tier') || 'All'
        const map = url.searchParams.get('map') || 'all-maps'
        const region = url.searchParams.get('region') || 'Americas'
        const input = url.searchParams.get('input') || 'PC'

        try {
          const startTime = performance.now()
          const res = await fetch(
            `${BLIZZARD_ORIGIN}/en-us/rates/data/?input=${input}&map=${map}&region=${region}&role=All&rq=2&tier=${tier}`
          )
          const endTime = performance.now()

          console.log(`Fetched URL: '${url.href}' in ${(endTime - startTime).toFixed(2)}ms`)

          if (!res.ok) {
            throw new Error(`Blizzard API responded ${res.status} ${res.statusText}`)
          }

          const data = await res.json()
          if (!isValidRatesPayload(data)) {
            const description = describePayload(data)
            const message = `Blizzard API returned a malformed payload for tier=${tier} map=${map} region=${region} input=${input}: ${description} — rq may have changed`
            console.error(`[api/data] ${message}`)
            await reportError({ source: 'api/data', message })
            return json(
              { error: `Upstream returned unexpected data: ${description}` },
              { status: 502 },
            )
          }
          return json(data)
        } catch (error) {
          console.error('[api/data] request failed', error)
          await reportError({ ...toErrorReport('api/data', error), url: url.href })
          const message =
            error instanceof Error ? error.message : 'Failed to fetch hero data'
          return json({ error: message }, { status: 502 })
        }
      },
    },
  },
})
