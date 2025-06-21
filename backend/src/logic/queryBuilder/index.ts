import type { Buildable, Model } from './query'
import type { InsertionQuery } from './query/insert'
import type { SelectionQuery } from './query/select'

/**
 * データベースに対して行う操作
 * @template P 操作結果として得られるステートメントオブジェクトの型
 */
export interface Operation<P> {
  /** アイテムを選択する */
  select<M extends Model>(
    model: M,
    tableName: string,
  ): Buildable<SelectionQuery<M>, P>

  /** アイテムを挿入する */
  insert<M extends Model>(model: M, tableName: string): InsertionQuery<M, P>
}
