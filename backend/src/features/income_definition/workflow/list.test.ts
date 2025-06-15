import { Err, Ok } from 'neverthrow'

import { createUser } from '@/domains/user/logic'
import dayjs from '@/logic/dayjs'

import { createIncomeDefinitionListWorkflow } from './list'

const dummyUser = createUser({
  auth0UserId: '',
  name: 'テスト',
  email: '',
})

describe('正常系', () => {
  let actual: Parameters<
    Parameters<
      typeof createIncomeDefinitionListWorkflow
    >[0]['findIncomeDefinitions']
  >[0]

  const workflow = createIncomeDefinitionListWorkflow({
    // eslint-disable-next-line @typescript-eslint/require-await
    findIncomeDefinitions: async (actualProps) => {
      actual = actualProps
      return []
    },
  })

  describe('from-toで期間を絞る場合', () => {
    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: {
          sortBy: 'disabledAt',
          limit: 20,
          offset: 0,
          order: 'asc',
          kind: 'absolute',
          from: '2025_04',
          to: '2025_09',
        },
        state: {
          user: dummyUser,
        },
      })
    })

    test('ワークフローが正常終了すること', () => {
      expect(result).toBeInstanceOf(Ok)
    })

    test('25/04/01に始まること', () => {
      const expectedStart = dayjs('2025-04-01T00:00:00.000+09:00')
      expect(actual.period?.start.valueOf()).toBe(expectedStart.valueOf())
    })

    test('25/09/30に終わること', () => {
      const expectedEnd = dayjs('2025-09-30T23:59:59.999+09:00')
      expect(actual.period?.end.valueOf()).toBe(expectedEnd.valueOf())
    })
  })

  describe('atで期間を絞る場合', () => {
    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: {
          sortBy: 'disabledAt',
          limit: 20,
          offset: 0,
          order: 'asc',
          kind: 'absolute',
          at: '2025_07',
        },
        state: {
          user: dummyUser,
        },
      })
    })

    test('ワークフローが正常終了すること', () => {
      expect(result).toBeInstanceOf(Ok)
    })

    test('25/07/01に始まること', () => {
      const expectedStart = dayjs('2025-07-01T00:00:00.000+09:00')
      expect(actual.period?.start.valueOf()).toBe(expectedStart.valueOf())
    })

    test('25/07/31に終わること', () => {
      const expectedEnd = dayjs('2025-07-31T23:59:59.999+09:00')
      expect(actual.period?.end.valueOf()).toBe(expectedEnd.valueOf())
    })
  })
})

describe('異常系 - 不正な期間', () => {
  let result: Awaited<ReturnType<typeof workflow>>

  const workflow = createIncomeDefinitionListWorkflow({
    // eslint-disable-next-line @typescript-eslint/require-await
    findIncomeDefinitions: async () => [],
  })

  beforeAll(async () => {
    result = await workflow({
      input: {
        sortBy: 'disabledAt',
        limit: 20,
        offset: 0,
        order: 'asc',
        kind: 'absolute',
        from: '2025_09',
        to: '2025_04',
      },
      state: {
        user: dummyUser,
      },
    })
  })

  test('ワークフローに失敗すること', () => {
    expect(result).toBeInstanceOf(Err)
  })
})
