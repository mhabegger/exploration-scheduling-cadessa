import type { DatabaseProbe } from './client'

export type DatabaseReadiness =
  | { status: 'ready'; transport: 'hyperdrive'; schemaReady: true; latencyMs: number }
  | { status: 'migration_required'; transport: 'hyperdrive'; schemaReady: false; latencyMs: number }
  | { status: 'unavailable'; transport: 'hyperdrive'; schemaReady: false }

export async function resolveDatabaseReadiness(
  probe: () => Promise<DatabaseProbe>,
  onError: (error: unknown) => void = () => undefined,
): Promise<DatabaseReadiness> {
  try {
    const result = await probe()
    return result.schemaReady
      ? { status: 'ready', transport: 'hyperdrive', schemaReady: true, latencyMs: result.latencyMs }
      : { status: 'migration_required', transport: 'hyperdrive', schemaReady: false, latencyMs: result.latencyMs }
  } catch (error) {
    onError(error)
    return { status: 'unavailable', transport: 'hyperdrive', schemaReady: false }
  }
}
