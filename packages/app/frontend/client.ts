// NOTE: バックエンドは極力importしない
import type { AppType } from '@routes'
import { hc } from 'hono/client'

export const client = hc<AppType>(window.location.origin, {
  init: { credentials: 'include' },
}).api
