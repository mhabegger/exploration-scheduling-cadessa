export type ChannelKind = 'playlist' | 'linear' | 'show'
export type DestinationKind = 'spotify' | 'deezer' | 'broadcast' | 'demo'
export type Rotation = 'power' | 'current' | 'recurrent' | 'gold' | 'discovery'

export interface TrackSource {
  provider: DestinationKind | 'r2'
  externalId: string
  playable: boolean
}

export interface Track {
  id: string
  title: string
  artist: string
  artistKeys: string[]
  album: string
  durationMs: number
  bpm: number
  energy: number
  valence: number
  era: '2020s' | '2010s' | '2000s' | '90s'
  mood: string[]
  rotation: Rotation
  contentRating: 'clean' | 'explicit' | 'unknown'
  language: string
  rotationDebt: number
  cover: string
  chartRank?: number
  chartDated?: string
  chartSource?: string
  featureProvenance: 'estimated' | 'measured' | 'provider'
  assetStatus: 'metadata-only' | 'owned' | 'licensed'
  sources: TrackSource[]
}

export interface FormatProfile {
  id: string
  name: string
  statement: string
  energyCurve: number[]
  discoveryTarget: number
  artistSeparationMinutes: number
  titleSeparationMinutes: number
  explicitAllowed: boolean
  eraTargets: Record<Track['era'], number>
  rotationPattern: Rotation[]
}

export interface ScheduleRequest {
  mode: ChannelKind
  destination: DestinationKind
  catalog: Track[]
  profile: FormatProfile
  startAt: string
  targetCount: number
  targetDurationMs?: number
  seed: string
  beamWidth?: number
  expansionWidth?: number
  pinnedTrackIds?: Record<number, string>
  excludedTrackIds?: string[]
  artistHistory?: Record<string, string>
  trackHistory?: Record<string, string>
}

export interface ScoreComponent {
  key: 'energy' | 'rotation' | 'transition' | 'discovery' | 'diversity' | 'duration' | 'jitter'
  label: string
  value: number
}

export interface ScheduledItem {
  id: string
  position: number
  startsAt: string
  endsAt: string
  track: Track
  score: number
  components: ScoreComponent[]
  reasons: string[]
  held: boolean
}

export interface ScheduleHealth {
  hardBreaks: number
  warnings: number
  artistSeparationPass: number
  energyMatch: number
  diversity: number
  durationFit: number
}

export interface ScheduleResult {
  id: string
  engineVersion: string
  seed: string
  generatedAt: string
  items: ScheduledItem[]
  flowScore: number
  totalDurationMs: number
  targetDurationMs?: number
  timingDeltaMs?: number
  health: ScheduleHealth
  notices: string[]
}

export interface ScheduleAlternative {
  track: Track
  projectedFlowScore: number
  itemScore: number
  scoreDelta: number
  reasons: string[]
}
