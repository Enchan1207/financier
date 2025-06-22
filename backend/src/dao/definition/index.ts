import type { Definition } from '@/domains/definition'
import type { Timestamp } from '@/domains/schema'
import type { User } from '@/domains/user'

export interface DefinitionDao {
  /** 新しい定義を挿入する */
  insertDefinition(definition: Definition): Promise<Definition>

  /** IDを指定して定義を取得する */
  getDefinitionById(props: {
    id: Definition['id']
    userId: User['id']
  }): Promise<Definition | undefined>

  /** 定義の一覧を取得する */
  listDefinitions(props: {
    userId: User['id']
    sortBy: 'enabledAt' | 'updatedAt'
    limit: number
    offset?: number
  }): Promise<Definition[]>

  /** その日時を期間に含む定義の一覧を取得する */
  findDefinitionsByDate(props: {
    userId: User['id']
    at: Timestamp
  }): Promise<Definition[]>

  /** 定義名を更新する */
  updateDefinitionName(props: {
    id: Definition['id']
    userId: User['id']
    name: string
  }): Promise<Definition | undefined>

  /** 定義の有効期間を更新する */
  updateDefinitionPeriod(props: {
    id: Definition['id']
    userId: User['id']
    enabledAt: Definition['enabledAt']
    disabledAt: Definition['disabledAt']
  }): Promise<Definition | undefined>

  /**
   * 定義を削除する
   * @warning 紐付いている実績が存在する場合は削除に失敗します。
   */
  deleteDefinition(props: {
    id: Definition['id']
    userId: User['id']
  }): Promise<Definition | undefined>
}
