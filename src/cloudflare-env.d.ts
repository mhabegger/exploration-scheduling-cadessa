interface CloudflareBindings {
  HYPERDRIVE?: Hyperdrive
  OPENROUTER_API_KEY?: string
}

declare namespace Cloudflare {
  interface Env {
    HYPERDRIVE?: Hyperdrive
    OPENROUTER_API_KEY?: string
  }
}
