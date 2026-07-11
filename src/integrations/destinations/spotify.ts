import type { DestinationAdapter, DestinationCapabilities, PublishRequest, PublishResult } from './types'
import { DestinationError } from './types'

interface SpotifyOptions {
  accessToken: string
  fetch?: typeof globalThis.fetch
}

const capabilities: DestinationCapabilities = {
  playlistWrite: true,
  linearDelivery: false,
  ownsAudio: false,
  permitsAiProcessing: false,
  supportsSnapshot: true,
  maximumBatchSize: 100,
}

export class SpotifyDestination implements DestinationAdapter {
  readonly provider = 'spotify'
  readonly capabilities = capabilities
  private readonly fetcher: typeof globalThis.fetch

  constructor(private readonly options: SpotifyOptions) {
    this.fetcher = options.fetch ?? globalThis.fetch
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    let snapshotId: string | undefined
    const batches = Array.from({ length: Math.ceil(request.itemIds.length / 100) }, (_, index) => request.itemIds.slice(index * 100, (index + 1) * 100))

    for (let index = 0; index < batches.length; index += 1) {
      const response = await this.requestWithRateLimit(`https://api.spotify.com/v1/playlists/${encodeURIComponent(request.remoteObjectId)}/tracks`, {
        method: index === 0 ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${this.options.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: batches[index] }),
      })
      const body = await response.json<{ snapshot_id?: string }>()
      snapshotId = body.snapshot_id ?? snapshotId
    }

    return {
      provider: this.provider,
      remoteObjectId: request.remoteObjectId,
      revisionId: request.revisionId,
      remoteSnapshotId: snapshotId,
      itemCount: request.itemIds.length,
      publishedAt: new Date().toISOString(),
    }
  }

  private async requestWithRateLimit(url: string, init: RequestInit, attempt = 0): Promise<Response> {
    const response = await this.fetcher(url, init)
    if (response.status === 429 && attempt < 3) {
      const retryAfterSeconds = Number(response.headers.get('Retry-After') ?? '1')
      await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfterSeconds, 10) * 1000))
      return this.requestWithRateLimit(url, init, attempt + 1)
    }
    if (!response.ok) throw new DestinationError(`Spotify publish failed with ${response.status}`, response.status >= 500 || response.status === 429, response.status)
    return response
  }
}
