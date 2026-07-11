import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[.01em]', {
  variants: {
    variant: {
      default: 'border-[rgba(202,255,90,.18)] bg-[rgba(202,255,90,.09)] text-[var(--accent)]',
      neutral: 'border-white/10 bg-white/[.05] text-[var(--muted)]',
      iris: 'border-[rgba(166,139,255,.2)] bg-[rgba(166,139,255,.1)] text-[#b9a4ff]',
      aqua: 'border-[rgba(74,220,199,.2)] bg-[rgba(74,220,199,.1)] text-[var(--aqua)]',
      coral: 'border-[rgba(255,118,108,.2)] bg-[rgba(255,118,108,.1)] text-[var(--coral)]',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
