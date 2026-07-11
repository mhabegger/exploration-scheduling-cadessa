import { describe, expect, it, vi } from 'vitest'
import { resolveDatabaseReadiness } from './readiness'

describe('database readiness', () => {
  const expectedMigration = { tag: '0001_test', version: 1_800_000_000_000 }

  it('reports a ready migrated database', async () => {
    await expect(resolveDatabaseReadiness(async () => ({
      schemaReady: true,
      expectedMigration,
      appliedMigrationVersion: expectedMigration.version,
      latencyMs: 18,
    }))).resolves.toEqual({
      status: 'ready',
      transport: 'hyperdrive',
      schemaReady: true,
      expectedMigration,
      appliedMigrationVersion: expectedMigration.version,
      latencyMs: 18,
    })
  })

  it('distinguishes a reachable database that still needs migrations', async () => {
    await expect(resolveDatabaseReadiness(async () => ({
      schemaReady: false,
      expectedMigration,
      appliedMigrationVersion: null,
      latencyMs: 11,
    }))).resolves.toEqual({
      status: 'migration_required',
      transport: 'hyperdrive',
      schemaReady: false,
      expectedMigration,
      appliedMigrationVersion: null,
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
