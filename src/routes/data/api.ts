import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/data/api')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const tier = url.searchParams.get('tier') || 'All'

        const startTime = performance.now()
        const res = await fetch(
          `https://overwatch.blizzard.com/en-us/rates/data/?input=PC&map=all-maps&region=Americas&role=All&rq=1&tier=${tier}`
        )
        const data = await res.json()
        const endTime = performance.now()

        console.log(`Blizzard API fetch completed in ${(endTime - startTime).toFixed(2)}ms`)

        return json(data)
      },
    },
  },
})