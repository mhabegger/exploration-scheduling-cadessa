import { describe, expect, it } from 'vitest'
import migrationJournal from '../../drizzle/meta/_journal.json'
import { expectedMigration } from './migration-version'

describe('expected database migration', () => {
  it('tracks the latest committed Drizzle journal entry', () => {
    const latest = migrationJournal.entries.at(-1)
    expect(latest).toBeDefined()
    expect(expectedMigration).toEqual({ tag: latest?.tag, version: latest?.when })
  })

  it('keeps migration versions strictly chronological', () => {
    const versions = migrationJournal.entries.map((entry) => entry.when)
    expect(versions.every((version, index) => index === 0 || version > versions[index - 1]!)).toBe(true)
  })
})
