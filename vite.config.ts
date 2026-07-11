import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const hyperdriveId = process.env.HYPERDRIVE_ID?.trim()
const validHyperdriveId = Boolean(hyperdriveId && /^[a-f0-9]{32}$/i.test(hyperdriveId))
const placeholderHyperdriveId = hyperdriveId === '00000000000000000000000000000000'

if (hyperdriveId && !validHyperdriveId) {
  throw new Error('HYPERDRIVE_ID must be the 32-character Cloudflare Hyperdrive configuration ID.')
}

if (process.env.WORKERS_CI === '1' && (!validHyperdriveId || placeholderHyperdriveId)) {
  throw new Error('Workers Builds requires the HYPERDRIVE_ID build variable. Copy the configuration ID from Cloudflare Hyperdrive.')
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflare({
      viteEnvironment: { name: 'ssr' },
      ...(validHyperdriveId ? {
        config: {
          hyperdrive: [{ binding: 'HYPERDRIVE', id: hyperdriveId as string }],
        },
      } : {}),
    }),
    tanstackStart(),
    tailwindcss(),
    viteReact(),
  ],
})

export default config
