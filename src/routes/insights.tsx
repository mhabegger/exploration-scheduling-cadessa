import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowRight, Gem, Info, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { DEFAULT_SCHEDULE_REQUEST, HOT_AC_TRACKS, HOT_AC_PROFILE } from '@/domain/scheduling/fixtures'
import { generateSchedule } from '@/domain/scheduling/engine'
import type { StudioSnapshot } from '@/domain/studio/types'

export const Route = createFileRoute('/insights')({ component: InsightsPage })

const fallbackSchedule = generateSchedule(DEFAULT_SCHEDULE_REQUEST)

function EnergyChart({ values }: { values: number[] }) {
  const points = values.map((value, index) => ({ x: values.length === 1 ? 350 : index / (values.length - 1) * 700, y: 175 - value * 155 }))
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ')
  const area = points.length > 0 ? `0,190 ${polyline} 700,190` : ''
  return <svg className="week-chart" viewBox="0 0 700 190" preserveAspectRatio="none" role="img" aria-label="Estimated energy by position in the active schedule"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#caff5a" stopOpacity=".24" /><stop offset="1" stopColor="#caff5a" stopOpacity="0" /></linearGradient></defs>{[35, 75, 115, 155].map((y) => <line key={y} x1="0" x2="700" y1={y} y2={y} stroke="rgba(255,255,255,.055)" />)}<polygon points={area} fill="url(#chart-fill)" /><polyline points={polyline} fill="none" stroke="#caff5a" strokeWidth="2.3" vectorEffect="non-scaling-stroke" />{points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="4" fill="#11130f" stroke="#caff5a" strokeWidth="2" vectorEffect="non-scaling-stroke" />)}</svg>
}

function InsightsPage() {
  const [snapshot, setSnapshot] = useState<StudioSnapshot | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  useEffect(() => { void fetch('/api/studio/pulse-965').then(async (response) => { if (!response.ok) throw new Error('Studio unavailable'); setSnapshot(await response.json()) }).catch(() => setLoadFailed(true)) }, [])
  const schedule = snapshot?.active.schedule ?? fallbackSchedule
  const rotationRows = (['power', 'current', 'recurrent', 'gold', 'discovery'] as const).map((rotation, index) => {
    const actual = schedule.items.filter((item) => item.track.rotation === rotation).length
    const target = HOT_AC_PROFILE.rotationPattern.filter((item) => item === rotation).length
    return [rotation[0]?.toUpperCase() + rotation.slice(1), Math.min(100, Math.round(actual / Math.max(1, target) * 100)), ['lime', 'aqua', 'iris', 'coral', 'aqua'][index], `${actual}/${target} slots`] as const
  })
  const eraShares = (['2020s', '2010s', '2000s', '90s'] as const).map((era) => Math.round(schedule.items.filter((item) => item.track.era === era).length / Math.max(1, schedule.items.length) * 100))
  return <div className="insights-page page-enter">
    <section className="page-heading compact"><div><Badge variant={snapshot ? 'default' : loadFailed ? 'coral' : 'neutral'} className="mb-3"><TrendingUp className="size-3" />{snapshot ? `Active revision ${snapshot.active.revision}` : loadFailed ? 'Local fallback preview' : 'Loading active revision'}</Badge><h1>Schedule health you can verify.</h1><p>{snapshot ? 'These measures are calculated from the persisted schedule.' : 'Preview measures come from the local deterministic fixture until the coordinator responds.'} Audience claims remain unavailable until real play and listener history is connected.</p></div><Button asChild variant="secondary"><a href="/api/studio/pulse-965?format=json">Download revision data</a></Button></section>
    <section className="insight-hero-grid">
      <Card className="flow-health-card"><div className="score-orbit"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" /><circle className="score-ring" cx="60" cy="60" r="50" /></svg><span><strong>{schedule.flowScore}</strong><small>Flow score</small></span></div><div><Badge><Sparkles className="size-3" />Deterministic</Badge><h2>The {snapshot ? 'active revision' : 'local preview'} passes its scheduling invariants.</h2><p>Flow combines rotation fit, estimated energy direction, transition shape, planning-duration fit and diversity. It is not a listener-rating prediction.</p><div className="score-deltas"><span><strong>{schedule.health.energyMatch}%</strong> estimated energy match</span><span><strong>{schedule.health.hardBreaks}</strong> hard breaks</span><span><strong>{schedule.health.durationFit}%</strong> planning-duration fit</span></div></div></Card>
      <Card className="audience-signal-card"><CardHeader><div><div className="section-kicker"><Zap />Awaiting play history</div><h3>Listener signal not connected</h3></div><Info className="size-4 text-[var(--subtle)]" /></CardHeader><CardContent><strong className="signal-value">—</strong><p>Connect playout reconciliation or playlist analytics before Cadessa claims an audience effect.</p><div className="signal-sequence"><span style={{ background: HOT_AC_TRACKS[2]?.cover }} /><ArrowRight /><span style={{ background: HOT_AC_TRACKS[9]?.cover }} /></div><Button variant="ghost" size="sm" disabled>Evidence unavailable</Button></CardContent></Card>
    </section>
    <section className="insight-grid">
      <Card className="trend-card"><CardHeader><div><div className="section-kicker">{snapshot ? 'Current revision' : 'Local preview'}</div><h3>Estimated programmed energy</h3></div><Badge variant="aqua">{schedule.health.energyMatch}% target match</Badge></CardHeader><CardContent><EnergyChart values={schedule.items.map((item) => item.track.energy)} /><div className="chart-labels"><span>Slot 1</span><span>Slot 3</span><span>Slot 6</span><span>Slot 9</span><span>Slot {schedule.items.length}</span></div></CardContent></Card>
      <Card className="balance-card"><CardHeader><div><div className="section-kicker">Rotation health</div><h3>Clock attainment</h3></div><Badge variant="neutral">Saved revision</Badge></CardHeader><CardContent>{rotationRows.map(([label,value,tone,detail]) => <div className="balance-row" key={label}><span><strong>{label}</strong><small>{detail}</small></span><Progress value={Number(value)} indicatorClassName={`bar-${tone}`} /><b>{value}</b></div>)}</CardContent></Card>
      <Card className="era-card"><CardHeader><div><div className="section-kicker">Era balance</div><h3>Actual scheduled mix</h3></div></CardHeader><CardContent><div className="era-donut" style={{ background: `conic-gradient(var(--accent) 0 ${eraShares[0]}%,var(--aqua) ${eraShares[0]}% ${eraShares[0] + eraShares[1]}%,var(--iris) ${eraShares[0] + eraShares[1]}% ${eraShares[0] + eraShares[1] + eraShares[2]}%,var(--coral) ${eraShares[0] + eraShares[1] + eraShares[2]}% 100%)` }}><div><strong>{eraShares[0]}%</strong><span>2020s</span></div></div><div className="era-legend">{[['2020s',`${eraShares[0]}%`,'lime'],['2010s',`${eraShares[1]}%`,'aqua'],['2000s',`${eraShares[2]}%`,'iris'],['90s',`${eraShares[3]}%`,'coral']].map(([era,value,tone]) => <span key={era}><i className={`bar-${tone}`} /><strong>{era}</strong><small>{value}</small></span>)}</div></CardContent></Card>
      <Card className="gems-card"><CardHeader><div><div className="section-kicker"><Gem />Editorial opportunities</div><h3>Discovery titles ready to test</h3></div><Badge variant="iris">{HOT_AC_TRACKS.filter((track) => track.rotation === 'discovery').length} found</Badge></CardHeader><CardContent>{HOT_AC_TRACKS.filter((track) => track.rotation === 'discovery').slice(0,3).map((track) => <div className="gem-row" key={track.id}><span style={{ background: track.cover }} /><p><strong>{track.title}</strong><small>{track.artist} · editorial test rotation</small></p><Badge variant="neutral">test</Badge></div>)}<Button variant="ghost" size="sm" className="w-full" disabled>Requires local play history</Button></CardContent></Card>
    </section>
  </div>
}
