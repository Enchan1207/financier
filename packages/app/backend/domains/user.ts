import type { Brand } from '../lib/brand'

/** ユーザID (システム内部のユーザ識別子) */
export type UserId = Brand<string, 'UserId'>

/** IdP Subject (認証プロバイダから発行されるユーザ識別子) */
export type IdPSubject = Brand<string, 'IdPSubject'>

/** ユーザドメインモデル */
export type User = {
  readonly id: UserId
  readonly idpSubject: IdPSubject
}
