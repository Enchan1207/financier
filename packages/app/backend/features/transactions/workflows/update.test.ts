import type { Category, CategoryId } from '@backend/domains/category'
import type { Transaction, TransactionId } from '@backend/domains/transaction'
import type { UserId } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import {
  TransactionNotFoundException,
  TransactionValidationException,
} from '../exceptions'
import type { UpdateTransactionCommand } from './update'
import { buildUpdateTransactionWorkflow } from './update'

const TEST_USER_ID = 'test-user-id-00000000001' as UserId

const makeTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  id: 'test-transaction-id-000000001' as TransactionId,
  type: 'expense',
  amount: 5000,
  categoryId: 'test-category-id-0000000001' as CategoryId,
  transactionDate: dayjs('2024-04-15'),
  eventId: null,
  name: '食料品',
  createdAt: dayjs('2024-04-15T10:00:00Z'),
  ...overrides,
})

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'test-category-id-0000000001' as CategoryId,
  userId: TEST_USER_ID,
  type: 'expense',
  name: '食費',
  status: 'active',
  icon: 'utensils',
  color: 'red',
  ...overrides,
})

describe('buildUpdateTransactionWorkflow', () => {
  describe('正常系 - amountを変更できる', () => {
    const transaction = makeTransaction()
    const command: UpdateTransactionCommand = {
      id: transaction.id,
      amount: 8000,
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateTransactionWorkflow({
        findTransactionById: () => Promise.resolve(transaction),
        findCategoryById: () => Promise.resolve(undefined),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('amountが更新されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.amount).toBe(8000)
    })

    test('その他のプロパティが保持されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.name).toBe(transaction.name)
      expect(actual.value.transaction.categoryId).toBe(transaction.categoryId)
    })
  })

  describe('正常系 - nameを変更できる', () => {
    const transaction = makeTransaction()
    const command: UpdateTransactionCommand = {
      id: transaction.id,
      name: '外食費',
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateTransactionWorkflow({
        findTransactionById: () => Promise.resolve(transaction),
        findCategoryById: () => Promise.resolve(undefined),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('nameが更新されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.name).toBe('外食費')
    })
  })

  describe('正常系 - transactionDateを変更できる', () => {
    const transaction = makeTransaction()
    const command: UpdateTransactionCommand = {
      id: transaction.id,
      transactionDate: '2024-05-01',
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateTransactionWorkflow({
        findTransactionById: () => Promise.resolve(transaction),
        findCategoryById: () => Promise.resolve(undefined),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('transactionDateが更新されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(
        actual.value.transaction.transactionDate.format('YYYY-MM-DD'),
      ).toBe('2024-05-01')
    })
  })

  describe('正常系 - categoryIdをactiveなカテゴリに変更できる', () => {
    const transaction = makeTransaction()
    const newCategory = makeCategory({
      id: 'test-category-id-0000000002' as CategoryId,
      name: '外食費',
    })
    const command: UpdateTransactionCommand = {
      id: transaction.id,
      categoryId: newCategory.id,
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateTransactionWorkflow({
        findTransactionById: () => Promise.resolve(transaction),
        findCategoryById: () => Promise.resolve(newCategory),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('categoryIdが更新されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.categoryId).toBe(newCategory.id)
    })
  })

  describe('正常系 - アーカイブ済みカテゴリを持つトランザクションをカテゴリ変更なしで更新できる', () => {
    const archivedCategory: Category = makeCategory({
      id: 'test-category-id-archived-001' as CategoryId,
      status: 'archived',
    })
    const transaction = makeTransaction({
      categoryId: archivedCategory.id,
    })
    const command: UpdateTransactionCommand = {
      id: transaction.id,
      amount: 6000,
      name: '食料品（修正）',
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateTransactionWorkflow({
        findTransactionById: () => Promise.resolve(transaction),
        findCategoryById: () => Promise.resolve(undefined),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('amountが更新されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.amount).toBe(6000)
    })

    test('categoryIdが変わらないこと', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.transaction.categoryId).toBe(archivedCategory.id)
    })
  })

  describe('異常系 - トランザクションが存在しない', () => {
    const command: UpdateTransactionCommand = {
      id: 'non-existent-transaction-id-0' as TransactionId,
      amount: 1000,
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateTransactionWorkflow({
        findTransactionById: () => Promise.resolve(undefined),
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

    test('エラーメッセージにトランザクションIDが含まれること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toContain(command.id)
    })
  })

  describe('異常系 - 変更先カテゴリが存在しない', () => {
    const transaction = makeTransaction()
    const command: UpdateTransactionCommand = {
      id: transaction.id,
      categoryId: 'non-existent-category-id-000',
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateTransactionWorkflow({
        findTransactionById: () => Promise.resolve(transaction),
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
  })

  describe('異常系 - 変更先カテゴリがアーカイブ済み', () => {
    const transaction = makeTransaction()
    const archivedCategory = makeCategory({
      id: 'test-category-id-archived-002' as CategoryId,
      status: 'archived',
    })
    const command: UpdateTransactionCommand = {
      id: transaction.id,
      categoryId: archivedCategory.id,
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateTransactionWorkflow({
        findTransactionById: () => Promise.resolve(transaction),
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

  describe('異常系 - 変更先カテゴリの種別がトランザクションと不一致', () => {
    const transaction = makeTransaction({ type: 'expense' })
    const incomeCategory = makeCategory({
      id: 'test-category-id-income-00001' as CategoryId,
      type: 'income',
      name: '給与',
    })
    const command: UpdateTransactionCommand = {
      id: transaction.id,
      categoryId: incomeCategory.id,
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateTransactionWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateTransactionWorkflow({
        findTransactionById: () => Promise.resolve(transaction),
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
})
