import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import * as schema from './schema'

function createDatabase(client: Client) {
  return drizzle(client, { schema })
}

export type Database = ReturnType<typeof createDatabase>

export async function withDatabase<T>(connectionString: string, operation: (database: Database) => Promise<T>) {
  const client = new Client({ connectionString })
  await client.connect()
  try {
    return await operation(createDatabase(client))
  } finally {
    await client.end()
  }
}
