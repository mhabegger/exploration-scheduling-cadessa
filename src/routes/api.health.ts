import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { ENGINE_VERSION } from '@/domain/scheduling/engine'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => Response.json({
        status: 'ok',
        service: 'cadessa',
        environment: env.APP_ENV,
        engine: ENGINE_VERSION,
        timestamp: new Date().toISOString(),
      }, { headers: { 'Cache-Control': 'no-store' } }),
    },
  },
})
