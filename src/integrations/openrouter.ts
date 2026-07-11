import { z } from 'zod'

const explanationSchema = z.object({
  headline: z.string().min(1).max(90),
  explanation: z.string().min(1).max(420),
  confidence: z.number().min(0).max(1),
})

export type AiSafeProvenance = 'user-authored' | 'owned-metadata' | 'cadessa-generated'

interface ExplainOptions {
  apiKey: string
  model: string
  evidence: Record<string, unknown>
  provenance: AiSafeProvenance
  fetch?: typeof globalThis.fetch
}

export async function explainWithOpenRouter(options: ExplainOptions) {
  const fetcher = options.fetch ?? globalThis.fetch
  const response = await fetcher('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://cadessa.app',
      'X-Title': 'Cadessa',
    },
    body: JSON.stringify({
      model: options.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'Explain the supplied deterministic music-scheduling evidence. Do not select, reorder, or invent tracks. Return JSON with headline, explanation, and confidence.' },
        { role: 'user', content: JSON.stringify({ provenance: options.provenance, evidence: options.evidence }) },
      ],
      response_format: { type: 'json_object' },
    }),
  })
  if (!response.ok) throw new Error(`OpenRouter explanation failed with ${response.status}`)
  const body = await response.json<{ choices?: Array<{ message?: { content?: string } }> }>()
  const content = body.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenRouter returned no explanation content')
  return explanationSchema.parse(JSON.parse(content))
}
