import type { Brand } from '../lib/brand'

/** ユーザID (システム内部のユーザ識別子) */
export type UserId = Brand<string, 'UserId'>

/** ユーザドメインモデル */
export type User = {
  readonly id: UserId
  readonly idpSubject: string
}
