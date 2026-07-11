import { describe, expect, it } from 'vitest'
import { DEFAULT_SCHEDULE_REQUEST, HOT_AC_TRACKS } from './fixtures'
import { generateSchedule } from './engine'

describe('Conductor scheduling engine', () => {
  it('is byte-stable for the same frozen request and seed', () => {
    const first = generateSchedule(DEFAULT_SCHEDULE_REQUEST)
    const second = generateSchedule(DEFAULT_SCHEDULE_REQUEST)
    expect(second).toEqual(first)
  })

  it('never emits a track flagged explicit when the profile forbids it', () => {
    const explicitTrack = HOT_AC_TRACKS[0]
    expect(explicitTrack).toBeDefined()
    const result = generateSchedule({
      ...DEFAULT_SCHEDULE_REQUEST,
      catalog: explicitTrack ? [{ ...explicitTrack, contentRating: 'explicit' }] : [],
      targetCount: 1,
    })
    expect(result.items).toHaveLength(0)
    expect(result.health.hardBreaks).toBe(0)
  })

  it('requires a playable source for the target destination', () => {
    const blocked = HOT_AC_TRACKS[0]
    const catalog = HOT_AC_TRACKS.slice(0, 12).map((track) => track.id === blocked?.id ? { ...track, sources: track.sources.map((source) => source.provider === 'demo' ? { ...source, playable: false } : source) } : track)
    const result = generateSchedule({ ...DEFAULT_SCHEDULE_REQUEST, catalog, targetCount: 6 })
    expect(result.items.some((item) => item.track.id === blocked?.id)).toBe(false)
  })

  it('returns a safe partial result when the catalog is impossible', () => {
    const tinyCatalog = HOT_AC_TRACKS.slice(0, 2).map((track) => ({ ...track, artist: 'One Artist', artistKeys: ['one-artist'] }))
    const result = generateSchedule({ ...DEFAULT_SCHEDULE_REQUEST, catalog: tinyCatalog, targetCount: 8 })
    expect(result.items.length).toBeLessThan(8)
    expect(result.health.hardBreaks).toBe(0)
    expect(result.notices[0]).toContain('safe partial')
  })

  it('preserves a pinned track through a reflow', () => {
    const initial = generateSchedule(DEFAULT_SCHEDULE_REQUEST)
    const held = initial.items[3]
    expect(held).toBeDefined()
    const result = generateSchedule({ ...DEFAULT_SCHEDULE_REQUEST, seed: 'fresh-seed', pinnedTrackIds: held ? { 3: held.track.id } : {} })
    expect(result.items[3]?.track.id).toBe(held?.track.id)
    expect(result.items[3]?.held).toBe(true)
  })

  it('uses elapsed time and prior history for artist separation', () => {
    const track = HOT_AC_TRACKS[0]
    expect(track).toBeDefined()
    const start = new Date(DEFAULT_SCHEDULE_REQUEST.startAt).getTime()
    const result = generateSchedule({
      ...DEFAULT_SCHEDULE_REQUEST,
      targetCount: 1,
      pinnedTrackIds: track ? { 0: track.id } : {},
      artistHistory: track ? { [track.artistKeys[0] ?? 'artist']: new Date(start - 30 * 60_000).toISOString() } : {},
    })
    expect(result.items).toHaveLength(0)
  })

  it('reports its actual music-window timing instead of claiming an exact hour', () => {
    const result = generateSchedule(DEFAULT_SCHEDULE_REQUEST)
    expect(result.targetDurationMs).toBe(44 * 60 * 1000)
    expect(result.timingDeltaMs).toBe(result.totalDurationMs - (result.targetDurationMs ?? 0))
    expect(result.health.durationFit).toBeGreaterThan(90)
  })
})
