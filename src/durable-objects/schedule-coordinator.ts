import { DurableObject } from 'cloudflare:workers'
import { exportScheduleCsv, exportScheduleM3u } from '@/integrations/destinations/broadcast'
import { findScheduleAlternatives, generateSchedule, replaceScheduleTrack } from '@/domain/scheduling/engine'
import { DEFAULT_SCHEDULE_REQUEST, HOT_AC_TRACKS } from '@/domain/scheduling/fixtures'
import type { ScheduleResult } from '@/domain/scheduling/types'
import type { StudioAction } from '@/domain/studio/schema'
import type { RevisionSummary, ScheduleChangeKind, ScheduleRevision, StudioSnapshot } from '@/domain/studio/types'

interface GenerationCheckpoint {
  runId: string
  channelId: string
  status: 'queued' | 'running' | 'ready' | 'cancelled'
  cursorHour: number
  horizonHours: number
  chunkHours: number
  generationToken: string
  horizonStart: string
  seed: string
  artistHistory: Record<string, string>
  trackHistory: Record<string, string>
  updatedAt: string
}

interface SegmentArtifact {
  segmentIndex: number
  startsAt: string
  endsAt: string
  schedules: ScheduleResult[]
  flowScore: number
  engineVersion: string
  checksum: string
}

interface EnqueuePayload {
  runId: string
  channelId: string
  horizonHours?: number
  generationToken?: string
  horizonStart?: string
  seed?: string
}

interface StudioMeta {
  schemaVersion: number
  channelId: string
  activeRevision: number
  updatedAt: string
}

const activeJobKey = 'active-generation'
const studioMetaKey = 'studio:meta'
const studioSchemaVersion = 2
const revisionKey = (revision: number) => `studio:revision:${String(revision).padStart(6, '0')}`

function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } })
}

function download(content: string, contentType: string, filename: string) {
  return new Response(content, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

function revisionSummary(revision: ScheduleRevision): RevisionSummary {
  return {
    revision: revision.revision,
    parentRevision: revision.parentRevision,
    sourceRevision: revision.sourceRevision,
    changeKind: revision.changeKind,
    state: revision.state,
    flowScore: revision.schedule.flowScore,
    itemCount: revision.schedule.items.length,
    createdAt: revision.createdAt,
  }
}

export class ScheduleCoordinator extends DurableObject<CloudflareBindings> {
  async fetch(request: Request) {
    const url = new URL(request.url)

    if (url.pathname === '/studio') return this.handleStudio(request, url)

    if (request.method === 'POST' && url.pathname === '/enqueue') {
      const payload = await request.json<EnqueuePayload>()
      if (!payload.runId || !payload.channelId) return json({ error: 'runId and channelId are required' }, 400)

      const existing = await this.ctx.storage.get<GenerationCheckpoint>(activeJobKey)
      if (existing?.runId === payload.runId && existing.status !== 'cancelled') return json(existing, 202)

      const checkpoint: GenerationCheckpoint = {
        runId: payload.runId,
        channelId: payload.channelId,
        status: 'queued',
        cursorHour: 0,
        horizonHours: Math.min(Math.max(payload.horizonHours ?? 168, 1), 336),
        chunkHours: 3,
        generationToken: payload.generationToken ?? crypto.randomUUID(),
        horizonStart: payload.horizonStart ?? new Date().toISOString(),
        seed: payload.seed ?? `${payload.channelId}:${payload.runId}`,
        artistHistory: {},
        trackHistory: {},
        updatedAt: new Date().toISOString(),
      }
      await this.ctx.storage.put(activeJobKey, checkpoint)
      await this.ctx.storage.setAlarm(Date.now() + 100)
      return json(checkpoint, 202)
    }

    if (request.method === 'GET' && url.pathname === '/status') {
      const checkpoint = await this.ctx.storage.get<GenerationCheckpoint>(activeJobKey)
      if (!checkpoint) return json({ status: 'idle' })
      const storedSegments = await this.ctx.storage.list<SegmentArtifact>({ prefix: `segment:${checkpoint.runId}:` })
      const segments = [...storedSegments.values()].sort((a, b) => a.segmentIndex - b.segmentIndex)
      const schedules = segments.flatMap((segment) => segment.schedules)
      const includeSchedules = url.searchParams.get('include') === 'schedules'
      return json({
        ...checkpoint,
        completedSegments: segments.length,
        progress: checkpoint.cursorHour / checkpoint.horizonHours,
        result: checkpoint.status === 'ready' ? {
          scheduleCount: schedules.length,
          itemCount: schedules.reduce((count, schedule) => count + schedule.items.length, 0),
          startsAt: schedules[0]?.items[0]?.startsAt,
          endsAt: schedules.at(-1)?.items.at(-1)?.endsAt,
          averageFlowScore: schedules.length > 0 ? Math.round(schedules.reduce((total, schedule) => total + schedule.flowScore, 0) / schedules.length) : 0,
          ...(includeSchedules ? { schedules } : {}),
        } : undefined,
      })
    }

    if (request.method === 'DELETE' && url.pathname === '/cancel') {
      const checkpoint = await this.ctx.storage.get<GenerationCheckpoint>(activeJobKey)
      if (!checkpoint) return json({ status: 'idle' })
      const cancelled = { ...checkpoint, status: 'cancelled' as const, updatedAt: new Date().toISOString() }
      await this.ctx.storage.put(activeJobKey, cancelled)
      await this.ctx.storage.deleteAlarm()
      return json(cancelled)
    }

    return json({ error: 'Not found' }, 404)
  }

  private async handleStudio(request: Request, url: URL) {
    const channelId = url.searchParams.get('channelId') ?? 'pulse-965'

    if (request.method === 'DELETE') {
      const stored = await this.ctx.storage.list({ prefix: 'studio:' })
      await this.ctx.storage.delete([...stored.keys()])
      return json(await this.ensureStudio(channelId))
    }

    const snapshot = await this.ensureStudio(channelId)
    if (request.method === 'GET') {
      const format = url.searchParams.get('format')
      if (format === 'csv') return download(exportScheduleCsv(snapshot.active.schedule.items), 'text/csv; charset=utf-8', `cadessa-${channelId}-r${snapshot.active.revision}.csv`)
      if (format === 'm3u') return download(exportScheduleM3u(snapshot.active.schedule.items), 'audio/x-mpegurl; charset=utf-8', `cadessa-${channelId}-r${snapshot.active.revision}.m3u`)
      if (format === 'json') return download(JSON.stringify(snapshot.active, null, 2), 'application/json; charset=utf-8', `cadessa-${channelId}-r${snapshot.active.revision}.json`)
      return json(snapshot)
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
    const action = await request.json<StudioAction>()

    if (action.action === 'alternatives') {
      const alternatives = findScheduleAlternatives(this.requestFor(snapshot.active), snapshot.active.schedule, action.position)
      return json({ position: action.position, alternatives })
    }

    if (action.action === 'approve') {
      const approved = { ...snapshot.active, state: 'approved' as const, approvedAt: new Date().toISOString() }
      await this.ctx.storage.put(revisionKey(approved.revision), approved)
      return json(await this.snapshotFor(approved.revision))
    }

    if (action.action === 'restore') {
      const source = await this.ctx.storage.get<ScheduleRevision>(revisionKey(action.revision))
      if (!source) return json({ error: `Revision ${action.revision} was not found.` }, 404)
      return json(await this.persistRevision(source.channelId, source.schedule, source.holds, 'restore', snapshot.active.revision, action.revision))
    }

    if (action.action === 'hold') {
      const item = snapshot.active.schedule.items[action.position]
      if (!item || item.track.id !== action.trackId) return json({ error: 'The selected item no longer matches the active revision.' }, 409)
      const holds = { ...snapshot.active.holds }
      if (holds[action.position] === action.trackId) delete holds[action.position]
      else holds[action.position] = action.trackId
      const schedule = { ...snapshot.active.schedule, items: snapshot.active.schedule.items.map((scheduledItem) => ({ ...scheduledItem, held: holds[scheduledItem.position] === scheduledItem.track.id })) }
      return json(await this.persistRevision(channelId, schedule, holds, 'hold', snapshot.active.revision))
    }

    if (action.action === 'replace') {
      try {
        const holds = { ...snapshot.active.holds }
        if (holds[action.position]) holds[action.position] = action.trackId
        const replacement = replaceScheduleTrack(this.requestFor(snapshot.active), snapshot.active.schedule, action.position, action.trackId)
        const schedule = { ...replacement, items: replacement.items.map((item) => ({ ...item, held: holds[item.position] === item.track.id })) }
        return json(await this.persistRevision(channelId, schedule, holds, 'replace', snapshot.active.revision))
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'Replacement failed.' }, 409)
      }
    }

    const pinnedTrackIds = snapshot.active.holds
    const schedule = generateSchedule({
      ...DEFAULT_SCHEDULE_REQUEST,
      startAt: action.startAt ?? snapshot.active.schedule.items[0]?.startsAt ?? DEFAULT_SCHEDULE_REQUEST.startAt,
      seed: action.seed ?? `${snapshot.active.schedule.seed}:r${snapshot.active.revision + 1}`,
      pinnedTrackIds,
    })
    return json(await this.persistRevision(channelId, schedule, pinnedTrackIds, 'reflow', snapshot.active.revision))
  }

  private requestFor(revision: ScheduleRevision) {
    return {
      ...DEFAULT_SCHEDULE_REQUEST,
      startAt: revision.schedule.items[0]?.startsAt ?? DEFAULT_SCHEDULE_REQUEST.startAt,
      seed: revision.schedule.seed,
      targetCount: revision.schedule.items.length,
      targetDurationMs: revision.schedule.targetDurationMs,
    }
  }

  private async ensureStudio(channelId: string): Promise<StudioSnapshot> {
    const meta = await this.ctx.storage.get<StudioMeta>(studioMetaKey)
    if (meta?.channelId === channelId && meta.schemaVersion === studioSchemaVersion) return this.snapshotFor(meta.activeRevision)
    if (meta) {
      const stored = await this.ctx.storage.list({ prefix: 'studio:' })
      await this.ctx.storage.delete([...stored.keys()])
    }
    const schedule = generateSchedule(DEFAULT_SCHEDULE_REQUEST)
    return this.persistRevision(channelId, schedule, {}, 'initial', null)
  }

  private async persistRevision(channelId: string, schedule: ScheduleResult, holds: Record<number, string>, changeKind: ScheduleChangeKind, parentRevision: number | null, sourceRevision?: number): Promise<StudioSnapshot> {
    const meta = await this.ctx.storage.get<StudioMeta>(studioMetaKey)
    const revisionNumber = (meta?.activeRevision ?? 0) + 1
    const revision: ScheduleRevision = {
      channelId,
      revision: revisionNumber,
      parentRevision,
      sourceRevision,
      changeKind,
      state: 'draft',
      schedule,
      holds,
      createdAt: new Date().toISOString(),
    }
    await this.ctx.storage.transaction(async (transaction) => {
      await transaction.put(revisionKey(revisionNumber), revision)
      await transaction.put(studioMetaKey, { schemaVersion: studioSchemaVersion, channelId, activeRevision: revisionNumber, updatedAt: revision.createdAt } satisfies StudioMeta)
    })
    return this.snapshotFor(revisionNumber)
  }

  private async snapshotFor(activeRevision: number): Promise<StudioSnapshot> {
    const active = await this.ctx.storage.get<ScheduleRevision>(revisionKey(activeRevision))
    if (!active) throw new Error(`Active revision ${activeRevision} is missing.`)
    const stored = await this.ctx.storage.list<ScheduleRevision>({ prefix: 'studio:revision:' })
    const revisions = [...stored.values()].map(revisionSummary).sort((a, b) => b.revision - a.revision)
    return {
      active,
      revisions,
      catalogCount: HOT_AC_TRACKS.length,
      catalogSource: 'American Top 40 Hot AC · June 27, 2026; recurrent library curated July 11, 2026',
    }
  }

  async alarm() {
    const checkpoint = await this.ctx.storage.get<GenerationCheckpoint>(activeJobKey)
    if (!checkpoint || checkpoint.status === 'cancelled' || checkpoint.status === 'ready') return

    const segmentIndex = Math.floor(checkpoint.cursorHour / checkpoint.chunkHours)
    const segmentKey = `segment:${checkpoint.runId}:${segmentIndex}`
    const nextCursor = Math.min(checkpoint.cursorHour + checkpoint.chunkHours, checkpoint.horizonHours)
    const alreadyCompleted = await this.ctx.storage.get<SegmentArtifact>(segmentKey)
    const artistHistory = { ...checkpoint.artistHistory }
    const trackHistory = { ...checkpoint.trackHistory }
    const schedules: ScheduleResult[] = []

    if (!alreadyCompleted) {
      for (let hour = checkpoint.cursorHour; hour < nextCursor; hour += 1) {
        const startAt = new Date(new Date(checkpoint.horizonStart).getTime() + hour * 3_600_000).toISOString()
        const schedule = generateSchedule({
          ...DEFAULT_SCHEDULE_REQUEST,
          destination: 'demo',
          startAt,
          artistHistory,
          trackHistory,
          seed: `${checkpoint.seed}:hour:${hour}`,
        })
        schedules.push(schedule)
        for (const item of schedule.items) {
          for (const artist of item.track.artistKeys) artistHistory[artist] = item.endsAt
          trackHistory[item.track.id] = item.endsAt
        }
      }
    }

    const segment = alreadyCompleted ?? {
      segmentIndex,
      startsAt: new Date(new Date(checkpoint.horizonStart).getTime() + checkpoint.cursorHour * 3_600_000).toISOString(),
      endsAt: new Date(new Date(checkpoint.horizonStart).getTime() + nextCursor * 3_600_000).toISOString(),
      schedules,
      flowScore: schedules.length === 0 ? 0 : Math.round(schedules.reduce((sum, schedule) => sum + schedule.flowScore, 0) / schedules.length),
      engineVersion: schedules[0]?.engineVersion ?? 'unknown',
      checksum: schedules.map((schedule) => schedule.id).join(':'),
    } satisfies SegmentArtifact

    await this.ctx.storage.transaction(async (transaction) => {
      if (!alreadyCompleted) await transaction.put(segmentKey, segment)
      await transaction.put(activeJobKey, {
        ...checkpoint,
        status: nextCursor >= checkpoint.horizonHours ? 'ready' : 'running',
        cursorHour: nextCursor,
        artistHistory,
        trackHistory,
        updatedAt: new Date().toISOString(),
      } satisfies GenerationCheckpoint)
    })

    if (nextCursor < checkpoint.horizonHours) await this.ctx.storage.setAlarm(Date.now() + 250)
  }
}
