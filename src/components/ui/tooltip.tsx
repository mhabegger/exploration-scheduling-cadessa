import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export function TooltipContent({ className, sideOffset = 8, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content sideOffset={sideOffset} className={cn('z-50 rounded-lg border border-white/10 bg-[#20222b] px-3 py-2 text-xs text-white shadow-2xl animate-in fade-in-0 zoom-in-95', className)} {...props} />
    </TooltipPrimitive.Portal>
  )
}
