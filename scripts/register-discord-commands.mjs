/**
 * One-time registration of the bot's slash commands with Discord.
 * Run after creating the Discord application:
 *
 *   DISCORD_APPLICATION_ID=... DISCORD_BOT_TOKEN=... node scripts/register-discord-commands.mjs
 */
const applicationId = process.env.DISCORD_APPLICATION_ID
const botToken = process.env.DISCORD_BOT_TOKEN

if (!applicationId || !botToken) {
  console.error('Set DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN before running.')
  process.exit(1)
}

const commands = [
  {
    name: 'owstats',
    description: 'Overwatch stats observability',
    type: 1,
    options: [
      {
        type: 3, // string
        name: 'query',
        description: "What to report — currently 'status' (default)",
        required: false,
      },
    ],
  },
]

const res = await fetch(
  `https://discord.com/api/v10/applications/${applicationId}/commands`,
  {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  },
)

if (!res.ok) {
  console.error(`Registration failed: ${res.status} ${res.statusText}`)
  console.error(await res.text())
  process.exit(1)
}

console.log('Registered commands:', (await res.json()).map((c) => c.name).join(', '))
