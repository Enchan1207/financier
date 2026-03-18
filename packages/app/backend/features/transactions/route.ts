import type { CategoryId } from '@backend/domains/category'
import type { TransactionId } from '@backend/domains/transaction'
import { sessionMiddleware } from '@backend/features/session/middleware'
import { zValidator } from '@hono/zod-validator'
import { Result } from '@praha/byethrow'
import { Hono } from 'hono'

import { findCategoryById } from '../categories/repository'
import { TransactionNotFoundException } from './exceptions'
import {
  deleteTransaction,
  findTransactionById,
  findTransactions,
  saveTransaction,
} from './repository'
import {
  CreateTransactionRequestSchema,
  UpdateTransactionRequestSchema,
} from './schema'
import { buildCreateTransactionWorkflow } from './workflows/create'
import { buildUpdateTransactionWorkflow } from './workflows/update'

type TransactionResponse = {
  id: string
  type: 'income' | 'expense'
  amount: number
  categoryId: string
  transactionDate: string
  name: string
  eventId: string | null
  createdAt: string
}

const toTransactionResponse = (transaction: {
  id: string
  type: string
  amount: number
  categoryId: string
  transactionDate: { format: (f: string) => string }
  name: string
  eventId: string | null
  createdAt: { toISOString: () => string }
}): TransactionResponse => ({
  id: transaction.id,
  type: transaction.type as TransactionResponse['type'],
  amount: transaction.amount,
  categoryId: transaction.categoryId,
  transactionDate: transaction.transactionDate.format('YYYY-MM-DD'),
  name: transaction.name,
  eventId: transaction.eventId,
  createdAt: transaction.createdAt.toISOString(),
})

const app = new Hono<{ Bindings: Env }>()
  .use(sessionMiddleware)
  .get('/', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const transactions = await findTransactions(c.get('db'))(session.userId)
    return c.json({ transactions: transactions.map(toTransactionResponse) })
  })
  .post('/', zValidator('json', CreateTransactionRequestSchema), async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const body = c.req.valid('json')
    const db = c.get('db')

    const workflow = buildCreateTransactionWorkflow({
      findCategoryById: findCategoryById(db),
    })

    const command = {
      input: {
        type: body.type,
        amount: body.amount,
        categoryId: body.categoryId as CategoryId,
        transactionDate: body.transactionDate,
        name: body.name,
        eventId: body.eventId,
      },
      context: { userId: session.userId },
    }
    const result = await workflow(command)

    if (Result.isFailure(result)) {
      if (result.error instanceof TransactionNotFoundException) {
        return c.json({ message: result.error.message }, 404)
      }
      return c.json({ message: result.error.message }, 400)
    }

    await saveTransaction(db)(result.value.transaction)

    return c.json(
      { transaction: toTransactionResponse(result.value.transaction) },
      201,
    )
  })
  .put(
    '/:id',
    zValidator('json', UpdateTransactionRequestSchema),
    async (c) => {
      const session = c.get('session')
      if (session === undefined) {
        return c.json({ message: 'Unauthorized' }, 401)
      }

      const id = c.req.param('id') as TransactionId
      const body = c.req.valid('json')
      const db = c.get('db')

      const workflow = buildUpdateTransactionWorkflow({
        findTransactionById: findTransactionById(db),
        findCategoryById: findCategoryById(db),
      })

      const command = {
        input: {
          id,
          amount: body.amount,
          categoryId: body.categoryId,
          transactionDate: body.transactionDate,
          name: body.name,
          eventId: body.eventId,
        },
        context: { userId: session.userId },
      }
      const result = await workflow(command)

      if (Result.isFailure(result)) {
        if (result.error instanceof TransactionNotFoundException) {
          return c.json({ message: result.error.message }, 404)
        }
        return c.json({ message: result.error.message }, 400)
      }

      await saveTransaction(db)(result.value.transaction)

      return c.json({
        transaction: toTransactionResponse(result.value.transaction),
      })
    },
  )
  .delete('/:id', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id') as TransactionId
    const db = c.get('db')

    const transaction = await findTransactionById(db)(id, session.userId)
    if (!transaction) {
      return c.json({ message: `トランザクションが見つかりません: ${id}` }, 404)
    }

    await deleteTransaction(db)(id)

    return c.json({ transaction: toTransactionResponse(transaction) })
  })

export default app
