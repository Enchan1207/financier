import type { Category, CategoryId } from '@backend/domains/category'
import { isActiveCategory } from '@backend/domains/category'
import type { EventId } from '@backend/domains/event'
import type { Transaction, TransactionType } from '@backend/domains/transaction'
import { createTransaction } from '@backend/domains/transaction'
import dayjs from '@backend/lib/date'
import { Result } from '@praha/byethrow'

import {
  TransactionNotFoundException,
  TransactionValidationException,
} from '../exceptions'

// MARK: command

export type CreateTransactionCommand = {
  type: TransactionType
  amount: number
  categoryId: CategoryId
  transactionDate: string
  name: string
  eventId?: string | null
}

// MARK: step types

type CategoryResolved = {
  input: CreateTransactionCommand
  context: {
    category: Category
  }
}

type StatusChecked = {
  input: CreateTransactionCommand
  context: {
    category: Category
  }
}

// MARK: event

export type TransactionCreatedEvent = {
  transaction: Transaction
}

// MARK: effects

type Effects = {
  findCategoryById: (id: CategoryId) => Promise<Category | undefined>
}

// MARK: workflow type

type Workflow = (
  command: CreateTransactionCommand,
) => Result.ResultAsync<
  TransactionCreatedEvent,
  TransactionNotFoundException | TransactionValidationException
>

// MARK: steps

const resolveCategory =
  (effects: Effects) =>
  async (
    command: CreateTransactionCommand,
  ): Result.ResultAsync<CategoryResolved, TransactionNotFoundException> => {
    const category = await effects.findCategoryById(command.categoryId)
    if (!category) {
      return Result.fail(
        new TransactionNotFoundException(
          `カテゴリが見つかりません: ${command.categoryId}`,
        ),
      )
    }
    return Result.succeed({ input: command, context: { category } })
  }

const checkCategoryStatus = (
  resolved: CategoryResolved,
): Result.Result<StatusChecked, TransactionValidationException> => {
  if (!isActiveCategory(resolved.context.category)) {
    return Result.fail(
      new TransactionValidationException(
        'アーカイブ済みカテゴリは使用できません',
      ),
    )
  }
  return Result.succeed(resolved)
}

const checkTypeMismatch = (
  checked: StatusChecked,
): Result.Result<StatusChecked, TransactionValidationException> => {
  const { type } = checked.input
  const categoryType = checked.context.category.type

  const valid =
    (type === 'income' && categoryType === 'income') ||
    (type === 'expense' &&
      (categoryType === 'expense' || categoryType === 'saving'))

  if (!valid) {
    return Result.fail(
      new TransactionValidationException(
        `カテゴリ種別と取引種別が一致しません: カテゴリ=${categoryType}, 取引=${type}`,
      ),
    )
  }
  return Result.succeed(checked)
}

const createEvent = (checked: StatusChecked): TransactionCreatedEvent => {
  const { input } = checked
  const transaction = createTransaction({
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId,
    transactionDate: dayjs(input.transactionDate),
    name: input.name,
    eventId: input.eventId ? (input.eventId as EventId) : null,
  })
  return { transaction }
}

// MARK: definition

export const buildCreateTransactionWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveCategory(effects)),
      Result.andThen(checkCategoryStatus),
      Result.andThen(checkTypeMismatch),
      Result.map(createEvent),
    )
