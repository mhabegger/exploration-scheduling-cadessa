export interface DestinationCapabilities {
  playlistWrite: boolean
  linearDelivery: boolean
  ownsAudio: boolean
  permitsAiProcessing: boolean
  supportsSnapshot: boolean
  maximumBatchSize: number | null
}

export interface PublishRequest {
  remoteObjectId: string
  revisionId: string
  itemIds: string[]
  title?: string
  description?: string
}

export interface PublishResult {
  provider: string
  remoteObjectId: string
  revisionId: string
  remoteSnapshotId?: string
  itemCount: number
  publishedAt: string
}

export interface DestinationAdapter {
  readonly provider: string
  readonly capabilities: DestinationCapabilities
  publish(request: PublishRequest): Promise<PublishResult>
}

export class DestinationError extends Error {
  constructor(message: string, public readonly retryable: boolean, public readonly status?: number) {
    super(message)
    this.name = 'DestinationError'
  }
}
