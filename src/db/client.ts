import '@tanstack/react-start/server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { sql } from 'drizzle-orm'
import { Client } from 'pg'
import * as schema from './schema'
import { expectedMigration } from './migration-version'

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
  expectedMigration: typeof expectedMigration
  appliedMigrationVersion: number | null
  latencyMs: number
}

export async function probeDatabase(hyperdrive: HyperdriveConnection): Promise<DatabaseProbe> {
  const startedAt = performance.now()
  const migrationState = await withDatabase(hyperdrive, async (database) => {
    const relations = await database.execute(sql<{ applicationSchemaPresent: boolean; migrationLedgerPresent: boolean }>`
      select
        to_regclass('public.workspaces') is not null as "applicationSchemaPresent",
        to_regclass('drizzle.__drizzle_migrations') is not null as "migrationLedgerPresent"
    `)
    const relationState = relations.rows[0]

    if (relationState?.migrationLedgerPresent !== true) {
      return { applicationSchemaPresent: relationState?.applicationSchemaPresent === true, expectedMigrationApplied: false, appliedMigrationVersion: null }
    }

    const ledger = await database.execute(sql<{ expectedMigrationApplied: boolean | null; appliedMigrationVersion: string | null }>`
      select
        bool_or(created_at = ${expectedMigration.version}) as "expectedMigrationApplied",
        max(created_at)::text as "appliedMigrationVersion"
      from drizzle.__drizzle_migrations
    `)
    const appliedValue = ledger.rows[0]?.appliedMigrationVersion
    const appliedMigrationVersion = appliedValue === null || appliedValue === undefined ? null : Number(appliedValue)

    return {
      applicationSchemaPresent: relationState?.applicationSchemaPresent === true,
      expectedMigrationApplied: ledger.rows[0]?.expectedMigrationApplied === true,
      appliedMigrationVersion: Number.isSafeInteger(appliedMigrationVersion) ? appliedMigrationVersion : null,
    }
  })

  return {
    schemaReady: migrationState.applicationSchemaPresent && migrationState.expectedMigrationApplied,
    expectedMigration,
    appliedMigrationVersion: migrationState.appliedMigrationVersion,
    latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
  }
}
