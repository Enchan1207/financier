import { env } from 'cloudflare:test'

import { createIncomeDefinition } from '@/features/definitions/income/domain/entity'
import { useIncomeDefinitionRepositoryD1 } from '@/features/definitions/income/infrastructure/repositoryImpl'
import { createFinancialMonth } from '@/features/financial_months/domain/entity'
import { useFinancialMonthRepositoryD1 } from '@/features/financial_months/infrastructure/repositoryImpl'
import { createUserEntity } from '@/features/users/domain/entity'
import { useUserRepositoryD1 } from '@/features/users/infrastructure/repositoryImpl'

import { useIncomeRecordRepositoryD1 } from '../infrastructure/repositoryImpl'
import { createIncomeRecord } from './entity'
import { AuthorizationError, useIncomeRecordUsecase } from './usecase'

describe('権限まわり', () => {
  const repo = useIncomeRecordRepositoryD1(env.D1)

  const usecase = useIncomeRecordUsecase(repo)

  const dummyUsers = Array.from({ length: 2 }).map((_, i) =>
    createUserEntity({
      name: `testuser_${i}`,
      email: `test${i}@example.com`,
      auth0_user_id: `auth0_user_id_${i}`,
    }))

  const dummyFinancialMonths = dummyUsers.map(user =>
    createFinancialMonth({
      userId: user.id,
      financialYear: 2024,
      month: 2,
    }))

  const dummyIncomeDefinitions = dummyUsers.map(user =>
    createIncomeDefinition({
      userId: user.id,
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
    }))

  const dummyIncomeRecords = dummyUsers.map((user, i) =>
    createIncomeRecord({
      userId: user.id,
      financialMonthId: dummyFinancialMonths[i].id,
      definitionId: dummyIncomeDefinitions[i].id,
      value: 1000,
      updatedBy: 'user',
    }))

  beforeAll(async () => {
    // スタブを作るのが面倒くさいね……

    const userRepository = useUserRepositoryD1(env.D1)
    await Promise.all(dummyUsers.map(user => userRepository.saveUser(user)))

    const financialMonthRepository = useFinancialMonthRepositoryD1(env.D1)
    await Promise.all(dummyFinancialMonths.map(fm => financialMonthRepository.insertFinancialMonth(fm)))

    const incomeDefinitionRepository = useIncomeDefinitionRepositoryD1(env.D1)
    await Promise.all(dummyIncomeDefinitions.map(definition => incomeDefinitionRepository.insertIncomeDefinition(definition)))

    await Promise.all(dummyIncomeRecords.map(record => repo.insertIncomeRecord(record)))
  })

  test('他人のエンティティは取得できないこと', async () => {
    const actual = await usecase.getIncomeRecord(
      dummyUsers[0],
      {
        financialMonthId: dummyIncomeRecords[1].financialMonthId,
        definitionId: dummyIncomeRecords[1].definitionId,
      },
    )

    const error = actual.isErr() ? actual.error : undefined
    expect(error).toBeInstanceOf(AuthorizationError)
  })

  test('他人のエンティティは更新できないこと', async () => {
    const actual = await usecase.updateIncomeRecordValue(
      dummyUsers[0],
      {
        financialMonthId: dummyIncomeRecords[1].financialMonthId,
        definitionId: dummyIncomeRecords[1].definitionId,
      },
      200,
      'system',
    )

    const error = actual.isErr() ? actual.error : undefined
    expect(error).toBeInstanceOf(AuthorizationError)
  })
})
