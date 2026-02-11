import type { Brand } from '../lib/brand'
import type { UserId } from './user'

/** 投稿ID */
export type PostId = Brand<string, 'PostId'>

/** 投稿ドメインモデル */
export type Post = {
  readonly id: PostId
  readonly userId: UserId
  readonly title: string
  readonly content: string
}
