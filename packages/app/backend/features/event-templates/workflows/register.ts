import type { Category } from '@backend/domains/category'
import type { Event } from '@backend/domains/event'
import { createEvent } from '@backend/domains/event'
import type { EventTemplateId } from '@backend/domains/event-template'
import type { Transaction, TransactionType } from '@backend/domains/transaction'
import { createTransaction } from '@backend/domains/transaction'
import type { UserId } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import { Result } from '@praha/byethrow'

import {
  EventTemplateNotFoundException,
  EventTemplateValidationException,
} from '../exceptions'
import type {
  EventTemplateWithCategories,
  TemplateTransactionWithCategory,
} from '../repository'

// MARK: command

export type RegisterEventTemplateCommand = {
  input: {
    id: EventTemplateId
    occurredOn: string
    items: Array<{
      categoryId: TemplateTransactionWithCategory['categoryId']
      name: string
      amount: number
    }>
  }
  context: {
    userId: UserId
  }
}

// MARK: step types

type TemplateResolved = {
  input: {
    occurredOn: string
    items: Array<{
      categoryId: TemplateTransactionWithCategory['categoryId']
      name: string
      amount: number
    }>
  }
  context: {
    userId: UserId
    template: EventTemplateWithCategories
  }
}

type CategoriesResolved = {
  context: {
    userId: UserId
    template: EventTemplateWithCategories
    occurredOn: string
    items: Array<{
      category: Category
      name: string
      amount: number
    }>
  }
}

// MARK: event

export type EventTemplateRegisteredEvent = {
  event: Event
  transactions: Transaction[]
}

// MARK: effects

type Effects = {
  findEventTemplateWithCategoriesById: (
    id: EventTemplateId,
    userId: UserId,
  ) => Promise<EventTemplateWithCategories | undefined>
}

// MARK: workflow type

type Workflow = (
  command: RegisterEventTemplateCommand,
) => Result.ResultAsync<
  EventTemplateRegisteredEvent,
  EventTemplateNotFoundException | EventTemplateValidationException
>

// MARK: steps

const resolveTemplate =
  (effects: Effects) =>
  async (
    command: RegisterEventTemplateCommand,
  ): Result.ResultAsync<TemplateResolved, EventTemplateNotFoundException> => {
    const template = await effects.findEventTemplateWithCategoriesById(
      command.input.id,
      command.context.userId,
    )
    if (!template) {
      return Result.fail(
        new EventTemplateNotFoundException(
          `イベントテンプレートが見つかりません: ${command.input.id}`,
        ),
      )
    }
    return Result.succeed({
      input: {
        occurredOn: command.input.occurredOn,
        items: command.input.items,
      },
      context: { userId: command.context.userId, template },
    })
  }

const resolveCategories = (
  resolved: TemplateResolved,
): Result.ResultAsync<CategoriesResolved, EventTemplateValidationException> => {
  const categoryMap = new Map(
    resolved.context.template.defaultTransactions.map((tx) => [
      tx.categoryId,
      tx.category,
    ]),
  )

  const resolvedItems: Array<{
    category: Category
    name: string
    amount: number
  }> = []

  for (const item of resolved.input.items) {
    const category = categoryMap.get(item.categoryId)
    if (!category) {
      return Promise.resolve(
        Result.fail(
          new EventTemplateValidationException(
            `カテゴリが見つかりません: ${item.categoryId}`,
          ),
        ),
      )
    }
    resolvedItems.push({ category, name: item.name, amount: item.amount })
  }

  return Promise.resolve(
    Result.succeed({
      context: {
        userId: resolved.context.userId,
        template: resolved.context.template,
        occurredOn: resolved.input.occurredOn,
        items: resolvedItems,
      },
    }),
  )
}

const resolveTransactionType = (
  categoryType: Category['type'],
): TransactionType => (categoryType === 'income' ? 'income' : 'expense')

const buildRegistrationData = (
  resolved: CategoriesResolved,
): EventTemplateRegisteredEvent => {
  const event = createEvent({
    userId: resolved.context.userId,
    name: resolved.context.template.name,
    occurredOn: dayjs(resolved.context.occurredOn),
  })

  const transactions: Transaction[] = resolved.context.items.map((item) =>
    createTransaction({
      userId: resolved.context.userId,
      type: resolveTransactionType(item.category.type),
      amount: item.amount,
      categoryId: item.category.id,
      transactionDate: dayjs(resolved.context.occurredOn),
      name: item.name,
      eventId: event.id,
    }),
  )

  return { event, transactions }
}

// MARK: definition

export const buildRegisterEventTemplateWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveTemplate(effects)),
      Result.andThen(resolveCategories),
      Result.map(buildRegistrationData),
    )
