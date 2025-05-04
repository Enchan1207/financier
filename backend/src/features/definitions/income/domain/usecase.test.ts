import { env } from 'cloudflare:test'

import type { User } from '@/features/users/domains/entity'
import { createUser } from '@/features/users/domains/entity'
import { useUserRepositoryD1 } from '@/features/users/infrastructure/repositoryImpl'

import { useIncomeDefinitionRepositoryD1 } from '../infrastructure/repositoryImpl'
import { createIncomeDefinition } from './entity'
import { AuthorizationError, useIncomeDefinitionUsecase } from './usecase'

describe('権限まわり', () => {
  const repo = useIncomeDefinitionRepositoryD1(env.D1)

  const usecase = useIncomeDefinitionUsecase(repo)

  const dummyUser: User = createUser({
    name: 'test user',
    auth0_user_id: 'auth0_test_user',
    email: 'test@example.com',
  })

  const dummyOtherUser: User = createUser({
    name: 'test user',
    auth0_user_id: 'auth0_test_user',
    email: 'test@example.com',
  })

  const dummyIncomeDefinition = createIncomeDefinition({
    userId: dummyUser.id,
    name: 'ダミー定義',
    kind: 'absolute',
    value: 100000,
    isTaxable: true,
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
    userId: dummyOtherUser.id,
    name: 'ダミー定義',
    kind: 'absolute',
    value: 100000,
    isTaxable: true,
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
    const userRepository = useUserRepositoryD1(env.D1)
    await userRepository.saveUser(dummyUser)
    await userRepository.saveUser(dummyOtherUser)

    await repo.insertIncomeDefinition(dummyIncomeDefinition)
    await repo.insertIncomeDefinition(dummyOtherIncomeDefinition)
  })

  test('他人のエンティティは取得できないこと', async () => {
    const actual = await usecase.getIncomeDefinition(
      dummyUser,
      dummyOtherIncomeDefinition.id,
    )

    const error = actual.isErr() ? actual.error : undefined
    expect(error).toBeInstanceOf(AuthorizationError)
  })

  test('他人のエンティティは更新できないこと', async () => {
    const actual = await usecase.updateIncomeDefinition(
      dummyUser,
      dummyOtherIncomeDefinition.id,
      {},
    )

    const error = actual.isErr() ? actual.error : undefined
    expect(error).toBeInstanceOf(AuthorizationError)
  })

  test('他人のエンティティは無効化できないこと', async () => {
    const actual = await usecase.invalidateIncomeDefinition(
      dummyUser,
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
      dummyUser,
      dummyOtherIncomeDefinition.id,
    )

    const error = actual.isErr() ? actual.error : undefined
    expect(error).toBeInstanceOf(AuthorizationError)
  })

  test('他人のエンティティは期間が被っていても取得されないこと (会計月度)', async () => {
    const actual = await usecase.findIncomeDefinitionsByFinancialMonth(
      dummyUser,
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
      dummyUser,
      2025,
    )

    const items = actual.isOk() ? actual.value : []

    expect(items).toHaveLength(1)
  })
})
