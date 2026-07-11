import type { ScheduledItem } from '@/domain/scheduling/types'

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

export function exportScheduleCsv(items: ScheduledItem[]) {
  const rows = items.map((item) => [item.startsAt, item.endsAt, item.track.title, item.track.artist, item.track.id, item.track.durationMs, 'estimated', item.track.rotation, item.track.contentRating, item.track.assetStatus, item.held].map((value) => escapeCsv(String(value))).join(','))
  return ['starts_at,ends_at,title,artist,track_id,duration_ms,duration_provenance,rotation,content_rating,asset_status,held', ...rows].join('\n')
}

export function exportScheduleM3u(items: ScheduledItem[]) {
  return ['#EXTM3U', '# Cadessa metadata schedule — durations are editorial estimates; replace missing:// URIs with analyzed licensed assets before playout.', ...items.flatMap((item) => [
    `#EXTINF:${Math.round(item.track.durationMs / 1000)},${item.track.artist} - ${item.track.title}`,
    `#EXT-X-CADESSA-CONTENT-RATING:${item.track.contentRating}`,
    `#EXT-X-CADESSA-ASSET-STATUS:${item.track.assetStatus}`,
    `missing://licensed-master/${item.track.id}`,
  ])].join('\n')
}

export async function storeBroadcastLog(bucket: R2Bucket, workspaceId: string, scheduleId: string, items: ScheduledItem[]) {
  const key = `workspaces/${workspaceId}/schedules/${scheduleId}/broadcast-log.json`
  await bucket.put(key, JSON.stringify({ scheduleId, generatedAt: new Date().toISOString(), items }), {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: { workspaceId, scheduleId },
  })
  return key
}
