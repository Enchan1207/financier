import type { Buildable, Model } from './query'
import type { DeletionQuery } from './query/delete'
import type { InsertionQuery } from './query/insert'
import type { SelectionQuery } from './query/select'
import type { UpdateQuery } from './query/update'

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

  /** アイテムを削除する */
  delete<M extends Model>(model: M, tableName: string): DeletionQuery<M, P>

  /** アイテムを更新する */
  update<M extends Model>(model: M, tableName: string): UpdateQuery<M, P>
}
