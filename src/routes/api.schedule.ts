import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { generateSchedule } from '@/domain/scheduling/engine'
import { DEFAULT_SCHEDULE_REQUEST } from '@/domain/scheduling/fixtures'

const requestSchema = z.object({
  mode: z.enum(['playlist', 'linear', 'show']).default('linear'),
  destination: z.enum(['spotify', 'deezer', 'broadcast', 'demo']).default('demo'),
  targetCount: z.number().int().min(1).max(40).default(12),
  seed: z.string().min(1).max(120).default('api-demo'),
  startAt: z.iso.datetime().default(DEFAULT_SCHEDULE_REQUEST.startAt),
})

export const Route = createFileRoute('/api/schedule')({
  server: {
    handlers: {
      GET: async () => Response.json(generateSchedule(DEFAULT_SCHEDULE_REQUEST), {
        headers: { 'Cache-Control': 'public, max-age=60' },
      }),
      POST: async ({ request }) => {
        const payload = await request.json().catch(() => null)
        const parsed = requestSchema.safeParse(payload)
        if (!parsed.success) return Response.json({ error: 'Invalid generation request', issues: parsed.error.issues }, { status: 400 })

        const result = generateSchedule({
          ...DEFAULT_SCHEDULE_REQUEST,
          ...parsed.data,
        })
        return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
      },
    },
  },
})
