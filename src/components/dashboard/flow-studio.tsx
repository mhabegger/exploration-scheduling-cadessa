import { useEffect, useState } from 'react'
import {
  ArrowRight,
  AudioWaveform,
  Check,
  ChevronRight,
  CircleAlert,
  Disc3,
  Download,
  FileJson,
  FileSpreadsheet,
  History,
  MoreHorizontal,
  Pin,
  RadioTower,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { DEFAULT_SCHEDULE_REQUEST, HOT_AC_PROFILE, HOT_AC_TRACKS } from '@/domain/scheduling/fixtures'
import { generateSchedule } from '@/domain/scheduling/engine'
import type { ScheduleAlternative, ScheduledItem } from '@/domain/scheduling/types'
import type { StudioAction } from '@/domain/studio/schema'
import type { AlternativesResponse, StudioSnapshot } from '@/domain/studio/types'
import { cn, formatClock, formatDuration, formatExactDuration } from '@/lib/utils'

const days = ['Mon 13', 'Tue 14', 'Wed 15', 'Thu 16', 'Fri 17', 'Sat 18', 'Sun 19']
const apiBase = '/api/studio/pulse-965'
const fallbackSchedule = generateSchedule(DEFAULT_SCHEDULE_REQUEST)

function EnergyRibbon({ points }: { points: number[] }) {
  const coordinates = points.map((value, index) => `${(index / (points.length - 1)) * 100},${38 - value * 28}`).join(' ')
  return (
    <div className="energy-ribbon" aria-label="Estimated energy by scheduled position">
      <div className="energy-ribbon-label"><span>ESTIMATED ENERGY ARC</span><span>Active revision</span></div>
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" role="img">
        <defs><linearGradient id="energy-fill" x1="0" x2="1"><stop offset="0" stopColor="#4adcc7" stopOpacity=".1" /><stop offset=".55" stopColor="#caff5a" stopOpacity=".28" /><stop offset="1" stopColor="#a68bff" stopOpacity=".08" /></linearGradient><linearGradient id="energy-line" x1="0" x2="1"><stop offset="0" stopColor="#4adcc7" /><stop offset=".55" stopColor="#caff5a" /><stop offset="1" stopColor="#a68bff" /></linearGradient></defs>
        <polygon points={`0,42 ${coordinates} 100,42`} fill="url(#energy-fill)" />
        <polyline points={coordinates} fill="none" stroke="url(#energy-line)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
        {points.map((value, index) => <circle key={index} cx={(index / (points.length - 1)) * 100} cy={38 - value * 28} r="1.05" fill="#11130f" stroke="#caff5a" strokeWidth=".55" vectorEffect="non-scaling-stroke" />)}
      </svg>
      <div className="energy-times"><span>Slot 1</span><span>Slot 3</span><span>Slot 6</span><span>Slot 9</span><span>Slot {points.length}</span></div>
    </div>
  )
}

function MiniWave({ energy }: { energy: number }) {
  return <span className="mini-wave" aria-label={`${Math.round(energy * 100)} percent estimated energy`}>{Array.from({ length: 8 }).map((_, index) => <i key={index} style={{ height: `${5 + ((index * 19 + Math.round(energy * 31)) % 13) * energy}px` }} />)}</span>
}

function TrackRow({ item, selected, onSelect }: { item: ScheduledItem; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" className={cn('track-row', selected && 'is-selected')} onClick={onSelect}>
      <span className="track-time">{formatClock(item.startsAt)}</span>
      <span className="track-cover" style={{ background: item.track.cover }}><span className="cover-noise" />{item.track.chartRank && <span className="chart-rank">#{item.track.chartRank}</span>}</span>
      <span className="track-primary"><strong>{item.track.title}{item.held && <Pin className="held-pin" />}</strong><small>{item.track.artist} · {item.track.featureProvenance === 'estimated' ? 'editorial estimates' : item.track.album}</small></span>
      <Badge variant={item.track.rotation === 'discovery' ? 'iris' : item.track.rotation === 'power' ? 'default' : 'neutral'} className="track-rotation">{item.track.rotation}</Badge>
      <MiniWave energy={item.track.energy} />
      <span className="track-energy">{Math.round(item.track.energy * 100)}</span>
      <span className="track-duration">~{formatExactDuration(item.track.durationMs)}</span>
      <ChevronRight className="track-chevron" />
    </button>
  )
}

function MetricCard({ label, value, detail, tone, icon: Icon }: { label: string; value: string; detail: string; tone: 'lime' | 'iris' | 'aqua' | 'coral'; icon: typeof Sparkles }) {
  return <Card className="metric-card"><div className={cn('metric-icon', `tone-${tone}`)}><Icon /></div><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></Card>
}

export function FlowStudio() {
  const [snapshot, setSnapshot] = useState<StudioSnapshot | null>(null)
  const [selectedDay, setSelectedDay] = useState(1)
  const [selectedPosition, setSelectedPosition] = useState(0)
  const [isComposing, setIsComposing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [alternatives, setAlternatives] = useState<ScheduleAlternative[]>([])
  const [alternativesOpen, setAlternativesOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  const schedule = snapshot?.active.schedule ?? fallbackSchedule
  const active = snapshot?.active
  const selectedItem = schedule.items[selectedPosition] ?? schedule.items[0]
  const timingDelta = schedule.timingDeltaMs ?? 0
  const timingLabel = `~${Math.abs(Math.round(timingDelta / 1000))}s ${timingDelta > 0 ? 'over' : 'under'} planning target`
  const activeDate = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Europe/Zurich' }).format(new Date(schedule.items[0]?.startsAt ?? DEFAULT_SCHEDULE_REQUEST.startAt))

  useEffect(() => {
    let activeRequest = true
    void fetch(apiBase).then(async (response) => {
      if (!response.ok) throw new Error('Could not load the saved studio schedule.')
      const data: StudioSnapshot = await response.json()
      if (activeRequest) { setSnapshot(data); setLoadState('ready') }
    }).catch((error: unknown) => {
      if (activeRequest) { setLoadState('error'); setNotice(error instanceof Error ? error.message : 'Could not load the saved studio schedule.') }
    })
    return () => { activeRequest = false }
  }, [])

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 4200)
  }

  const runAction = async (action: StudioAction) => {
    const response = await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action) })
    const data: StudioSnapshot & { error?: string } = await response.json()
    if (!response.ok) throw new Error(data.error ?? 'The studio action failed.')
    setSnapshot(data)
    return data
  }

  const recompose = async (day = selectedDay) => {
    setIsComposing(true)
    setNotice(`Conductor is scheduling ${HOT_AC_TRACKS.length} chart-backed Hot AC titles…`)
    try {
      const revision = (snapshot?.active.revision ?? 0) + 1
      const data = await runAction({
        action: 'generate',
        seed: `pulse-hot-ac-day-${day}-revision-${revision}`,
        startAt: `2026-07-${String(13 + day).padStart(2, '0')}T16:00:00.000Z`,
      })
      setSelectedPosition(0)
      flash(`Revision ${data.active.revision} saved with ${Object.keys(data.active.holds).length} held slot${Object.keys(data.active.holds).length === 1 ? '' : 's'}.`)
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Reflow failed.')
    } finally {
      setIsComposing(false)
    }
  }

  const chooseDay = (day: number) => {
    setSelectedDay(day)
  }

  const approve = async () => {
    try {
      const data = await runAction({ action: 'approve' })
      flash(`Revision ${data.active.revision} approved. Connect a destination to deliver it.`)
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Approval failed.')
    }
  }

  const toggleHold = async () => {
    if (!selectedItem) return
    try {
      const wasHeld = selectedItem.held
      const data = await runAction({ action: 'hold', position: selectedItem.position, trackId: selectedItem.track.id })
      flash(`${selectedItem.track.title} ${wasHeld ? 'released' : 'held'} in revision ${data.active.revision}.`)
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Hold failed.')
    }
  }

  const openAlternatives = async () => {
    if (!selectedItem) return
    try {
      const response = await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'alternatives', position: selectedItem.position }) })
      const data: AlternativesResponse & { error?: string } = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Could not rank alternatives.')
      setAlternatives(data.alternatives)
      setAlternativesOpen(true)
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Could not rank alternatives.')
    }
  }

  const replace = async (trackId: string) => {
    if (!selectedItem) return
    try {
      const data = await runAction({ action: 'replace', position: selectedItem.position, trackId })
      setAlternativesOpen(false)
      flash(`Replacement saved as revision ${data.active.revision}.`)
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Replacement failed.')
    }
  }

  const restore = async (revision: number) => {
    try {
      const data = await runAction({ action: 'restore', revision })
      setHistoryOpen(false)
      flash(`Revision ${revision} restored as new revision ${data.active.revision}.`)
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Restore failed.')
    }
  }

  return (
    <div className="flow-page page-enter">
      <section className="page-heading">
        <div><Badge variant={loadState === 'ready' ? 'aqua' : loadState === 'error' ? 'coral' : 'neutral'} className="mb-3"><span className={`status-dot ${loadState === 'ready' ? 'aqua' : ''}`} />{loadState === 'ready' ? 'Server-saved schedule' : loadState === 'error' ? 'Local fallback preview' : 'Loading coordinator'}</Badge><h1>{loadState === 'ready' ? 'Hot AC, actually scheduled.' : 'Hot AC planning preview.'}</h1><p>{loadState === 'ready' ? 'A chart-backed music window generated on the Worker, persisted as revision history, and ready for holds, replacements and export.' : 'The local deterministic preview remains visible while the persisted studio is unavailable. Editing controls stay locked.'}</p></div>
        <div className="heading-actions"><Button variant="secondary" onClick={() => void recompose()} disabled={!active || isComposing}>{isComposing ? <RefreshCw className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}{isComposing ? 'Composing…' : `Reflow for ${days[selectedDay]}`}</Button><Button onClick={() => void approve()} disabled={!active || active.state === 'approved'}><Check className="size-4" />{active?.state === 'approved' ? 'Approved' : 'Approve revision'}</Button></div>
      </section>

      <section className="metric-grid" aria-label="Schedule readiness">
        <MetricCard label="Flow score" value={`${schedule.flowScore}`} detail={active ? 'Computed from the saved revision' : 'Local deterministic preview'} tone="lime" icon={Sparkles} />
        <MetricCard label="Active revision" value={active ? `r${active.revision}` : '—'} detail={active ? `${snapshot?.revisions.length ?? 0} preserved version${snapshot?.revisions.length === 1 ? '' : 's'}` : 'No server revision loaded'} tone="iris" icon={History} />
        <MetricCard label="Hard breaks" value={`${schedule.health.hardBreaks}`} detail={`${HOT_AC_PROFILE.artistSeparationMinutes}m artist separation`} tone="aqua" icon={ShieldCheck} />
        <MetricCard label="Catalog state" value={`${snapshot?.catalogCount ?? HOT_AC_TRACKS.length}`} detail="Metadata only · audio not implied" tone="coral" icon={CircleAlert} />
      </section>

      <section className="studio-grid">
        <Card className="schedule-card">
          <CardHeader className="schedule-header">
            <div><div className="section-kicker"><AudioWaveform />Flow Studio · {active ? `revision ${active.revision}` : 'local preview'}</div><h2>{activeDate} · Afternoon Hot AC music window</h2><p>{schedule.items.length} songs · ~{formatDuration(schedule.totalDurationMs)} planned music · <span>{timingLabel}</span></p></div>
            <div className="schedule-actions"><Badge variant={active?.state === 'approved' ? 'aqua' : 'neutral'}><RadioTower className="size-3" />{active?.state ?? 'preview'}</Badge><DropdownMenu><DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label="Schedule options" disabled={!active}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><a href={`${apiBase}?format=csv`}><FileSpreadsheet className="size-4" />Download CSV</a></DropdownMenuItem><DropdownMenuItem asChild><a href={`${apiBase}?format=json`}><FileJson className="size-4" />Download revision JSON</a></DropdownMenuItem><DropdownMenuItem asChild><a href={`${apiBase}?format=m3u`}><Download className="size-4" />Download metadata M3U</a></DropdownMenuItem><DropdownMenuItem onSelect={() => setHistoryOpen(true)}><History className="size-4" />Version history</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
          </CardHeader>

          <div className="day-selector-copy"><strong>Start day for the next reflow</strong><small>Selecting a date does not alter the saved revision.</small></div>
          <div className="day-tabs" role="tablist" aria-label="Start day for next reflow">{days.map((day, index) => <button type="button" key={day} role="tab" aria-selected={selectedDay === index} className={selectedDay === index ? 'is-active' : ''} onClick={() => chooseDay(index)} disabled={isComposing}><span>{day.split(' ')[0]}</span><strong>{day.split(' ')[1]}</strong></button>)}</div>
          <EnergyRibbon points={schedule.items.map((item) => item.track.energy)} />
          <div className="track-table-head"><span>TIME</span><span>TRACK</span><span>ROTATION</span><span>EST. ENERGY</span><span>LENGTH</span></div>
          <div className="track-list">{schedule.items.slice(0, showAll ? schedule.items.length : 8).map((item) => <TrackRow key={item.id} item={item} selected={item.position === selectedPosition} onSelect={() => setSelectedPosition(item.position)} />)}</div>
          <div className="schedule-footer"><div><span className="lock-check"><Check /></span><span><strong>{active ? 'Schedule invariants pass' : 'Preview invariants pass locally'}</strong><small>{schedule.health.durationFit}% planning-duration fit · time-based separation passed · {schedule.engineVersion}</small></span></div><Button variant="ghost" size="sm" onClick={() => setShowAll((value) => !value)}>{showAll ? 'Show compact view' : `Show all ${schedule.items.length} songs`} <ArrowRight className="size-3.5" /></Button></div>
        </Card>

        <div className="studio-rail">
          <Card className="inspector-card"><CardHeader><div><div className="section-kicker"><Disc3 />Why it flows</div><h3>{selectedItem?.track.title ?? 'Select a track'}</h3></div><Badge>{selectedItem?.score ?? 0} fit</Badge></CardHeader>{selectedItem && <CardContent><div className="selected-track"><div className="selected-cover" style={{ background: selectedItem.track.cover }}><span className="cover-noise" />{selectedItem.track.chartRank && <span className="selected-chart-rank">#{selectedItem.track.chartRank}</span>}</div><div><strong>{selectedItem.track.title}</strong><span>{selectedItem.track.artist}</span><small>Est. {selectedItem.track.bpm} BPM · {Math.round(selectedItem.track.energy * 100)}% energy · rating {selectedItem.track.contentRating}</small></div></div><div className="reason-list">{selectedItem.reasons.map((reason, index) => <div key={reason}><span>{index + 1}</span><p>{reason.split(' +')[0]}<small>+{reason.split(' +')[1]} points</small></p></div>)}</div><div className="explain-note"><Sparkles /><p><strong>Deterministic evidence</strong>These are the score components used when this metadata title won its slot.</p></div><div className="inspector-actions"><Button variant="secondary" size="sm" disabled={!active} onClick={() => void openAlternatives()}>See alternatives</Button><Button variant="ghost" size="sm" disabled={!active} onClick={() => void toggleHold()}><Pin className="size-3" />{selectedItem.held ? 'Release hold' : 'Hold track'}</Button></div></CardContent>}</Card>

          <Card className="sound-dna-card"><CardHeader><div><div className="section-kicker"><Zap />Editorial format targets</div><h3>Current, familiar, broadly adult.</h3></div><Badge variant="iris">profile v1</Badge></CardHeader><CardContent><p>{HOT_AC_PROFILE.statement}</p><div className="dna-bars">{[['Current music', 70, 'lime'], ['Momentum target', 72, 'aqua'], ['Familiarity target', 84, 'iris'], ['Discovery target', 8, 'coral']].map(([label, value, tone]) => <div key={label}><span><strong>{label}</strong><small>{value}%</small></span><Progress value={Number(value)} indicatorClassName={`bar-${tone}`} /></div>)}</div><a className="dna-link" href="https://www.americantop40.com/charts/hot-ac-243/latest/" target="_blank" rel="noreferrer">View chart source <ArrowRight /></a></CardContent></Card>

          <Card className="attention-card"><div className="attention-icon"><CircleAlert /></div><div><strong>Licensed masters still required</strong><p>This build schedules real titles as metadata. It does not claim audio, artwork or broadcast rights.</p></div><ChevronRight /></Card>
        </div>
      </section>

      <Dialog open={alternativesOpen} onOpenChange={setAlternativesOpen}><DialogContent className="alternatives-dialog"><DialogTitle>Ranked alternatives</DialogTitle><DialogDescription>Every option was revalidated against the full sequence, held slots and separation history.</DialogDescription><div className="alternative-list">{alternatives.map((alternative) => <button type="button" key={alternative.track.id} onClick={() => void replace(alternative.track.id)}><span className="alternative-cover" style={{ background: alternative.track.cover }} /><span><strong>{alternative.track.title}</strong><small>{alternative.track.artist} · {alternative.track.rotation}</small></span><Badge variant={alternative.scoreDelta >= 0 ? 'default' : 'neutral'}>{alternative.scoreDelta >= 0 ? '+' : ''}{alternative.scoreDelta}</Badge></button>)}{alternatives.length === 0 && <p className="empty-dialog">No safe alternatives were found without breaking a hold or separation rule.</p>}</div></DialogContent></Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}><DialogContent className="history-dialog"><DialogTitle>Schedule versions</DialogTitle><DialogDescription>Reflows, holds and replacements preserve prior schedules. Restoring creates a new revision.</DialogDescription><div className="revision-list">{snapshot?.revisions.map((revision) => <div key={revision.revision}><span><strong>Revision {revision.revision}</strong><small>{revision.changeKind}{revision.sourceRevision ? ` from r${revision.sourceRevision}` : ''} · {revision.itemCount} songs · score {revision.flowScore}</small></span><Badge variant={revision.state === 'approved' ? 'aqua' : 'neutral'}>{revision.state}</Badge><Button variant="ghost" size="sm" disabled={revision.revision === active?.revision} onClick={() => void restore(revision.revision)}><RotateCcw className="size-3" />Restore</Button></div>)}</div></DialogContent></Dialog>

      {notice && <div className="toast" role="status"><span className={cn('toast-icon', isComposing && 'is-working')}>{isComposing ? <RefreshCw /> : <Check />}</span><p>{notice}</p></div>}
    </div>
  )
}
