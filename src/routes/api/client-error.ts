import { createFileRoute } from '@tanstack/react-router'
import { reportError } from '@/lib/observability.server'

const MAX_BODY_BYTES = 16_384

export const Route = createFileRoute('/api/client-error')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text()
        if (raw.length > MAX_BODY_BYTES) {
          return new Response('Payload too large', { status: 413 })
        }
        let body: unknown
        try {
          body = JSON.parse(raw)
        } catch {
          return new Response('Invalid JSON', { status: 400 })
        }
        if (typeof body !== 'object' || body === null) {
          return new Response('Invalid report', { status: 400 })
        }
        const { source, message, stack, url } = body as Record<string, unknown>
        if (typeof message !== 'string' || message.length === 0) {
          return new Response('Invalid report', { status: 400 })
        }
        await reportError({
          source: typeof source === 'string' ? `client:${source}` : 'client',
          message,
          stack: typeof stack === 'string' ? stack : undefined,
          url: typeof url === 'string' ? url : undefined,
        })
        return new Response(null, { status: 204 })
      },
    },
  },
})
