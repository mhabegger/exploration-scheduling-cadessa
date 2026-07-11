import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ChartNoAxesColumnIncreasing, Check, ChevronRight, CircleAlert, ExternalLink, Grid2X2, List, LockKeyhole, Music2, Search, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { HOT_AC_TRACKS } from '@/domain/scheduling/fixtures'
import { formatDuration } from '@/lib/utils'

export const Route = createFileRoute('/library')({ component: LibraryPage })

const filters = ['All tracks', 'Power', 'Current', 'Discovery', 'Needs attention']

function LibraryPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All tracks')
  const [grid, setGrid] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = HOT_AC_TRACKS.find((track) => track.id === selectedId)
  const tracks = useMemo(() => HOT_AC_TRACKS.filter((track) => {
    const matchesQuery = `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'All tracks' || (filter === 'Needs attention' ? track.sources.some((source) => !source.playable) : track.rotation === filter.toLowerCase())
    return matchesQuery && matchesFilter
  }), [filter, query])

  return (
    <div className="library-page page-enter">
      <section className="page-heading compact">
        <div><Badge variant="iris" className="mb-3"><ChartNoAxesColumnIncreasing className="size-3" />Chart-backed Hot AC snapshot</Badge><h1>Real songs. Honest capabilities.</h1><p>Sixty actual Hot AC titles are ready for metadata scheduling. Audio features are editorial estimates; provider IDs and masters remain unclaimed until connected.</p></div>
        <Button disabled><LockKeyhole className="size-4" />Connect R2 to add masters</Button>
      </section>

      <section className="library-summary">
        <Card><span className="summary-symbol ready"><Check /></span><div><strong>{HOT_AC_TRACKS.length}</strong><p>Real Hot AC titles</p></div><small>Current + recurrent + gold</small></Card>
        <Card><span className="summary-symbol enriched"><Sparkles /></span><div><strong>{HOT_AC_TRACKS.filter((track) => track.chartRank).length}</strong><p>Chart-ranked currents</p></div><small>AT40 · June 27, 2026</small></Card>
        <Card><span className="summary-symbol warning"><CircleAlert /></span><div><strong>{HOT_AC_TRACKS.filter((track) => track.assetStatus === 'metadata-only').length}</strong><p>Masters required</p></div><small>Never implied playable</small></Card>
        <Card><span className="summary-symbol duplicate">0</span><div><strong>fake IDs</strong><p>Provider identities</p></div><small>Added only after OAuth sync</small></Card>
      </section>

      <Card className="library-browser">
        <div className="library-toolbar">
          <label className="library-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, artist or album" /></label>
          <div className="library-filters">{filters.map((item) => <button type="button" key={item} className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
          <div className="view-toggle"><button type="button" className={!grid ? 'is-active' : ''} onClick={() => setGrid(false)} aria-label="List view"><List /></button><button type="button" className={grid ? 'is-active' : ''} onClick={() => setGrid(true)} aria-label="Grid view"><Grid2X2 /></button></div>
        </div>

        {!grid ? <div className="library-table">
          <div className="library-table-head"><span>#</span><span>Track</span><span>Sound</span><span>Rotation</span><span>Availability</span><span>Planning data</span><span /></div>
          {tracks.slice(0, 14).map((track, index) => <button className="library-row" type="button" key={track.id} onClick={() => setSelectedId(track.id)}>
            <span className="library-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="library-track"><i style={{ background: track.cover }}><Music2 /></i><span><strong>{track.title}</strong><small>{track.artist}{track.chartRank ? ` · Hot AC #${track.chartRank}` : ` · ${track.era} library`}</small></span></span>
            <span className="sound-cell"><span>Est. {track.bpm} BPM</span><small>{Math.round(track.energy * 100)}% energy · estimated</small></span>
            <Badge variant={track.rotation === 'discovery' ? 'iris' : track.rotation === 'power' ? 'default' : 'neutral'}>{track.rotation}</Badge>
            <span className="availability-dots" aria-label="Metadata ready; broadcast and streaming providers not connected"><i className="ok">M</i><i>B</i><i>S</i><i>D</i></span>
            <span className="last-played">Editorial seed</span><ChevronRight />
          </button>)}
        </div> : <div className="album-grid">{tracks.map((track) => <button type="button" key={track.id} onClick={() => setSelectedId(track.id)}><span className="album-cover" style={{ background: track.cover }}><Music2 /></span><strong>{track.title}</strong><small>{track.artist}</small><Badge variant="neutral">{track.rotation}</Badge></button>)}</div>}

        <div className="library-footer"><span>Showing {Math.min(tracks.length, grid ? tracks.length : 14)} of {tracks.length} matching titles</span><span><i className="status-dot aqua" />Editorial snapshot · July 11, 2026</span></div>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelectedId(null) }}>
        <DialogContent className="track-dialog">
          {selected && <>
            <DialogTitle className="sr-only">{selected.title}</DialogTitle><DialogDescription className="sr-only">Track details and scheduling intelligence.</DialogDescription>
            <div className="track-dialog-hero" style={{ background: selected.cover }}><span className="cover-noise" />{selected.chartSource && <a href={selected.chartSource} target="_blank" rel="noreferrer" aria-label="Open chart source"><ExternalLink /></a>}</div>
            <div className="track-dialog-body"><Badge variant="iris">{selected.rotation}</Badge><h2>{selected.title}</h2><p>{selected.artist}{selected.chartRank ? ` · Hot AC #${selected.chartRank}` : ' · recurrent library'}</p><div className="track-facts"><span><small>Estimated tempo</small><strong>{selected.bpm} BPM</strong></span><span><small>Estimated energy</small><strong>{Math.round(selected.energy * 100)}%</strong></span><span><small>Master rating</small><strong>{selected.contentRating}</strong></span><span><small>Planning length</small><strong>~{formatDuration(selected.durationMs)}</strong></span></div><div className="auto-read"><Sparkles /><p><strong>Editorial planning data</strong>{selected.mood.join(', ')} texture. Duration, audio features and clean/explicit status must be verified from the licensed master before playout.</p></div><Button className="w-full" disabled><LockKeyhole className="size-4" />Licensed master not connected</Button></div>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
