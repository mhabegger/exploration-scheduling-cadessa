import { describe, expect, it } from 'vitest'
import { SpotifyDestination } from './spotify'

describe('SpotifyDestination', () => {
  it('publishes resumable batches of at most 100 items and retains the final snapshot', async () => {
    const requests: RequestInit[] = []
    const fetcher: typeof globalThis.fetch = async (_input, init) => {
      requests.push(init ?? {})
      return Response.json({ snapshot_id: `snapshot-${requests.length}` })
    }
    const destination = new SpotifyDestination({ accessToken: 'test-token', fetch: fetcher })
    const result = await destination.publish({
      remoteObjectId: 'playlist-1',
      revisionId: 'revision-7',
      itemIds: Array.from({ length: 205 }, (_, index) => `spotify:track:${index}`),
    })

    expect(requests.map((request) => request.method)).toEqual(['PUT', 'POST', 'POST'])
    expect(requests.map((request) => JSON.parse(String(request.body)).uris.length)).toEqual([100, 100, 5])
    expect(result.remoteSnapshotId).toBe('snapshot-3')
    expect(result.itemCount).toBe(205)
  })
})
