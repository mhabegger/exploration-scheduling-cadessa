import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AudioLines,
  Bell,
  BookOpen,
  ChevronDown,
  CircleGauge,
  Clock3,
  Command,
  LibraryBig,
  Radio,
  Search,
  Settings2,
  Sparkles,
  Unplug,
  X,
} from 'lucide-react'
import { Wordmark } from '@/components/brand/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const navigation = [
  { to: '/', label: 'Flow', icon: AudioLines },
  { to: '/library', label: 'Library', icon: LibraryBig },
  { to: '/clocks', label: 'Clocks', icon: Clock3 },
  { to: '/insights', label: 'Insights', icon: CircleGauge },
  { to: '/destinations', label: 'Destinations', icon: Unplug },
] as const

export function AppShell({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [query, setQuery] = useState('')
  const location = useLocation()

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const filteredNavigation = useMemo(() => navigation.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())), [query])

  return (
    <TooltipProvider delayDuration={250}>
      <div className="app-shell">
        <aside className="sidebar">
          <Link to="/" className="sidebar-logo" aria-label="Cadessa home"><Wordmark /></Link>
          <nav className="sidebar-nav" aria-label="Main navigation">
            <p className="nav-eyebrow">Studio</p>
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.to} to={item.to} activeOptions={{ exact: item.to === '/' }} className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
                  <Icon className="size-[18px]" />
                  <span>{item.label}</span>
                  {item.label === 'Library' && <span className="ml-auto text-[10px] tabular-nums text-[var(--subtle)]">60</span>}
                </Link>
              )
            })}
          </nav>

          <div className="sidebar-bottom">
            <div className="autopilot-mini">
              <div className="flex items-center gap-2 text-xs font-semibold"><span className="status-dot" />Durable channel configured</div>
              <p>Flow confirms runtime status</p>
              <div className="mini-meter"><span /></div>
            </div>
            <div className="profile-chip">
              <span className="avatar">MK</span>
              <span className="min-w-0 text-left"><strong>Maya Keller</strong><small>Music director</small></span>
              <Settings2 className="ml-auto size-4 text-[var(--subtle)]" />
            </div>
          </div>
        </aside>

        <div className="app-main">
          <header className="topbar">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="channel-switcher" type="button">
                  <span className="channel-avatar"><Radio className="size-4" /></span>
                  <span><small>Channel</small><strong>Pulse 96.5</strong></span>
                  <Badge className="ml-1">Hot AC</Badge>
                  <ChevronDown className="ml-1 size-4 text-[var(--subtle)]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--subtle)]">Your channels</p>
                <DropdownMenuItem><span className="channel-menu-dot bg-[var(--accent)]" /><span><strong className="block">Pulse 96.5</strong><small className="text-[var(--muted)]">Hot AC · Durable Object channel</small></span><span className="ml-auto text-[var(--accent)]">✓</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled><Sparkles className="size-4" />Cloud persistence required for more channels</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="topbar-actions">
              <button className="command-trigger" type="button" onClick={() => setCommandOpen(true)}>
                <Search className="size-4" /><span>Find anything</span><kbd><Command className="size-3" />K</kbd>
              </button>
              <Tooltip>
                <TooltipTrigger asChild><span className="relative grid size-10 place-items-center text-[var(--muted)]" aria-label="Connection notice"><Bell className="size-[18px]" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[var(--coral)]" /></span></TooltipTrigger>
                <TooltipContent>Licensed audio is not connected yet</TooltipContent>
              </Tooltip>
              <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex"><Link to="/introduction"><BookOpen className="size-3.5" />How it works</Link></Button>
            </div>
          </header>

          <main className="page-canvas" key={location.pathname}>{children}</main>
        </div>

        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navigation.slice(0, 5).map((item) => {
            const Icon = item.icon
            return <Link key={item.to} to={item.to} activeOptions={{ exact: item.to === '/' }} className="mobile-nav-link" activeProps={{ className: 'mobile-nav-link is-active' }}><Icon /><span>{item.label}</span></Link>
          })}
        </nav>

        <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
          <DialogContent aria-describedby="command-description" className="overflow-hidden p-0">
            <DialogTitle className="sr-only">Search Cadessa</DialogTitle>
            <DialogDescription id="command-description" className="sr-only">Search pages and actions in your music studio.</DialogDescription>
            <div className="command-input"><Search className="size-5" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jump to a page or ask Cadessa…" /><button type="button" onClick={() => setCommandOpen(false)}><X className="size-4" /></button></div>
            <div className="command-results">
              <p>Navigate</p>
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                return <Link key={item.to} to={item.to} onClick={() => setCommandOpen(false)}><Icon className="size-4" /><span>{item.label}</span><small>Open</small></Link>
              })}
              <p>Working shortcuts</p>
              <Link to="/" onClick={() => setCommandOpen(false)}><AudioLines className="size-4" /><span>Open Flow to reflow the active window</span><small>Open</small></Link>
              <Link to="/library" onClick={() => setCommandOpen(false)}><LibraryBig className="size-4" /><span>Show titles missing broadcast masters</span><small>Open</small></Link>
              <Link to="/insights" onClick={() => setCommandOpen(false)}><CircleGauge className="size-4" /><span>Inspect the active revision score</span><small>Open</small></Link>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
