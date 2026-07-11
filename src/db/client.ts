import '@tanstack/react-start/server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { sql } from 'drizzle-orm'
import { Client } from 'pg'
import * as schema from './schema'

function createDatabase(client: Client) {
  return drizzle(client, { schema })
}

export type Database = ReturnType<typeof createDatabase>

interface HyperdriveConnection {
  connectionString: string
}

export async function withDatabase<T>(hyperdrive: HyperdriveConnection, operation: (database: Database) => Promise<T>) {
  // Hyperdrive owns the origin pool. A fresh edge client per Worker invocation
  // avoids cross-request I/O reuse and is inexpensive at the edge.
  const client = new Client({
    connectionString: hyperdrive.connectionString,
    connectionTimeoutMillis: 5_000,
    query_timeout: 5_000,
    statement_timeout: 5_000,
  })
  await client.connect()
  return operation(createDatabase(client))
}

export interface DatabaseProbe {
  schemaReady: boolean
  latencyMs: number
}

export async function probeDatabase(hyperdrive: HyperdriveConnection): Promise<DatabaseProbe> {
  const startedAt = performance.now()
  const schemaReady = await withDatabase(hyperdrive, async (database) => {
    const result = await database.execute(sql<{ schemaReady: boolean }>`
      select
        current_timestamp as checked_at,
        to_regclass('public.workspaces') is not null as "schemaReady"
    `)
    return result.rows[0]?.schemaReady === true
  })

  return {
    schemaReady,
    latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
  }
}
