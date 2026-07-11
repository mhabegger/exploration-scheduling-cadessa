import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { z } from 'zod'

const enqueueSchema = z.object({
  runId: z.string().min(1).max(120).optional(),
  horizonHours: z.number().int().min(1).max(336).default(168),
  horizonStart: z.iso.datetime().optional(),
  seed: z.string().min(1).max(120).optional(),
})

function coordinator(channelId: string) {
  return env.SCHEDULE_COORDINATOR.get(env.SCHEDULE_COORDINATOR.idFromName(channelId))
}

export const Route = createFileRoute('/api/generation/$channelId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const incoming = new URL(request.url)
        const target = new URL('https://cadessa.internal/status')
        if (incoming.searchParams.get('include') === 'schedules') target.searchParams.set('include', 'schedules')
        return coordinator(params.channelId).fetch(target)
      },
      POST: async ({ request, params }) => {
        const payload = await request.json().catch(() => ({}))
        const parsed = enqueueSchema.safeParse(payload)
        if (!parsed.success) return Response.json({ error: 'Invalid generation request', issues: parsed.error.issues }, { status: 400 })

        return coordinator(params.channelId).fetch('https://cadessa.internal/enqueue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: params.channelId,
            runId: parsed.data.runId ?? crypto.randomUUID(),
            horizonHours: parsed.data.horizonHours,
            horizonStart: parsed.data.horizonStart,
            seed: parsed.data.seed,
          }),
        })
      },
      DELETE: async ({ params }) => coordinator(params.channelId).fetch('https://cadessa.internal/cancel', { method: 'DELETE' }),
    },
  },
})
