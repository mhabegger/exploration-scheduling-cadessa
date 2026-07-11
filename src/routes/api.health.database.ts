import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { probeDatabase } from '@/db/client'
import { resolveDatabaseReadiness } from '@/db/readiness'

const noStore = { 'Cache-Control': 'no-store' }

function safeErrorDetails(error: unknown) {
  if (!(error instanceof Error)) return { name: 'UnknownDatabaseError' }
  const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined
  return { name: error.name, ...(code ? { code } : {}) }
}

export const Route = createFileRoute('/api/health/database')({
  server: {
    handlers: {
      GET: async () => {
        const hyperdrive = env.HYPERDRIVE
        if (!hyperdrive) {
          return Response.json({ status: 'unconfigured', transport: 'hyperdrive', schemaReady: false }, { status: 503, headers: noStore })
        }

        const readiness = await resolveDatabaseReadiness(
          () => probeDatabase(hyperdrive),
          (error) => console.error('Hyperdrive readiness probe failed', safeErrorDetails(error)),
        )
        return Response.json(readiness, { status: readiness.status === 'ready' ? 200 : 503, headers: noStore })
      },
    },
  },
})
