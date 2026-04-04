import type { CategoryId } from '@backend/domains/category'
import type { UserId } from '@backend/domains/user'
import { createUser } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import { categoriesTable } from '@backend/schemas/categories'
import { transactionsTable } from '@backend/schemas/transactions'
import { usersTable } from '@backend/schemas/users'
import { Result } from '@praha/byethrow'
import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import { ulid } from 'ulid'

import {
  CategoryNotFoundException,
  CategoryRelationException,
} from './exceptions'
import { deleteCategory } from './repository'

describe('deleteCategory', () => {
  const db = drizzle(env.D1)

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs('2022-11-01T18:05:00Z').toDate())
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  const setupUser = async (): Promise<UserId> => {
    const user = createUser({
      email: 'test@example.com',
      idpIssuer: 'https://tenant.region.auth0.com/',
      idpSubject: `auth0|${ulid()}`,
    })
    await db.insert(usersTable).values({
      id: user.id,
      email: user.email,
      idp_iss: user.idpIssuer,
      idp_sub: user.idpSubject,
    })
    return user.id
  }

  describe('正常系 - カテゴリを削除できる', () => {
    const categoryId = 'test-cat-repo-del-00000001' as CategoryId
    let result: Awaited<ReturnType<ReturnType<typeof deleteCategory>>>

    beforeAll(async () => {
      const userId = await setupUser()

      await db.insert(categoriesTable).values({
        id: categoryId,
        user_id: userId,
        type: 'expense',
        name: '食費',
        icon: 'utensils',
        color: 'red',
      })

      result = await deleteCategory(db)(categoryId, userId)
    })

    test('削除されたカテゴリが返ること', () => {
      expect(result).toBeDefined()
    })

    test('削除されたカテゴリのidが正しいこと', () => {
      assert(Result.isSuccess(result))
      expect(result.value.id).toBe(categoryId)
    })
  })

  describe('正常系 - 存在しないカテゴリを指定すると例外が返る', () => {
    let result: Awaited<ReturnType<ReturnType<typeof deleteCategory>>>

    beforeAll(async () => {
      const userId = await setupUser()
      result = await deleteCategory(db)(
        'non-existent-cat-repo-00001' as CategoryId,
        userId,
      )
    })

    test('CategoryNotFoundException が返ること', () => {
      assert(Result.isFailure(result))
      expect(result.error).toBeInstanceOf(CategoryNotFoundException)
    })
  })

  describe('異常系 - トランザクションから参照されているカテゴリは削除できない', () => {
    const categoryId = 'test-cat-repo-del-00000002' as CategoryId

    let result: Awaited<ReturnType<ReturnType<typeof deleteCategory>>>

    beforeAll(async () => {
      const userId = await setupUser()

      await db.insert(categoriesTable).values({
        id: categoryId,
        user_id: userId,
        type: 'expense',
        name: '食費',
        icon: 'utensils',
        color: 'red',
      })

      await db.insert(transactionsTable).values({
        id: ulid(),
        user_id: userId,
        type: 'expense',
        amount: 1000,
        category_id: categoryId,
        name: 'ランチ',
        transaction_date: '2022-11-01',
        created_at: dayjs().toISOString(),
      })

      result = await deleteCategory(db)(categoryId, userId)
    })

    test('CategoryRelationException が返ること', () => {
      assert(Result.isFailure(result))
      expect(result.error).toBeInstanceOf(CategoryRelationException)
    })
  })
})
