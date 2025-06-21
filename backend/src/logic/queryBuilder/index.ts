import type { Buildable, Model } from './query'
import type { InsertionQuery } from './query/insert'
import type { SelectionQuery } from './query/select'

/**
 * データベースに対して行う操作
 * @template P 操作結果として得られるステートメントオブジェクトの型
 */
export interface Operation<P> {
  /** モデルとテーブル名を渡してアイテムを選択する */
  select<M extends Model>(
    model: M,
    tableName: string,
  ): Buildable<SelectionQuery<M>, P>

  /** 値を渡してアイテムを挿入する */
  insert<M extends Model>(
    model: M,
    tableName: string,
  ): Buildable<InsertionQuery<M>, P>
}
