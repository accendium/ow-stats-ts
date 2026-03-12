import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/data')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const tier = url.searchParams.get('tier') || 'All'
        const map = url.searchParams.get('map') || 'all-maps'
        const region = url.searchParams.get('region') || 'Americas'
        const input = url.searchParams.get('input') || 'PC'

        const startTime = performance.now()
        const res = await fetch(
          `https://overwatch.blizzard.com/en-us/rates/data/?input=${input}&map=${map}&region=${region}&role=All&rq=1&tier=${tier}`
        )
        const endTime = performance.now()

        console.log(`Fetched URL: '${url.href}' in ${(endTime - startTime).toFixed(2)}ms`)

        const data = await res.json()
        return json(data)
      },
    },
  },
})