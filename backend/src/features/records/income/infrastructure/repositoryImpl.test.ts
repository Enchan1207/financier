import { env } from 'cloudflare:test'

import { createIncomeDefinition } from '@/features/definitions/income/domain/entity'
import { useIncomeDefinitionRepositoryD1 } from '@/features/definitions/income/infrastructure/repositoryImpl'
import { createFinancialMonth } from '@/features/financial_months/domain/entity'
import { useFinancialMonthRepositoryD1 } from '@/features/financial_months/infrastructure/repositoryImpl'
import { createUserEntity } from '@/features/users/domain/entity'
import { useUserRepositoryD1 } from '@/features/users/infrastructure/repositoryImpl'

import { createIncomeRecord } from '../domain/entity'
import { useIncomeRecordRepositoryD1 } from './repositoryImpl'

describe('報酬定義の操作', () => {
  const repository = useIncomeRecordRepositoryD1(env.D1)

  const dummyUser = createUserEntity({
    name: 'testuser',
    email: 'test@example.com',
    auth0_user_id: 'auth0_user_id',
  })

  const dummyFinancialMonth = createFinancialMonth({
    userId: dummyUser.id,
    financialYear: 2024,
    month: 2,
  })

  const dummyIncomeDefinition = createIncomeDefinition({
    userId: dummyUser.id,
    kind: 'absolute',
    name: 'テスト定義',
    value: 100000,
    isTaxable: true,
    from: {
      financialYear: 2024,
      month: 4,
    },
    to: {
      financialYear: 2024,
      month: 3,
    },
  })

  const dummyIncomeRecord = createIncomeRecord({
    userId: dummyUser.id,
    financialMonthId: dummyFinancialMonth.id,
    definitionId: dummyIncomeDefinition.id,
    value: 1000,
    updatedBy: 'user',
  })

  beforeAll(async () => {
    const userRepository = useUserRepositoryD1(env.D1)
    await userRepository.saveUser(dummyUser)

    const financialMonthRepository = useFinancialMonthRepositoryD1(env.D1)
    await financialMonthRepository.insertFinancialMonth(dummyFinancialMonth)

    const incomeDefinitionRepository = useIncomeDefinitionRepositoryD1(env.D1)
    await incomeDefinitionRepository
      .insertIncomeDefinition(dummyIncomeDefinition)

    await repository.insertIncomeRecord(dummyIncomeRecord)
  })

  test('挿入した項目を取得できること', async () => {
    const actual = await repository.findById(dummyIncomeRecord.id)

    expect(actual).toStrictEqual(dummyIncomeRecord)
  })

  test('項目を更新できること', async () => {
    const actual = await repository.updateIncomeDefinitionValue(
      dummyIncomeRecord.id,
      200,
    )

    expect(actual).toStrictEqual({
      ...dummyIncomeRecord,
      updatedAt: actual?.updatedAt,
      value: 200,
    })
  })
})
