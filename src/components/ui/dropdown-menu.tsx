import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({ className, sideOffset = 8, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content sideOffset={sideOffset} className={cn('z-50 min-w-56 rounded-xl border border-white/10 bg-[#1b1d26] p-1.5 text-sm text-[var(--foreground)] shadow-2xl outline-none', className)} {...props} />
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return <DropdownMenuPrimitive.Item className={cn('flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2.5 outline-none transition data-[highlighted]:bg-white/[.07]', className)} {...props} />
}

export function DropdownMenuCheckboxItem({ className, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem className={cn('relative flex cursor-pointer select-none items-center rounded-lg py-2.5 pl-9 pr-3 outline-none transition data-[highlighted]:bg-white/[.07]', className)} {...props}>
      <span className="absolute left-3 flex size-4 items-center justify-center"><DropdownMenuPrimitive.ItemIndicator><Check className="size-3.5 text-[var(--accent)]" /></DropdownMenuPrimitive.ItemIndicator></span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

export const DropdownMenuSeparator = (props: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) => <DropdownMenuPrimitive.Separator className="my-1 h-px bg-white/[.07]" {...props} />
