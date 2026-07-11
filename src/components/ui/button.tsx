import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent)] text-[#10130b] shadow-[0_8px_30px_rgba(202,255,90,.12)] hover:bg-[#d6ff7c] hover:-translate-y-px',
        secondary: 'border border-white/10 bg-white/[.06] text-[var(--foreground)] hover:border-white/20 hover:bg-white/[.1]',
        ghost: 'text-[var(--muted)] hover:bg-white/[.06] hover:text-[var(--foreground)]',
        danger: 'bg-[var(--coral)] text-white hover:bg-[#ff8a81]',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-5',
        icon: 'size-10 p-0',
        'icon-sm': 'size-8 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : 'button'
    return <Component ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  },
)
Button.displayName = 'Button'

export { buttonVariants }
