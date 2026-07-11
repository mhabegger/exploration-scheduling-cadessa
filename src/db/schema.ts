import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const channelKind = pgEnum('channel_kind', ['playlist', 'linear', 'show'])
export const providerKind = pgEnum('provider_kind', ['spotify', 'deezer', 'broadcast', 'r2', 'demo'])
export const connectionStatus = pgEnum('connection_status', ['pending', 'connected', 'degraded', 'disabled'])
export const runStatus = pgEnum('run_status', ['pending', 'running', 'validating', 'ready', 'publishing', 'published', 'failed', 'cancelled'])
export const rotationKind = pgEnum('rotation_kind', ['power', 'current', 'recurrent', 'gold', 'discovery'])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  defaultTimezone: text('default_timezone').default('UTC').notNull(),
  ...timestamps,
}, (table) => [uniqueIndex('workspaces_slug_uq').on(table.slug)])

export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('members_email_uq').on(table.email)])

export const workspaceMembers = pgTable('workspace_members', {
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').default('programmer').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.workspaceId, table.memberId] })])

export const channels = pgTable('channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  kind: channelKind('kind').notNull(),
  timezone: text('timezone').notNull(),
  territory: text('territory').default('CH').notNull(),
  locale: text('locale').default('en').notNull(),
  autopilotEnabled: boolean('autopilot_enabled').default(true).notNull(),
  settings: jsonb('settings').$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('channels_workspace_slug_uq').on(table.workspaceId, table.slug),
  index('channels_workspace_idx').on(table.workspaceId),
])

export const providerConnections = pgTable('provider_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  provider: providerKind('provider').notNull(),
  status: connectionStatus('status').default('pending').notNull(),
  externalAccountId: text('external_account_id'),
  displayName: text('display_name').notNull(),
  encryptedCredentials: text('encrypted_credentials'),
  capabilities: jsonb('capabilities').$type<Record<string, boolean>>().default({}).notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex('provider_connections_external_uq').on(table.workspaceId, table.provider, table.externalAccountId),
])

export const artists = pgTable('artists', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  canonicalName: text('canonical_name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  aliases: jsonb('aliases').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('artists_workspace_name_idx').on(table.workspaceId, table.normalizedName)])

export const tracks = pgTable('tracks', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  primaryArtistId: uuid('primary_artist_id').references(() => artists.id).notNull(),
  recordingGroupId: uuid('recording_group_id').notNull(),
  title: text('title').notNull(),
  album: text('album'),
  durationMs: integer('duration_ms').notNull(),
  bpm: real('bpm'),
  energy: real('energy'),
  valence: real('valence'),
  loudness: real('loudness'),
  musicalKey: text('musical_key'),
  era: text('era'),
  language: text('language'),
  explicit: boolean('explicit').default(false).notNull(),
  rotation: rotationKind('rotation'),
  moods: jsonb('moods').$type<string[]>().default([]).notNull(),
  featureVersion: text('feature_version'),
  featureConfidence: real('feature_confidence'),
  metadataProvenance: jsonb('metadata_provenance').$type<Record<string, string>>().default({}).notNull(),
  ...timestamps,
}, (table) => [
  index('tracks_workspace_rotation_idx').on(table.workspaceId, table.rotation),
  index('tracks_artist_idx').on(table.primaryArtistId),
  index('tracks_recording_group_idx').on(table.recordingGroupId),
])

export const trackSources = pgTable('track_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  trackId: uuid('track_id').references(() => tracks.id, { onDelete: 'cascade' }).notNull(),
  provider: providerKind('provider').notNull(),
  externalId: text('external_id').notNull(),
  playable: boolean('playable').default(true).notNull(),
  territory: text('territory'),
  availableFrom: timestamp('available_from', { withTimezone: true }),
  availableUntil: timestamp('available_until', { withTimezone: true }),
  providerMetadata: jsonb('provider_metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('track_sources_provider_external_uq').on(table.provider, table.externalId)])

export const audioAssets = pgTable('audio_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  trackId: uuid('track_id').references(() => tracks.id, { onDelete: 'cascade' }).notNull(),
  r2Key: text('r2_key').notNull(),
  sha256: text('sha256').notNull(),
  mimeType: text('mime_type').notNull(),
  byteSize: integer('byte_size').notNull(),
  cueInMs: integer('cue_in_ms').default(0).notNull(),
  cueOutMs: integer('cue_out_ms'),
  introEndMs: integer('intro_end_ms'),
  outroStartMs: integer('outro_start_ms'),
  rightsExpiresAt: timestamp('rights_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('audio_assets_r2_key_uq').on(table.r2Key)])

export const formatProfileVersions = pgTable('format_profile_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }).notNull(),
  version: integer('version').notNull(),
  statement: text('statement').notNull(),
  profile: jsonb('profile').$type<Record<string, unknown>>().notNull(),
  policies: jsonb('policies').$type<unknown[]>().notNull(),
  confidence: real('confidence').notNull(),
  provenance: jsonb('provenance').$type<Record<string, unknown>>().default({}).notNull(),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('format_profile_channel_version_uq').on(table.channelId, table.version)])

export const clockVersions = pgTable('clock_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  version: integer('version').notNull(),
  daypart: text('daypart').notNull(),
  startMinute: integer('start_minute').notNull(),
  endMinute: integer('end_minute').notNull(),
  active: boolean('active').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('clock_channel_name_version_uq').on(table.channelId, table.name, table.version)])

export const clockSlots = pgTable('clock_slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  clockVersionId: uuid('clock_version_id').references(() => clockVersions.id, { onDelete: 'cascade' }).notNull(),
  ordinal: integer('ordinal').notNull(),
  offsetMs: integer('offset_ms'),
  kind: text('kind').notNull(),
  intent: jsonb('intent').$type<Record<string, unknown>>().default({}).notNull(),
  fixedDurationMs: integer('fixed_duration_ms'),
  fixedAssetId: uuid('fixed_asset_id').references(() => audioAssets.id),
}, (table) => [uniqueIndex('clock_slots_clock_ordinal_uq').on(table.clockVersionId, table.ordinal)])

export const generationRuns = pgTable('generation_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }).notNull(),
  profileVersionId: uuid('profile_version_id').references(() => formatProfileVersions.id).notNull(),
  clockVersionId: uuid('clock_version_id').references(() => clockVersions.id),
  status: runStatus('status').default('pending').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  engineVersion: text('engine_version').notNull(),
  seed: text('seed').notNull(),
  inputHash: text('input_hash').notNull(),
  catalogWatermark: timestamp('catalog_watermark', { withTimezone: true }).notNull(),
  horizonStart: timestamp('horizon_start', { withTimezone: true }).notNull(),
  horizonEnd: timestamp('horizon_end', { withTimezone: true }).notNull(),
  cursorInstant: timestamp('cursor_instant', { withTimezone: true }),
  health: jsonb('health').$type<Record<string, number>>().default({}).notNull(),
  failure: jsonb('failure').$type<Record<string, unknown>>(),
  ...timestamps,
}, (table) => [
  uniqueIndex('generation_runs_idempotency_uq').on(table.channelId, table.idempotencyKey),
  index('generation_runs_channel_status_idx').on(table.channelId, table.status),
])

export const generationSegments = pgTable('generation_segments', {
  id: uuid('id').defaultRandom().primaryKey(),
  runId: uuid('run_id').references(() => generationRuns.id, { onDelete: 'cascade' }).notNull(),
  segmentIndex: integer('segment_index').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  checksum: text('checksum').notNull(),
  itemCount: integer('item_count').notNull(),
  checkpoint: jsonb('checkpoint').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('generation_segments_run_index_uq').on(table.runId, table.segmentIndex)])

export const schedules = pgTable('schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }).notNull(),
  runId: uuid('run_id').references(() => generationRuns.id, { onDelete: 'restrict' }).notNull(),
  revision: integer('revision').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('schedules_channel_revision_uq').on(table.channelId, table.revision)])

export const scheduleItems = pgTable('schedule_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  scheduleId: uuid('schedule_id').references(() => schedules.id, { onDelete: 'cascade' }).notNull(),
  trackId: uuid('track_id').references(() => tracks.id),
  assetId: uuid('asset_id').references(() => audioAssets.id),
  ordinal: integer('ordinal').notNull(),
  kind: text('kind').default('music').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  effectiveDurationMs: integer('effective_duration_ms').notNull(),
  score: real('score'),
  scoreComponents: jsonb('score_components').$type<Record<string, number>>().default({}).notNull(),
  reasonCodes: jsonb('reason_codes').$type<string[]>().default([]).notNull(),
  decisionTrace: jsonb('decision_trace').$type<Record<string, unknown>>().default({}).notNull(),
  held: boolean('held').default(false).notNull(),
}, (table) => [
  uniqueIndex('schedule_items_schedule_ordinal_uq').on(table.scheduleId, table.ordinal),
  index('schedule_items_schedule_time_idx').on(table.scheduleId, table.startsAt),
])

export const publications = pgTable('publications', {
  id: uuid('id').defaultRandom().primaryKey(),
  scheduleId: uuid('schedule_id').references(() => schedules.id, { onDelete: 'cascade' }).notNull(),
  connectionId: uuid('connection_id').references(() => providerConnections.id, { onDelete: 'cascade' }).notNull(),
  status: runStatus('status').default('pending').notNull(),
  revision: integer('revision').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  remoteObjectId: text('remote_object_id'),
  remoteSnapshotId: text('remote_snapshot_id'),
  cursor: integer('cursor').default(0).notNull(),
  retryAt: timestamp('retry_at', { withTimezone: true }),
  response: jsonb('response').$type<Record<string, unknown>>(),
  ...timestamps,
}, (table) => [uniqueIndex('publications_connection_key_uq').on(table.connectionId, table.idempotencyKey)])

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  memberId: uuid('member_id').references(() => members.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('audit_events_workspace_time_idx').on(table.workspaceId, table.createdAt)])

export const llmArtifacts = pgTable('llm_artifacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  purpose: text('purpose').notNull(),
  inputHash: text('input_hash').notNull(),
  provenance: text('provenance').notNull(),
  model: text('model').notNull(),
  promptVersion: text('prompt_version').notNull(),
  output: jsonb('output').$type<Record<string, unknown>>().notNull(),
  tokenUsage: jsonb('token_usage').$type<Record<string, number>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('llm_artifacts_workspace_input_uq').on(table.workspaceId, table.inputHash, table.promptVersion)])
