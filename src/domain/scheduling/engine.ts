import type {
  ScheduleAlternative,
  ScheduleRequest,
  ScheduleResult,
  ScheduledItem,
  ScoreComponent,
  Track,
} from './types'

export const ENGINE_VERSION = 'conductor-0.2.1'

interface BeamState {
  tracks: Track[]
  totalScore: number
  totalDurationMs: number
  artistLastEndMs: Map<string, number>
  trackLastEndMs: Map<string, number>
  eraCounts: Map<Track['era'], number>
  discoveryCount: number
}

function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededUnit(value: string) {
  let state = hashString(value) || 1
  state ^= state << 13
  state ^= state >>> 17
  state ^= state << 5
  return (state >>> 0) / 4294967295
}

function normalizedTempoDistance(a: number, b: number) {
  return Math.min(Math.abs(a - b), Math.abs(a * 2 - b), Math.abs(a - b * 2))
}

function targetEnergy(request: ScheduleRequest, position: number) {
  const curve = request.profile.energyCurve
  if (request.targetCount <= 1) return curve[0] ?? 0.6
  const curvePosition = (position / (request.targetCount - 1)) * (curve.length - 1)
  const lower = Math.floor(curvePosition)
  const upper = Math.min(Math.ceil(curvePosition), curve.length - 1)
  const blend = curvePosition - lower
  return (curve[lower] ?? 0.6) * (1 - blend) + (curve[upper] ?? 0.6) * blend
}

function historyOffset(iso: string, startsAt: number) {
  const value = new Date(iso).getTime() - startsAt
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY
}

function initialState(request: ScheduleRequest): BeamState {
  const startsAt = new Date(request.startAt).getTime()
  return {
    tracks: [],
    totalScore: 0,
    totalDurationMs: 0,
    artistLastEndMs: new Map(Object.entries(request.artistHistory ?? {}).map(([artist, end]) => [artist, historyOffset(end, startsAt)])),
    trackLastEndMs: new Map(Object.entries(request.trackHistory ?? {}).map(([trackId, end]) => [trackId, historyOffset(end, startsAt)])),
    eraCounts: new Map(),
    discoveryCount: 0,
  }
}

function eligible(track: Track, state: BeamState, request: ScheduleRequest) {
  if (request.excludedTrackIds?.includes(track.id)) return false
  if (!request.profile.explicitAllowed && track.contentRating === 'explicit') return false
  if (!track.sources.some((source) => source.provider === request.destination && source.playable)) return false

  const lastTrackEnd = state.trackLastEndMs.get(track.id)
  if (lastTrackEnd !== undefined && state.totalDurationMs - lastTrackEnd < request.profile.titleSeparationMinutes * 60_000) return false

  return track.artistKeys.every((artist) => {
    const lastArtistEnd = state.artistLastEndMs.get(artist)
    return lastArtistEnd === undefined || state.totalDurationMs - lastArtistEnd >= request.profile.artistSeparationMinutes * 60_000
  })
}

function rotationFit(track: Track, request: ScheduleRequest, position: number) {
  const target = request.profile.rotationPattern[position % request.profile.rotationPattern.length] ?? 'current'
  if (track.rotation === target) return 18
  if ((target === 'power' && track.rotation === 'current') || (target === 'current' && track.rotation === 'power')) return 11
  if ((target === 'recurrent' && track.rotation === 'gold') || (target === 'gold' && track.rotation === 'recurrent')) return 9
  return 3
}

function scoreCandidate(track: Track, state: BeamState, request: ScheduleRequest, position: number) {
  const target = targetEnergy(request, position)
  const energy = 29 * (1 - Math.min(Math.abs(track.energy - target), 1))
  const rotation = rotationFit(track, request, position) + Math.min(4, track.rotationDebt * 0.25)
  const previous = state.tracks.at(-1)
  const transition = previous
    ? 13 * (1 - Math.min(normalizedTempoDistance(previous.bpm, track.bpm) / 55, 1))
    : 10

  const expectedDiscovery = (position + 1) * request.profile.discoveryTarget
  const discovery = track.rotation === 'discovery'
    ? state.discoveryCount < expectedDiscovery ? 10 : 4
    : state.discoveryCount >= expectedDiscovery ? 8 : 5

  const existingEraShare = (state.eraCounts.get(track.era) ?? 0) / Math.max(1, position)
  const diversity = existingEraShare < request.profile.eraTargets[track.era] ? 10 : 5
  const remainingSlots = Math.max(1, request.targetCount - position)
  const idealDuration = request.targetDurationMs
    ? Math.max(120_000, (request.targetDurationMs - state.totalDurationMs) / remainingSlots)
    : track.durationMs
  const duration = 9 * (1 - Math.min(Math.abs(track.durationMs - idealDuration) / 90_000, 1))
  const jitter = seededUnit(`${request.seed}:${position}:${track.id}`) * 1.25
  const intendedRotation = request.profile.rotationPattern[position % request.profile.rotationPattern.length] ?? 'current'

  const components: ScoreComponent[] = [
    { key: 'energy', label: `Energy ${Math.round(track.energy * 100)}% follows the arc`, value: energy },
    { key: 'rotation', label: `${track.rotation} fits the ${intendedRotation} slot`, value: rotation },
    { key: 'transition', label: previous ? `${Math.round(normalizedTempoDistance(previous.bpm, track.bpm))} BPM effective move` : 'Strong opener', value: transition },
    { key: 'discovery', label: track.rotation === 'discovery' ? 'Adds discovery' : 'Balances familiarity', value: discovery },
    { key: 'diversity', label: `Protects the ${track.era} target`, value: diversity },
    { key: 'duration', label: 'Keeps the music window on time', value: duration },
    { key: 'jitter', label: 'Seeded freshness', value: jitter },
  ]

  return { total: components.reduce((sum, component) => sum + component.value, 0), components }
}

function cloneAndAppend(state: BeamState, track: Track, score: number): BeamState {
  const endMs = state.totalDurationMs + track.durationMs
  const artistLastEndMs = new Map(state.artistLastEndMs)
  for (const artist of track.artistKeys) artistLastEndMs.set(artist, endMs)
  const trackLastEndMs = new Map(state.trackLastEndMs)
  trackLastEndMs.set(track.id, endMs)
  const eraCounts = new Map(state.eraCounts)
  eraCounts.set(track.era, (eraCounts.get(track.era) ?? 0) + 1)
  return {
    tracks: [...state.tracks, track],
    totalScore: state.totalScore + score,
    totalDurationMs: endMs,
    artistLastEndMs,
    trackLastEndMs,
    eraCounts,
    discoveryCount: state.discoveryCount + (track.rotation === 'discovery' ? 1 : 0),
  }
}

function reasonLines(components: ScoreComponent[]) {
  return [...components]
    .filter((component) => component.key !== 'jitter')
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((component) => `${component.label} +${Math.round(component.value)}`)
}

function auditSchedule(request: ScheduleRequest, items: ScheduledItem[]) {
  const artistLastEnd = new Map(Object.entries(request.artistHistory ?? {}).map(([key, value]) => [key, new Date(value).getTime()]))
  const trackLastEnd = new Map(Object.entries(request.trackHistory ?? {}).map(([key, value]) => [key, new Date(value).getTime()]))
  let hardBreaks = 0
  let artistChecks = 0
  let artistPasses = 0

  for (const item of items) {
    const startsAt = new Date(item.startsAt).getTime()
    const endsAt = new Date(item.endsAt).getTime()
    if (request.excludedTrackIds?.includes(item.track.id)) hardBreaks += 1
    if (!request.profile.explicitAllowed && item.track.contentRating === 'explicit') hardBreaks += 1
    if (!item.track.sources.some((source) => source.provider === request.destination && source.playable)) hardBreaks += 1

    const previousTrackEnd = trackLastEnd.get(item.track.id)
    if (previousTrackEnd !== undefined && startsAt - previousTrackEnd < request.profile.titleSeparationMinutes * 60_000) hardBreaks += 1
    trackLastEnd.set(item.track.id, endsAt)

    for (const artist of item.track.artistKeys) {
      const previousArtistEnd = artistLastEnd.get(artist)
      if (previousArtistEnd !== undefined) {
        artistChecks += 1
        if (startsAt - previousArtistEnd >= request.profile.artistSeparationMinutes * 60_000) artistPasses += 1
        else hardBreaks += 1
      }
      artistLastEnd.set(artist, endsAt)
    }
  }

  return {
    hardBreaks,
    artistSeparationPass: artistChecks === 0 ? 100 : Math.round(artistPasses / artistChecks * 100),
  }
}

function finalObjective(state: BeamState, request: ScheduleRequest) {
  if (!request.targetDurationMs) return state.totalScore
  return state.totalScore - Math.abs(request.targetDurationMs - state.totalDurationMs) / 12_000
}

export function generateSchedule(request: ScheduleRequest): ScheduleResult {
  const beamWidth = request.beamWidth ?? 28
  const expansionWidth = request.expansionWidth ?? 10
  let beams: BeamState[] = [initialState(request)]

  for (let position = 0; position < request.targetCount; position += 1) {
    const expanded: BeamState[] = []
    const pinnedTrackId = request.pinnedTrackIds?.[position]
    for (const beam of beams) {
      const candidates = request.catalog
        .filter((track) => !pinnedTrackId || track.id === pinnedTrackId)
        .filter((track) => eligible(track, beam, request))
        .map((track) => ({ track, score: scoreCandidate(track, beam, request, position) }))
        .sort((a, b) => b.score.total - a.score.total)
        .slice(0, pinnedTrackId ? 1 : expansionWidth)

      for (const candidate of candidates) expanded.push(cloneAndAppend(beam, candidate.track, candidate.score.total))
    }

    if (expanded.length === 0) break
    beams = expanded.sort((a, b) => b.totalScore - a.totalScore).slice(0, beamWidth)
  }

  const winner = [...beams].sort((a, b) => finalObjective(b, request) - finalObjective(a, request))[0] ?? initialState(request)
  let cursor = new Date(request.startAt).getTime()
  let reconstruction = initialState(request)
  const items: ScheduledItem[] = winner.tracks.map((track, position) => {
    const scored = scoreCandidate(track, reconstruction, request, position)
    const startsAt = new Date(cursor).toISOString()
    cursor += track.durationMs
    reconstruction = cloneAndAppend(reconstruction, track, scored.total)
    return {
      id: hashString(`${request.seed}:${position}:${track.id}`).toString(36),
      position,
      startsAt,
      endsAt: new Date(cursor).toISOString(),
      track,
      score: Math.round(scored.total),
      components: scored.components,
      reasons: reasonLines(scored.components),
      held: request.pinnedTrackIds?.[position] === track.id,
    }
  })

  const energyMatch = items.length === 0 ? 0 : Math.round(100 - items.reduce((sum, item, position) => sum + Math.abs(item.track.energy - targetEnergy(request, position)), 0) / items.length * 100)
  const uniqueArtists = new Set(items.flatMap((item) => item.track.artistKeys)).size
  const diversity = items.length === 0 ? 0 : Math.min(100, Math.round(uniqueArtists / items.length * 100))
  const partial = items.length < request.targetCount
  const averageScore = items.length === 0 ? 0 : winner.totalScore / items.length
  const timingDeltaMs = request.targetDurationMs === undefined ? undefined : winner.totalDurationMs - request.targetDurationMs
  const durationFit = request.targetDurationMs === undefined ? 100 : Math.max(0, Math.round(100 - Math.abs(timingDeltaMs ?? 0) / request.targetDurationMs * 100))
  const flowScore = Math.max(0, Math.min(99, Math.round(averageScore * 1.05)))
  const timingWarning = timingDeltaMs !== undefined && Math.abs(timingDeltaMs) > 90_000
  const audit = auditSchedule(request, items)

  return {
    id: `run_${hashString(`${request.seed}:${request.startAt}:${request.targetCount}`).toString(36)}`,
    engineVersion: ENGINE_VERSION,
    seed: request.seed,
    generatedAt: request.startAt,
    items,
    flowScore,
    totalDurationMs: winner.totalDurationMs,
    targetDurationMs: request.targetDurationMs,
    timingDeltaMs,
    health: {
      hardBreaks: audit.hardBreaks,
      warnings: Number(partial) + Number(timingWarning) + Number(audit.hardBreaks > 0),
      artistSeparationPass: audit.artistSeparationPass,
      energyMatch,
      diversity,
      durationFit,
    },
    notices: [
      ...(partial ? ['A safe partial schedule was returned; no invariant was relaxed.'] : []),
      ...(timingWarning ? [`Music window is ${Math.round(Math.abs(timingDeltaMs ?? 0) / 1000)} seconds ${Number(timingDeltaMs) > 0 ? 'over' : 'under'} target.`] : []),
      ...(audit.hardBreaks > 0 ? [`Post-generation audit found ${audit.hardBreaks} hard-rule break${audit.hardBreaks === 1 ? '' : 's'}.`] : []),
    ],
  }
}

export function findScheduleAlternatives(request: ScheduleRequest, schedule: ScheduleResult, position: number, limit = 5): ScheduleAlternative[] {
  const current = schedule.items[position]
  if (!current) return []
  const basePins = Object.fromEntries(schedule.items.map((item) => [item.position, item.track.id]))

  return request.catalog
    .filter((track) => track.id !== current.track.id)
    .map((track) => {
      const candidate = generateSchedule({
        ...request,
        seed: `${request.seed}:alternative:${position}:${track.id}`,
        pinnedTrackIds: { ...basePins, [position]: track.id },
      })
      const item = candidate.items[position]
      return item && candidate.items.length === schedule.items.length ? {
        track,
        projectedFlowScore: candidate.flowScore,
        itemScore: item.score,
        scoreDelta: item.score - current.score,
        reasons: item.reasons,
      } : null
    })
    .filter((alternative): alternative is ScheduleAlternative => alternative !== null)
    .sort((a, b) => b.itemScore - a.itemScore)
    .slice(0, limit)
}

export function replaceScheduleTrack(request: ScheduleRequest, schedule: ScheduleResult, position: number, trackId: string) {
  const pinnedTrackIds = Object.fromEntries(schedule.items.map((item) => [item.position, item.track.id]))
  pinnedTrackIds[position] = trackId
  const replacement = generateSchedule({ ...request, seed: `${request.seed}:replace:${position}:${trackId}`, pinnedTrackIds })
  if (replacement.items.length !== schedule.items.length) throw new Error('That replacement would break an invariant or separation rule.')
  return replacement
}
