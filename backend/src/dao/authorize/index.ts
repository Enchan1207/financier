import type { Auth0UserInfo, User } from '@/domains/user'

export interface AuthorizeDao {
  /** idでユーザを取得する */
  getUserById(id: User['id']): Promise<User | undefined>

  /** Auth0のidでユーザを検索する */
  findUserByAuth0Id(id: string): Promise<User | undefined>

  /** ユーザ情報を挿入または上書きする */
  saveUser(newUser: User): Promise<User>

  /** ユーザ情報取得関数を構成する */
  fetchUserInfo(
    authDomain: string,
  ): (token: string) => Promise<Auth0UserInfo | undefined>
}
