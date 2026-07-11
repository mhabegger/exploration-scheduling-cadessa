import { z } from 'zod'

const scopeSchema = z.object({
  channelId: z.string().optional(),
  daypart: z.string().optional(),
  provider: z.enum(['spotify', 'deezer', 'broadcast', 'demo']).optional(),
  territory: z.string().optional(),
})

const policyBase = {
  id: z.string(),
  label: z.string(),
  severity: z.enum(['invariant', 'required', 'strong', 'preference']),
  scope: scopeSchema.optional(),
  weight: z.number().min(0).max(100).default(50),
}

export const policySchema = z.discriminatedUnion('type', [
  z.object({
    ...policyBase,
    type: z.literal('artist-separation'),
    params: z.object({ minutes: z.number().int().positive() }),
  }),
  z.object({
    ...policyBase,
    type: z.literal('explicit-window'),
    params: z.object({ allowed: z.boolean(), startHour: z.number().int().min(0).max(23), endHour: z.number().int().min(0).max(23) }),
  }),
  z.object({
    ...policyBase,
    type: z.literal('target-share'),
    params: z.object({ field: z.enum(['era', 'rotation', 'language']), value: z.string(), share: z.number().min(0).max(1) }),
  }),
  z.object({
    ...policyBase,
    type: z.literal('energy-curve'),
    params: z.object({ points: z.array(z.number().min(0).max(1)).min(2) }),
  }),
])

export type SchedulingPolicy = z.infer<typeof policySchema>
