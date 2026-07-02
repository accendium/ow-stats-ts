import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isValidRatesPayload } from '@/lib/rq-monitor'
import { reportError, toErrorReport } from '@/lib/observability.server'

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
            `https://overwatch.blizzard.com/en-us/rates/data/?input=${input}&map=${map}&region=${region}&role=All&rq=2&tier=${tier}`
          )
          const endTime = performance.now()

          console.log(`Fetched URL: '${url.href}' in ${(endTime - startTime).toFixed(2)}ms`)

          if (!res.ok) {
            throw new Error(`Blizzard API responded ${res.status} ${res.statusText}`)
          }

          const data = await res.json()
          if (!isValidRatesPayload(data)) {
            await reportError({
              source: 'api/data',
              message: `Blizzard API returned a malformed payload (no usable rates array) for tier=${tier} map=${map} region=${region} input=${input} — rq may have changed`,
            })
            return json({ error: 'Upstream returned unexpected data' }, { status: 502 })
          }
          return json(data)
        } catch (error) {
          await reportError({ ...toErrorReport('api/data', error), url: url.href })
          return json({ error: 'Failed to fetch hero data' }, { status: 502 })
        }
      },
    },
  },
})
