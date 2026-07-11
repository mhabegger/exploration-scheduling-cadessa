import type { DestinationAdapter, DestinationCapabilities, PublishRequest, PublishResult } from './types'
import { DestinationError } from './types'

const capabilities: DestinationCapabilities = {
  playlistWrite: true,
  linearDelivery: false,
  ownsAudio: false,
  permitsAiProcessing: false,
  supportsSnapshot: false,
  maximumBatchSize: null,
}

export class DeezerDestination implements DestinationAdapter {
  readonly provider = 'deezer'
  readonly capabilities = capabilities

  constructor(private readonly accessToken?: string) {}

  async publish(request: PublishRequest): Promise<PublishResult> {
    if (!this.accessToken) throw new DestinationError('Deezer credentials and playlist-write capability are required.', false, 401)
    throw new DestinationError(`Deezer write access for ${request.remoteObjectId} must be enabled against the granted application capabilities.`, false, 501)
  }
}
