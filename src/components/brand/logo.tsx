import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn('logo-mark', className)} aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none">
        <path d="M26.8 9.8c-2.2-2-5.1-3.2-8.3-3.2C11.7 6.6 6.2 11.8 6.2 18.2c0 6.3 5.5 11.5 12.3 11.5 3.2 0 6.1-1.2 8.3-3.2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M24.1 14.1c-1.3-1-3-1.7-4.8-1.7-3.5 0-6.3 2.6-6.3 5.8 0 3.1 2.8 5.7 6.3 5.7 1.8 0 3.5-.6 4.8-1.7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".72" />
        <circle cx="27.8" cy="18.2" r="2.2" fill="currentColor" />
      </svg>
    </span>
  )
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return <span className="inline-flex items-center gap-2.5"><LogoMark /><span className={cn('text-[17px] font-semibold tracking-[-.03em]', compact && 'sr-only')}>cadessa</span></span>
}
