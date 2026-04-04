import type { Category, CategoryId } from '@backend/domains/category'
import type { EventId } from '@backend/domains/event'
import type { Transaction, TransactionId } from '@backend/domains/transaction'
import type { UserId } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import { Result } from '@praha/byethrow'

import {
  TransactionNotFoundException,
  TransactionValidationException,
} from '../exceptions'

// MARK: command

export type UpdateTransactionCommand = {
  input: {
    id: TransactionId
    amount?: number | undefined
    categoryId?: string | undefined
    transactionDate?: string | undefined
    name?: string | undefined
    eventId?: string | null | undefined
  }
  context: {
    userId: UserId
  }
}

// MARK: step types

type TransactionResolved = {
  input: UpdateTransactionCommand['input']
  context: {
    userId: UserId
    transaction: Transaction
    newCategory: Category | null
  }
}

// MARK: event

export type TransactionUpdatedEvent = {
  transaction: Transaction
}

// MARK: effects

type Effects = {
  findTransactionById: (
    id: TransactionId,
    userId: UserId,
  ) => Promise<Transaction | undefined>
  findCategoryById: (
    id: CategoryId,
    userId: UserId,
  ) => Promise<Category | undefined>
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
    const transaction = await effects.findTransactionById(
      command.input.id,
      command.context.userId,
    )
    if (!transaction) {
      return Result.fail(
        new TransactionNotFoundException(
          `トランザクションが見つかりません: ${command.input.id}`,
        ),
      )
    }

    if (command.input.categoryId === undefined) {
      return Result.succeed({
        input: command.input,
        context: {
          userId: command.context.userId,
          transaction,
          newCategory: null,
        },
      })
    }

    const newCategory = await effects.findCategoryById(
      command.input.categoryId as CategoryId,
      command.context.userId,
    )
    if (!newCategory) {
      return Result.fail(
        new TransactionNotFoundException(
          `カテゴリが見つかりません: ${command.input.categoryId}`,
        ),
      )
    }

    return Result.succeed({
      input: command.input,
      context: { userId: command.context.userId, transaction, newCategory },
    })
  }

const checkTypeMismatch = (
  resolved: TransactionResolved,
): Result.Result<TransactionResolved, TransactionValidationException> => {
  const { newCategory, transaction } = resolved.context
  if (newCategory === null) {
    return Result.succeed(resolved)
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
  return Result.succeed(resolved)
}

const createEvent = (
  resolved: TransactionResolved,
): TransactionUpdatedEvent => {
  const { input, context } = resolved
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
      Result.andThen(checkTypeMismatch),
      Result.map(createEvent),
    )
