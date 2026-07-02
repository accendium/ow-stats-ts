import { createFileRoute } from '@tanstack/react-router'
import { getBot } from '@/lib/bot.server'

export const Route = createFileRoute('/api/webhooks/discord')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const bot = getBot()
        if (!bot) {
          return new Response('Discord bot is not configured', { status: 503 })
        }
        return bot.webhooks.discord(request)
      },
    },
  },
})
