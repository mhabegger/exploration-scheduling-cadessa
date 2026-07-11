import { z } from 'zod'

export const studioActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('generate'),
    seed: z.string().min(1).max(160).optional(),
    startAt: z.iso.datetime().optional(),
  }),
  z.object({
    action: z.literal('hold'),
    position: z.number().int().min(0).max(100),
    trackId: z.string().min(1).max(180),
  }),
  z.object({
    action: z.literal('alternatives'),
    position: z.number().int().min(0).max(100),
  }),
  z.object({
    action: z.literal('replace'),
    position: z.number().int().min(0).max(100),
    trackId: z.string().min(1).max(180),
  }),
  z.object({ action: z.literal('approve') }),
  z.object({
    action: z.literal('restore'),
    revision: z.number().int().positive(),
  }),
])

export type StudioAction = z.infer<typeof studioActionSchema>
