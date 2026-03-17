import type { Category, CategoryId } from '@backend/domains/category'
import { isActiveCategory } from '@backend/domains/category'
import type { EventId } from '@backend/domains/event'
import type { Transaction, TransactionId } from '@backend/domains/transaction'
import dayjs from '@backend/lib/date'
import { Result } from '@praha/byethrow'

import {
  TransactionNotFoundException,
  TransactionValidationException,
} from '../exceptions'

// MARK: command

export type UpdateTransactionCommand = {
  id: TransactionId
  amount?: number
  categoryId?: string
  transactionDate?: string
  name?: string
  eventId?: string | null
}

// MARK: step types

type TransactionResolved = {
  input: UpdateTransactionCommand
  context: {
    transaction: Transaction
    newCategory: Category | null
  }
}

type CategoryChecked = TransactionResolved

// MARK: event

export type TransactionUpdatedEvent = {
  transaction: Transaction
}

// MARK: effects

type Effects = {
  findTransactionById: (id: TransactionId) => Promise<Transaction | undefined>
  findCategoryById: (id: CategoryId) => Promise<Category | undefined>
}

// MARK: workflow type

type Workflow = (
  command: UpdateTransactionCommand,
) => Result.ResultAsync<
  TransactionUpdatedEvent,
  TransactionNotFoundException | TransactionValidationException
>

// MARK: steps

const resolveTransaction =
  (effects: Effects) =>
  async (
    command: UpdateTransactionCommand,
  ): Result.ResultAsync<
    TransactionResolved,
    TransactionNotFoundException | TransactionValidationException
  > => {
    const transaction = await effects.findTransactionById(command.id)
    if (!transaction) {
      return Result.fail(
        new TransactionNotFoundException(
          `トランザクションが見つかりません: ${command.id}`,
        ),
      )
    }

    if (command.categoryId === undefined) {
      return Result.succeed({
        input: command,
        context: { transaction, newCategory: null },
      })
    }

    const newCategory = await effects.findCategoryById(
      command.categoryId as CategoryId,
    )
    if (!newCategory) {
      return Result.fail(
        new TransactionNotFoundException(
          `カテゴリが見つかりません: ${command.categoryId}`,
        ),
      )
    }

    return Result.succeed({
      input: command,
      context: { transaction, newCategory },
    })
  }

const checkCategoryStatus = (
  resolved: TransactionResolved,
): Result.Result<CategoryChecked, TransactionValidationException> => {
  const { newCategory } = resolved.context
  if (newCategory !== null && !isActiveCategory(newCategory)) {
    return Result.fail(
      new TransactionValidationException(
        'アーカイブ済みカテゴリは使用できません',
      ),
    )
  }
  return Result.succeed(resolved)
}

const checkTypeMismatch = (
  checked: CategoryChecked,
): Result.Result<CategoryChecked, TransactionValidationException> => {
  const { newCategory, transaction } = checked.context
  if (newCategory === null) {
    return Result.succeed(checked)
  }

  const transactionType = transaction.type
  const categoryType = newCategory.type

  const valid =
    (transactionType === 'income' && categoryType === 'income') ||
    (transactionType === 'expense' &&
      (categoryType === 'expense' || categoryType === 'saving'))

  if (!valid) {
    return Result.fail(
      new TransactionValidationException(
        `カテゴリ種別と取引種別が一致しません: カテゴリ=${categoryType}, 取引=${transactionType}`,
      ),
    )
  }
  return Result.succeed(checked)
}

const createEvent = (checked: CategoryChecked): TransactionUpdatedEvent => {
  const { input, context } = checked
  const { transaction, newCategory } = context

  const updated: Transaction = {
    ...transaction,
    amount: input.amount ?? transaction.amount,
    categoryId: newCategory ? newCategory.id : transaction.categoryId,
    transactionDate: input.transactionDate
      ? dayjs(input.transactionDate)
      : transaction.transactionDate,
    name: input.name ?? transaction.name,
    eventId:
      input.eventId !== undefined
        ? input.eventId
          ? (input.eventId as EventId)
          : null
        : transaction.eventId,
  }

  return { transaction: updated }
}

// MARK: definition

export const buildUpdateTransactionWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveTransaction(effects)),
      Result.andThen(checkCategoryStatus),
      Result.andThen(checkTypeMismatch),
      Result.map(createEvent),
    )
