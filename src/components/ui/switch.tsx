import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root className={cn('group inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/10 bg-white/10 p-0.5 outline-none transition-colors data-[state=checked]:bg-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]', className)} {...props}>
      <SwitchPrimitive.Thumb className="block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5 data-[state=checked]:bg-[#13150d]" />
    </SwitchPrimitive.Root>
  )
}
