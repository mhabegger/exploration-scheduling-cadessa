import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Check, ChevronRight, CirclePlay, Clock3, Eye, Headphones, Radio, ShieldCheck, Sparkles, Unplug, WandSparkles, Waves } from 'lucide-react'
import { LogoMark, Wordmark } from '@/components/brand/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HOT_AC_TRACKS } from '@/domain/scheduling/fixtures'

export const Route = createFileRoute('/introduction')({
  head: () => ({
    meta: [
      { title: 'Meet Cadessa — Autonomous music programming' },
      { name: 'description', content: 'Cadessa composes explainable music schedules, preserves every revision, and prepares provider-ready exports.' },
    ],
  }),
  component: IntroductionPage,
})

function IntroductionPage() {
  return <div className="intro-page">
    <header className="intro-nav">
      <Link to="/introduction" aria-label="Cadessa introduction"><Wordmark /></Link>
      <nav><a href="#how">How it works</a><a href="#formats">Every format</a><a href="#architecture">Architecture</a></nav>
      <Button asChild size="sm"><Link to="/">Open the studio <ArrowRight className="size-3.5" /></Link></Button>
    </header>

    <main>
      <section className="intro-hero">
        <div className="hero-glow" />
        <div className="intro-hero-copy">
          <Badge><Sparkles className="size-3" />Autonomous music programming</Badge>
          <h1>Every track,<br /><em>right on cue.</em></h1>
          <p>Cadessa turns a music strategy into explainable schedules, preserves every revision, and prepares clean playlist or broadcast exports—without spreadsheet work.</p>
          <div className="intro-hero-actions"><Button asChild size="lg"><Link to="/">Open the studio <ArrowRight className="size-4" /></Link></Button><a href="#how"><CirclePlay />See how a schedule comes together</a></div>
          <div className="trust-line"><span><Check />Deterministic</span><span><Check />Every choice explained</span><span><Check />Built for professionals</span></div>
        </div>

        <div className="intro-product-frame">
          <div className="frame-top"><span><i /><i /><i /></span><small>cadessa.app / flow</small><Badge><i className="status-dot" />Saved</Badge></div>
          <div className="frame-body">
            <aside><LogoMark /><span /><span /><span /><span /><span /></aside>
            <div className="frame-content">
              <div className="frame-heading"><span><small>WORKING HOT AC SCHEDULE</small><strong>Your music window is saved.</strong></span><i /></div>
              <div className="frame-metrics"><span><small>FLOW SCORE</small><strong>84</strong></span><span><small>REVISION</small><strong>r3</strong></span><span><small>BREAKS</small><strong>0</strong></span></div>
              <div className="frame-flow">
                <div className="mock-energy"><svg viewBox="0 0 400 70" preserveAspectRatio="none"><path d="M0 50 C55 44,70 31,115 39 S190 22,230 30 S305 11,400 21" fill="none" stroke="#caff5a" strokeWidth="2" /><path d="M0 50 C55 44,70 31,115 39 S190 22,230 30 S305 11,400 21 L400 70 L0 70Z" fill="url(#intro-chart)" /><defs><linearGradient id="intro-chart" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#caff5a" stopOpacity=".22" /><stop offset="1" stopColor="#caff5a" stopOpacity="0" /></linearGradient></defs></svg></div>
                {HOT_AC_TRACKS.slice(0, 4).map((track, index) => <div className="mock-track" key={track.id}><small>{`1${8 + index}:0${index * 3}`}</small><i style={{ background: track.cover }} /><span><strong>{track.title}</strong><small>{track.artist}</small></span><b>{Math.round(track.energy * 100)}</b></div>)}
              </div>
            </div>
          </div>
          <div className="floating-proof top"><ShieldCheck /><span><strong>3 active guardrails</strong><small>No hard breaks</small></span></div>
          <div className="floating-proof bottom"><WandSparkles /><span><strong>Why this track?</strong><small>Every decision has evidence</small></span></div>
        </div>
      </section>

      <section className="intro-statement"><p>Human taste. <span>Machine patience.</span></p><h2>The repetition disappears.<br />The musical judgment stays visible.</h2></section>

      <section id="how" className="intro-how">
        <div className="intro-section-heading"><Badge variant="neutral">Connect → Decode → Compose → Audit → Deliver</Badge><h2>A validated music window in seconds.</h2><p>The working studio schedules a real Hot AC catalog now. Connect licensed audio and destination credentials later to extend the same revision-safe workflow through delivery.</p></div>
        <div className="how-grid">{[
          [Headphones, '01', 'It models your format', 'A versioned strategy captures energy, eras, rotations, dayparts and the character that makes your channel yours. The included Hot AC profile works immediately.'],
          [WandSparkles, '02', 'It composes, not shuffles', 'Conductor builds intentional journeys around timing, rotation, separation and transition quality—with deterministic results you can replay.'],
          [Eye, '03', 'It earns your trust', 'Every choice carries plain-language evidence. Every version is reversible. Hard rules are never broken quietly.'],
        ].map(([Icon, number, title, copy]) => { const FeatureIcon = Icon as typeof Headphones; return <article key={String(number)}><span className="how-number">{String(number)}</span><div className="how-icon"><FeatureIcon /></div><h3>{String(title)}</h3><p>{String(copy)}</p><a href="#architecture">See the system <ChevronRight /></a></article> })}</div>
      </section>

      <section id="formats" className="format-section">
        <div className="format-copy"><Badge variant="iris">One creative strategy</Badge><h2>Structured for radio.<br />Fluid for streaming.</h2><p>A Channel can be a continuous station, a recurring show, or a living playlist. The current workflow shares one revision model while credential-backed delivery remains purpose-built.</p><ul><li><Clock3 /><span><strong>Linear broadcast</strong>Timed music windows and metadata logs now; fixed anchors and playout delivery connect next.</span></li><li><Waves /><span><strong>Streaming playlists</strong>Intentional arcs and provider-ready exports now; authorized publishing connects next.</span></li><li><Radio /><span><strong>Produced shows</strong>Revision-safe schedules today, with fixed segments available when their assets are supplied.</span></li></ul></div>
        <div className="format-visual"><div className="format-orbit"><div className="orbit-center"><LogoMark /><strong>Sound DNA</strong><small>One identity</small></div><span className="orbit-item item-radio"><Radio /><small>Radio</small></span><span className="orbit-item item-playlist"><Waves /><small>Playlists</small></span><span className="orbit-item item-show"><Headphones /><small>Shows</small></span><i className="orbit orbit-one" /><i className="orbit orbit-two" /></div></div>
      </section>

      <section id="architecture" className="intro-architecture">
        <div className="intro-section-heading"><Badge variant="aqua">Production-shaped from day one</Badge><h2>Fast at the edge. Patient in the background.</h2><p>Cloudflare Durable Objects persist the working revisions and advance long scheduling runs in safe, idempotent chunks. PlanetScale becomes the multi-workspace record once connected.</p></div>
        <div className="arch-diagram"><div className="arch-node primary"><LogoMark /><span><strong>TanStack Start</strong><small>React studio + Worker API</small></span></div><i /><div className="arch-core"><span><WandSparkles /><strong>Conductor</strong><small>Deterministic scheduler</small></span><span><Clock3 /><strong>Durable Objects</strong><small>Chunked jobs + alarms</small></span></div><i /><div className="arch-destinations"><span><ShieldCheck /><strong>PlanetScale</strong><small>Postgres via Hyperdrive</small></span><span><Unplug /><strong>Destinations</strong><small>Playlist + playout adapters</small></span><span><Headphones /><strong>Cloudflare R2</strong><small>Owned audio only</small></span></div></div>
        <p className="architecture-note"><ShieldCheck />Provider content remains capability-isolated. OpenRouter interprets allowed user-authored intent and explanations—it never chooses the final order or receives restricted streaming content.</p>
      </section>

      <section className="intro-final"><div><Badge><Sparkles className="size-3" />Your first schedule is already waiting</Badge><h2>Let the system carry the repetition.<br />Keep the part that sounds like you.</h2><Button asChild size="lg"><Link to="/">Enter Cadessa <ArrowRight className="size-4" /></Link></Button></div></section>
    </main>
    <footer className="intro-footer"><Wordmark /><p>Autonomous music programming for people who care what plays next.</p><span>Working preview · 2026</span></footer>
  </div>
}
