// Worker env
interface Env {
  readonly D1: D1Database
}

declare namespace NodeJS {
  interface ProcessEnv {
    readonly CLOUDFLARE_ACCOUNT_ID: string
    readonly CLOUDFLARE_API_TOKEN: string
  }
}
