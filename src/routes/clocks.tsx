import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Check, Clock3, Moon, ShieldCheck, Sun, Sunrise, Sunset, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { DEFAULT_SCHEDULE_REQUEST, HOT_AC_PROFILE } from '@/domain/scheduling/fixtures'
import { generateSchedule } from '@/domain/scheduling/engine'
import { formatExactDuration } from '@/lib/utils'

export const Route = createFileRoute('/clocks')({ component: ClocksPage })

const dayparts = [
  { name: 'Morning Current', time: '06:00–10:00', icon: Sunrise, tone: 'aqua', energy: 'Gentle lift' },
  { name: 'Lunch Reset', time: '10:00–15:00', icon: Sun, tone: 'lime', energy: 'Warm & familiar' },
  { name: 'Sunset Drive', time: '15:00–20:00', icon: Sunset, tone: 'coral', energy: 'Bright momentum' },
  { name: 'After Dark', time: '20:00–06:00', icon: Moon, tone: 'iris', energy: 'Deep discovery' },
]

const templateSchedule = generateSchedule(DEFAULT_SCHEDULE_REQUEST)
let elapsedMs = 0
const clockSlots = HOT_AC_PROFILE.rotationPattern.map((rotation, index) => {
  const item = templateSchedule.items[index]
  const slot = {
    minute: Math.floor(elapsedMs / 60_000),
    rotation,
    title: item?.track.title ?? 'Best eligible title',
    durationMs: item?.track.durationMs ?? 0,
  }
  elapsedMs += slot.durationMs
  return slot
})

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function ClocksPage() {
  return (
    <div className="clocks-page page-enter">
      <section className="page-heading compact"><div><Badge variant="aqua" className="mb-3"><Clock3 className="size-3" />Working format profile</Badge><h1>The shape of every window.</h1><p>This is the exact 12-position rotation pattern used by Conductor for the active 44-minute Hot AC music target. Durations remain planning estimates until licensed files are analyzed.</p></div><Button disabled>Fixed assets not connected</Button></section>
      <section className="daypart-strip">{dayparts.map((daypart) => { const Icon = daypart.icon; return <Card key={daypart.name} className={daypart.name === 'Sunset Drive' ? 'is-selected' : ''}><span className={`daypart-icon tone-${daypart.tone}`}><Icon /></span><div><strong>{daypart.name}</strong><small>{daypart.time}</small><p>{daypart.energy}</p></div>{daypart.name === 'Sunset Drive' && <Badge>Profile focus</Badge>}</Card> })}</section>

      <section className="clock-layout">
        <Card className="clock-builder">
          <CardHeader><div><div className="section-kicker"><Sunset />Working music template</div><h2>Sunset Drive · Window A</h2><p>12 music positions · no fixed events connected · Europe/Zurich strategy</p></div></CardHeader>
          <CardContent className="clock-builder-content">
            <div className="clock-face-wrap">
              <div className="clock-face">
                <div className="clock-ring" />
                {Array.from({ length: 12 }).map((_, index) => <span key={index} className="clock-number" style={{ transform: `rotate(${index * 30}deg) translateY(-136px) rotate(-${index * 30}deg)` }}>{index === 0 ? '00' : String(index * 5).padStart(2, '0')}</span>)}
                <div className="clock-center"><small>PLANNING TARGET</small><strong>44:00</strong><span><i className="status-dot" />Profile active</span></div>
              </div>
              <div className="clock-legend"><span><i className="power" />Power</span><span><i className="current" />Current</span><span><i className="recurrent" />Recurrent</span><span><i className="discovery" />Discovery</span><span><i className="gold" />Gold</span></div>
            </div>
            <div className="slot-stack"><div className="slot-stack-head"><span>{clockSlots.length} working music slots</span><Badge variant="neutral">Profile v1</Badge></div>{clockSlots.map((slot, index) => <div className="clock-slot" key={`${slot.rotation}-${index}`}><span className="slot-minute">:{String(slot.minute).padStart(2, '0')}</span><i className={`slot-kind ${slot.rotation}`} /><span><strong>{titleCase(slot.rotation)}</strong><small>Position {index + 1} · example: {slot.title}</small></span><span className="slot-length">~{formatExactDuration(slot.durationMs)}</span></div>)}</div>
          </CardContent>
          <div className="clock-health"><div><span><Check /></span><p><strong>Planning target is active</strong>The displayed order comes from the same profile used by the server scheduler. Fixed speech, IDs and commercials are not yet part of this window.</p></div><Button variant="ghost" size="sm" disabled>Fixed-event audit unavailable <ArrowRight className="size-3.5" /></Button></div>
        </Card>

        <div className="clock-rail">
          <Card className="guardrail-card"><CardHeader><div><div className="section-kicker"><ShieldCheck />Policy status</div><h3>Engine constraints</h3></div><Badge variant="aqua">3 active</Badge></CardHeader><CardContent>{[
            ['unique', 'Track uniqueness', 'No title repeats in the window', true],
            ['rest', 'Artist and title rest', '90m artist · 240m title', true],
            ['explicit', 'Known-explicit filter', 'Unknown master ratings stay flagged', true],
            ['anchors', 'Exact fixed anchors', 'Requires connected fixed assets', false],
          ].map(([key, title, detail, enabled]) => <div className="rule-row" key={String(key)}><span><strong>{title}</strong><small>{detail}</small></span><Switch checked={Boolean(enabled)} disabled /></div>)}</CardContent></Card>
          <Card className="inference-card"><span className="inference-icon"><Zap /></span><h3>Audience learning is waiting.</h3><p>Connect reconciled play and listening history before Cadessa makes claims about retention or automatically changes the format.</p><Button variant="secondary" size="sm" disabled>History not connected</Button></Card>
        </div>
      </section>
    </div>
  )
}
