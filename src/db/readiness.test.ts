import { describe, expect, it, vi } from 'vitest'
import { resolveDatabaseReadiness } from './readiness'

describe('database readiness', () => {
  it('reports a ready migrated database', async () => {
    await expect(resolveDatabaseReadiness(async () => ({ schemaReady: true, latencyMs: 18 }))).resolves.toEqual({
      status: 'ready',
      transport: 'hyperdrive',
      schemaReady: true,
      latencyMs: 18,
    })
  })

  it('distinguishes a reachable database that still needs migrations', async () => {
    await expect(resolveDatabaseReadiness(async () => ({ schemaReady: false, latencyMs: 11 }))).resolves.toEqual({
      status: 'migration_required',
      transport: 'hyperdrive',
      schemaReady: false,
      latencyMs: 11,
    })
  })

  it('redacts connection errors from the public result', async () => {
    const onError = vi.fn()
    const error = new Error('postgresql://user:secret@private.example/cadessa')
    const result = await resolveDatabaseReadiness(async () => { throw error }, onError)
    expect(onError).toHaveBeenCalledWith(error)
    expect(JSON.stringify(result)).not.toContain('secret')
    expect(result).toEqual({ status: 'unavailable', transport: 'hyperdrive', schemaReady: false })
  })
})
