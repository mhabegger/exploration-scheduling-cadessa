import '@tanstack/react-start/server-only'
import migrationJournal from '../../drizzle/meta/_journal.json'

const latestMigration = migrationJournal.entries.at(-1)

if (!latestMigration) {
  throw new Error('The Drizzle migration journal is empty. Generate and commit a migration before building Cadessa.')
}

if (migrationJournal.entries.some((entry, index, entries) => index > 0 && entry.when <= entries[index - 1]!.when)) {
  throw new Error('The Drizzle migration journal must be strictly chronological.')
}

export const expectedMigration = Object.freeze({
  tag: latestMigration.tag,
  version: latestMigration.when,
})
