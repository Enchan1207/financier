import type { Brand } from '@backend/lib/brand'
import { ulid } from 'ulid'

import type { CategoryId } from './category'

export type EventTemplateId = Brand<string, 'event_template_id'>

export type TemplateTransaction = {
  /** 対象カテゴリ。status=active かつ積立定義非紐付けのカテゴリのみ指定可 */
  categoryId: CategoryId
  /** 金額（日本円） */
  amount: number
  /** 取引を説明する名称 */
  name: string
}

export type EventTemplate = {
  id: EventTemplateId
  /** テンプレート名 */
  name: string
  /** デフォルトの取引定義一覧。イベント作成時に一括登録される */
  defaultTransactions: TemplateTransaction[]
}

export const createEventTemplate = (
  props: Omit<EventTemplate, 'id'>,
): EventTemplate => ({
  id: ulid() as EventTemplateId,
  ...props,
})
