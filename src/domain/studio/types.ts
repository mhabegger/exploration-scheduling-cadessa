import type { ScheduleAlternative, ScheduleResult } from '@/domain/scheduling/types'

export type ScheduleChangeKind = 'initial' | 'reflow' | 'hold' | 'replace' | 'restore'
export type ScheduleDocumentState = 'draft' | 'approved'

export interface ScheduleRevision {
  channelId: string
  revision: number
  parentRevision: number | null
  sourceRevision?: number
  changeKind: ScheduleChangeKind
  state: ScheduleDocumentState
  schedule: ScheduleResult
  holds: Record<number, string>
  createdAt: string
  approvedAt?: string
}

export interface RevisionSummary {
  revision: number
  parentRevision: number | null
  sourceRevision?: number
  changeKind: ScheduleChangeKind
  state: ScheduleDocumentState
  flowScore: number
  itemCount: number
  createdAt: string
}

export interface StudioSnapshot {
  active: ScheduleRevision
  revisions: RevisionSummary[]
  catalogCount: number
  catalogSource: string
}

export interface AlternativesResponse {
  position: number
  alternatives: ScheduleAlternative[]
}
