import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { studioActionSchema } from '@/domain/studio/schema'

function studio(channelId: string) {
  return env.SCHEDULE_COORDINATOR.get(env.SCHEDULE_COORDINATOR.idFromName(channelId))
}

export const Route = createFileRoute('/api/studio/$channelId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const incoming = new URL(request.url)
        const target = new URL('https://cadessa.internal/studio')
        target.searchParams.set('channelId', params.channelId)
        for (const [key, value] of incoming.searchParams) target.searchParams.set(key, value)
        return studio(params.channelId).fetch(target)
      },
      POST: async ({ request, params }) => {
        const payload = await request.json().catch(() => null)
        const parsed = studioActionSchema.safeParse(payload)
        if (!parsed.success) return Response.json({ error: 'Invalid studio action', issues: parsed.error.issues }, { status: 400 })
        return studio(params.channelId).fetch(`https://cadessa.internal/studio?channelId=${encodeURIComponent(params.channelId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        })
      },
      DELETE: async ({ params }) => studio(params.channelId).fetch(`https://cadessa.internal/studio?channelId=${encodeURIComponent(params.channelId)}`, { method: 'DELETE' }),
    },
  },
})
