import type { DatabaseProbe } from './client'

type MigrationDetails = Omit<DatabaseProbe, 'schemaReady'>

export type DatabaseReadiness =
  | ({ status: 'ready'; transport: 'hyperdrive'; schemaReady: true } & MigrationDetails)
  | ({ status: 'migration_required'; transport: 'hyperdrive'; schemaReady: false } & MigrationDetails)
  | { status: 'unavailable'; transport: 'hyperdrive'; schemaReady: false }

export async function resolveDatabaseReadiness(
  probe: () => Promise<DatabaseProbe>,
  onError: (error: unknown) => void = () => undefined,
): Promise<DatabaseReadiness> {
  try {
    const result = await probe()
    const details = {
      expectedMigration: result.expectedMigration,
      appliedMigrationVersion: result.appliedMigrationVersion,
      latencyMs: result.latencyMs,
    }
    return result.schemaReady
      ? { status: 'ready', transport: 'hyperdrive', schemaReady: true, ...details }
      : { status: 'migration_required', transport: 'hyperdrive', schemaReady: false, ...details }
  } catch (error) {
    onError(error)
    return { status: 'unavailable', transport: 'hyperdrive', schemaReady: false }
  }
}
