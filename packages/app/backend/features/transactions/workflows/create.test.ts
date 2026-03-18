import type { Category, CategoryId } from '@backend/domains/category'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import {
  TransactionNotFoundException,
  TransactionValidationException,
} from '../exceptions'
import type { CreateTransactionCommand } from './create'
import { buildCreateTransactionWorkflow } from './create'

const TEST_USER_ID = 'test-user-id-00000000001' as UserId

describe('buildCreateTransactionWorkflow', () => {
  describe('正常系 - incomeカテゴリにincomeトランザクションを作成できる', () => {
    const incomeCategory: Category = {
      id: 'test-category-id-0000000001' as CategoryId,
      userId: TEST_USER_ID,
      type: 'income',
      name: '給与',
      status: 'active',
      icon: 'briefcase',
      color: 'green',
    }

    const command: CreateTransactionCommand = {
      input: {
        type: 'income',
        amount: 300000,
        categoryId: incomeCategory.id,
        transactionDate: '2024-04-01',
        name: '4月分給与',
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCreateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCreateTransactionWorkflow({
        findCategoryById: () => Promise.resolve(incomeCategory),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('typeがincomeであること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.type).toBe('income')
    })

    test('amountが正しいこと', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.amount).toBe(300000)
    })

    test('nameが正しいこと', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.name).toBe('4月分給与')
    })

    test('categoryIdが正しいこと', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.categoryId).toBe(incomeCategory.id)
    })

    test('eventIdがnullであること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.eventId).toBeNull()
    })

    test('IDが生成されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.id).toBeDefined()
    })

    test('userIdが設定されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.userId).toBe(TEST_USER_ID)
    })
  })

  describe('正常系 - expenseカテゴリにexpenseトランザクションを作成できる', () => {
    const expenseCategory: Category = {
      id: 'test-category-id-0000000002' as CategoryId,
      userId: TEST_USER_ID,
      type: 'expense',
      name: '食費',
      status: 'active',
      icon: 'utensils',
      color: 'red',
    }

    const command: CreateTransactionCommand = {
      input: {
        type: 'expense',
        amount: 5000,
        categoryId: expenseCategory.id,
        transactionDate: '2024-04-15',
        name: '食料品',
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCreateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCreateTransactionWorkflow({
        findCategoryById: () => Promise.resolve(expenseCategory),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('typeがexpenseであること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.type).toBe('expense')
    })
  })

  describe('正常系 - savingカテゴリにexpenseトランザクションを作成できる（貯蓄は支出として記録）', () => {
    const savingCategory: Category = {
      id: 'test-category-id-0000000003' as CategoryId,
      userId: TEST_USER_ID,
      type: 'saving',
      name: '積立貯金',
      status: 'active',
      icon: 'piggy_bank',
      color: 'pink',
    }

    const command: CreateTransactionCommand = {
      input: {
        type: 'expense',
        amount: 10000,
        categoryId: savingCategory.id,
        transactionDate: '2024-04-25',
        name: '4月積立',
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCreateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCreateTransactionWorkflow({
        findCategoryById: () => Promise.resolve(savingCategory),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('typeがexpenseであること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.type).toBe('expense')
    })
  })

  describe('正常系 - eventIdを指定してトランザクションを作成できる', () => {
    const category: Category = {
      id: 'test-category-id-0000000004' as CategoryId,
      userId: TEST_USER_ID,
      type: 'expense',
      name: '交通費',
      status: 'active',
      icon: 'bus',
      color: 'yellow',
    }

    const command: CreateTransactionCommand = {
      input: {
        type: 'expense',
        amount: 2000,
        categoryId: category.id,
        transactionDate: '2024-05-01',
        name: '出張交通費',
        eventId: 'test-event-id-00000000001',
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCreateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCreateTransactionWorkflow({
        findCategoryById: () => Promise.resolve(category),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('eventIdが設定されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.eventId).toBe('test-event-id-00000000001')
    })
  })

  describe('正常系 - 未来日のトランザクションを作成できる', () => {
    const category: Category = {
      id: 'test-category-id-0000000005' as CategoryId,
      userId: TEST_USER_ID,
      type: 'income',
      name: '給与',
      status: 'active',
      icon: 'briefcase',
      color: 'green',
    }

    const command: CreateTransactionCommand = {
      input: {
        type: 'income',
        amount: 300000,
        categoryId: category.id,
        transactionDate: '2099-12-31',
        name: '未来の給与',
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCreateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCreateTransactionWorkflow({
        findCategoryById: () => Promise.resolve(category),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })
  })

  describe('異常系 - カテゴリが存在しない', () => {
    const command: CreateTransactionCommand = {
      input: {
        type: 'expense',
        amount: 1000,
        categoryId: 'non-existent-category-id-000' as CategoryId,
        transactionDate: '2024-04-01',
        name: 'テスト',
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCreateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCreateTransactionWorkflow({
        findCategoryById: () => Promise.resolve(undefined),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがTransactionNotFoundExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(TransactionNotFoundException)
    })

    test('エラーメッセージにカテゴリIDが含まれること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toContain(command.input.categoryId)
    })
  })

  describe('異常系 - アーカイブ済みカテゴリは使用できない', () => {
    const archivedCategory: Category = {
      id: 'test-category-id-0000000006' as CategoryId,
      userId: TEST_USER_ID,
      type: 'expense',
      name: '食費',
      status: 'archived',
      icon: 'utensils',
      color: 'red',
    }

    const command: CreateTransactionCommand = {
      input: {
        type: 'expense',
        amount: 1000,
        categoryId: archivedCategory.id,
        transactionDate: '2024-04-01',
        name: 'テスト',
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCreateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCreateTransactionWorkflow({
        findCategoryById: () => Promise.resolve(archivedCategory),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがTransactionValidationExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(TransactionValidationException)
    })

    test('エラーメッセージにアーカイブ済みである旨が含まれること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toContain('アーカイブ済み')
    })
  })

  describe('異常系 - incomeカテゴリにexpenseトランザクションは作成できない', () => {
    const incomeCategory: Category = {
      id: 'test-category-id-0000000007' as CategoryId,
      userId: TEST_USER_ID,
      type: 'income',
      name: '給与',
      status: 'active',
      icon: 'briefcase',
      color: 'green',
    }

    const command: CreateTransactionCommand = {
      input: {
        type: 'expense',
        amount: 1000,
        categoryId: incomeCategory.id,
        transactionDate: '2024-04-01',
        name: 'テスト',
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCreateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCreateTransactionWorkflow({
        findCategoryById: () => Promise.resolve(incomeCategory),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがTransactionValidationExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(TransactionValidationException)
    })
  })

  describe('異常系 - expenseカテゴリにincomeトランザクションは作成できない', () => {
    const expenseCategory: Category = {
      id: 'test-category-id-0000000008' as CategoryId,
      userId: TEST_USER_ID,
      type: 'expense',
      name: '食費',
      status: 'active',
      icon: 'utensils',
      color: 'red',
    }

    const command: CreateTransactionCommand = {
      input: {
        type: 'income',
        amount: 1000,
        categoryId: expenseCategory.id,
        transactionDate: '2024-04-01',
        name: 'テスト',
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCreateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCreateTransactionWorkflow({
        findCategoryById: () => Promise.resolve(expenseCategory),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがTransactionValidationExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(TransactionValidationException)
    })
  })

  describe('異常系 - savingカテゴリにincomeトランザクションは作成できない', () => {
    const savingCategory: Category = {
      id: 'test-category-id-0000000009' as CategoryId,
      userId: TEST_USER_ID,
      type: 'saving',
      name: '積立貯金',
      status: 'active',
      icon: 'piggy_bank',
      color: 'pink',
    }

    const command: CreateTransactionCommand = {
      input: {
        type: 'income',
        amount: 10000,
        categoryId: savingCategory.id,
        transactionDate: '2024-04-01',
        name: 'テスト',
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCreateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCreateTransactionWorkflow({
        findCategoryById: () => Promise.resolve(savingCategory),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがTransactionValidationExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(TransactionValidationException)
    })
  })
})
