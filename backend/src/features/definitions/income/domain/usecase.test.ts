import { env } from 'cloudflare:test'

import type { User } from '@/features/users/domain/entity'

import { useIncomeDefinitionRepositoryD1 } from '../infrastructure/repositoryImpl'
import { createIncomeDefinition } from './entity'
import { AuthorizationError, useIncomeDefinitionUsecase } from './usecase'

describe('権限まわり', () => {
  const repo = useIncomeDefinitionRepositoryD1(env.D1)

  const usecase = useIncomeDefinitionUsecase(repo)

  const testUser: User = {
    id: 'test_user_id',
    name: 'test user',
    auth0_user_id: 'auth0_test_user',
    email: 'test@example.com',
  }

  const dummyIncomeDefinition = createIncomeDefinition({
    userId: testUser.id,
    name: 'ダミー定義',
    kind: 'absolute',
    value: 100000,
    from: {
      financialYear: 2025,
      month: 4,
    },
    to: {
      financialYear: 2025,
      month: 3,
    },
  })

  const dummyOtherIncomeDefinition = createIncomeDefinition({
    userId: 'other_user',
    name: 'ダミー定義',
    kind: 'absolute',
    value: 100000,
    from: {
      financialYear: 2025,
      month: 6,
    },
    to: {
      financialYear: 2025,
      month: 9,
    },
  })

  beforeAll(async () => {
    await repo.insertIncomeDefinition(dummyIncomeDefinition)
    await repo.insertIncomeDefinition(dummyOtherIncomeDefinition)
  })

  test('他人のエンティティは取得できないこと', async () => {
    const actual = await usecase.getIncomeDefinition(
      testUser,
      dummyOtherIncomeDefinition.id,
    )

    const error = actual.isErr() ? actual.error : undefined
    expect(error).toBeInstanceOf(AuthorizationError)
  })

  test('他人のエンティティは更新できないこと', async () => {
    const actual = await usecase.updateIncomeDefinition(
      testUser,
      dummyOtherIncomeDefinition.id,
      {},
    )

    const error = actual.isErr() ? actual.error : undefined
    expect(error).toBeInstanceOf(AuthorizationError)
  })

  test('他人のエンティティは無効化できないこと', async () => {
    const actual = await usecase.invalidateIncomeDefinition(
      testUser,
      dummyOtherIncomeDefinition.id,
      {
        financialYear: 2025,
        month: 7,
      },
    )

    const error = actual.isErr() ? actual.error : undefined
    expect(error).toBeInstanceOf(AuthorizationError)
  })

  test('他人のエンティティは削除できないこと', async () => {
    const actual = await usecase.deleteIncomeDefinition(
      testUser,
      dummyOtherIncomeDefinition.id,
    )

    const error = actual.isErr() ? actual.error : undefined
    expect(error).toBeInstanceOf(AuthorizationError)
  })

  test('他人のエンティティは期間が被っていても取得されないこと (会計月度)', async () => {
    const actual = await usecase.findIncomeDefinitionsByFinancialMonth(
      testUser,
      {
        financialYear: 2025,
        month: 7,
      },
    )

    const items = actual.isOk() ? actual.value : []

    expect(items).toHaveLength(1)
  })

  test('他人のエンティティは期間が被っていても取得されないこと (会計年度)', async () => {
    const actual = await usecase.findIncomeDefinitionsByFinancialYear(
      testUser,
      2025,
    )

    const items = actual.isOk() ? actual.value : []

    expect(items).toHaveLength(1)
  })
})
