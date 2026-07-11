interface CloudflareBindings {
  OPENROUTER_API_KEY?: string
}

declare namespace Cloudflare {
  interface Env {
    OPENROUTER_API_KEY?: string
  }
}
