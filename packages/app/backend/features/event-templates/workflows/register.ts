import type { Category, CategoryId } from '@backend/domains/category'
import type { Event } from '@backend/domains/event'
import { createEvent } from '@backend/domains/event'
import type {
  EventTemplate,
  EventTemplateId,
} from '@backend/domains/event-template'
import type { Transaction, TransactionType } from '@backend/domains/transaction'
import { createTransaction } from '@backend/domains/transaction'
import type { UserId } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import { Result } from '@praha/byethrow'

import {
  EventTemplateNotFoundException,
  EventTemplateValidationException,
} from '../exceptions'

// MARK: command

export type RegisterEventTemplateCommand = {
  input: {
    id: EventTemplateId
    occurredOn: string
    items: Array<{
      categoryId: CategoryId
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
      categoryId: CategoryId
      name: string
      amount: number
    }>
  }
  context: {
    userId: UserId
    template: EventTemplate
  }
}

type CategoriesResolved = {
  context: {
    userId: UserId
    template: EventTemplate
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
  findEventTemplateById: (
    id: EventTemplateId,
    userId: UserId,
  ) => Promise<EventTemplate | undefined>
  findCategoriesByIds: (
    ids: CategoryId[],
    userId: UserId,
  ) => Promise<Map<CategoryId, Category>>
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
    const template = await effects.findEventTemplateById(
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

const resolveCategories =
  (effects: Effects) =>
  async (
    resolved: TemplateResolved,
  ): Result.ResultAsync<
    CategoriesResolved,
    EventTemplateValidationException
  > => {
    const ids = resolved.input.items.map((item) => item.categoryId)
    const categoryMap = await effects.findCategoriesByIds(
      ids,
      resolved.context.userId,
    )

    const resolvedItems: Array<{
      category: Category
      name: string
      amount: number
    }> = []

    for (const item of resolved.input.items) {
      const category = categoryMap.get(item.categoryId)
      if (!category) {
        return Result.fail(
          new EventTemplateValidationException(
            `カテゴリが見つかりません: ${item.categoryId}`,
          ),
        )
      }
      resolvedItems.push({ category, name: item.name, amount: item.amount })
    }

    return Result.succeed({
      context: {
        userId: resolved.context.userId,
        template: resolved.context.template,
        occurredOn: resolved.input.occurredOn,
        items: resolvedItems,
      },
    })
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
      Result.andThen(resolveCategories(effects)),
      Result.map(buildRegistrationData),
    )
