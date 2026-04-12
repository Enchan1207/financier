import type { FiscalYear } from '@backend/domains/fiscal-year'
import { findCategoriesByIds } from '@backend/features/categories/repository'
import { sessionMiddleware } from '@backend/features/session/middleware'
import { zValidator } from '@hono/zod-validator'
import { Result } from '@praha/byethrow'
import { Hono } from 'hono'

import {
  findFiscalYearByYear,
  saveFiscalYear,
} from '../fiscal-years/repository'
import {
  BudgetNotFoundException,
  FiscalYearClosedException,
} from './exceptions'
import {
  findBudgetsWithCategoryTypeByFiscalYearId,
  saveBudget,
  saveFiscalYearAndBudgets,
} from './repository'
import {
  CreateBudgetsRequestSchema,
  UpdateBudgetItemRequestSchema,
  UpdateBudgetsRequestSchema,
} from './schema'
import { buildCloseFiscalYearWorkflow } from './workflows/close'
import { buildSaveBudgetsWorkflow } from './workflows/save-budgets'
import { buildUpdateBudgetItemWorkflow } from './workflows/update-item'

type BudgetItemResponse = {
  categoryId: string
  budgetAmount: number
}

type FiscalYearResponse = {
  id: string
  year: number
  status: 'active' | 'closed'
}

type BudgetsResponse = {
  fiscalYear: FiscalYearResponse
  items: BudgetItemResponse[]
}

const toFiscalYearResponse = (fiscalYear: FiscalYear): FiscalYearResponse => ({
  id: fiscalYear.id,
  year: fiscalYear.year,
  status: fiscalYear.status,
})

const app = new Hono<{ Bindings: Env }>()
  .use(sessionMiddleware)
  .post('/', zValidator('json', CreateBudgetsRequestSchema), async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const body = c.req.valid('json')
    const db = c.get('db')

    const workflow = buildSaveBudgetsWorkflow({
      findFiscalYearByYear: findFiscalYearByYear(db),
      findCategoriesByIds: findCategoriesByIds(db),
    })

    const result = await workflow({
      input: { year: body.year, items: body.items },
      context: { userId: session.userId },
    })

    if (Result.isFailure(result)) {
      if (result.error instanceof FiscalYearClosedException) {
        return c.json({ message: result.error.message }, 409)
      }
      return c.json({ message: result.error.message }, 400)
    }

    await saveFiscalYearAndBudgets(db)({
      newFiscalYear: result.value.isNewFiscalYear
        ? result.value.fiscalYear
        : undefined,
      userId: session.userId,
      fiscalYearId: result.value.fiscalYear.id,
      budgets: result.value.budgets,
    })

    return c.json(
      {
        fiscalYear: toFiscalYearResponse(result.value.fiscalYear),
        items: result.value.budgets.map((b) => ({
          categoryId: b.categoryId,
          budgetAmount: b.budgetAmount,
        })),
      } satisfies BudgetsResponse,
      201,
    )
  })
  .put('/:year', zValidator('json', UpdateBudgetsRequestSchema), async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const year = Number(c.req.param('year'))
    if (!Number.isInteger(year) || year <= 0) {
      return c.json({ message: '年度が不正です' }, 400)
    }

    const body = c.req.valid('json')
    const db = c.get('db')

    const workflow = buildSaveBudgetsWorkflow({
      findFiscalYearByYear: findFiscalYearByYear(db),
      findCategoriesByIds: findCategoriesByIds(db),
    })

    const result = await workflow({
      input: { year, items: body.items },
      context: { userId: session.userId },
    })

    if (Result.isFailure(result)) {
      if (result.error instanceof FiscalYearClosedException) {
        return c.json({ message: result.error.message }, 409)
      }
      return c.json({ message: result.error.message }, 400)
    }

    await saveFiscalYearAndBudgets(db)({
      newFiscalYear: result.value.isNewFiscalYear
        ? result.value.fiscalYear
        : undefined,
      userId: session.userId,
      fiscalYearId: result.value.fiscalYear.id,
      budgets: result.value.budgets,
    })

    return c.json({
      fiscalYear: toFiscalYearResponse(result.value.fiscalYear),
      items: result.value.budgets.map((b) => ({
        categoryId: b.categoryId,
        budgetAmount: b.budgetAmount,
      })),
    } satisfies BudgetsResponse)
  })
  .put(
    '/:year/items/:categoryId',
    zValidator('json', UpdateBudgetItemRequestSchema),
    async (c) => {
      const session = c.get('session')
      if (session === undefined) {
        return c.json({ message: 'Unauthorized' }, 401)
      }

      const year = Number(c.req.param('year'))
      if (!Number.isInteger(year) || year <= 0) {
        return c.json({ message: '年度が不正です' }, 400)
      }

      const categoryId = c.req.param('categoryId')
      const body = c.req.valid('json')
      const db = c.get('db')

      const workflow = buildUpdateBudgetItemWorkflow({
        findFiscalYearByYear: findFiscalYearByYear(db),
        findBudgetsWithCategoryTypeByFiscalYearId:
          findBudgetsWithCategoryTypeByFiscalYearId(db),
      })

      const result = await workflow({
        input: { year, categoryId, budgetAmount: body.budgetAmount },
        context: { userId: session.userId },
      })

      if (Result.isFailure(result)) {
        if (result.error instanceof FiscalYearClosedException) {
          return c.json({ message: result.error.message }, 409)
        }
        if (result.error instanceof BudgetNotFoundException) {
          return c.json({ message: result.error.message }, 404)
        }
        return c.json({ message: result.error.message }, 400)
      }

      await saveBudget(db)(result.value.budget)

      return c.json({
        fiscalYear: toFiscalYearResponse(result.value.fiscalYear),
        items: [
          {
            categoryId: result.value.budget.categoryId,
            budgetAmount: result.value.budget.budgetAmount,
          },
        ],
      } satisfies BudgetsResponse)
    },
  )
  .post('/:year/close', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const year = Number(c.req.param('year'))
    if (!Number.isInteger(year) || year <= 0) {
      return c.json({ message: '年度が不正です' }, 400)
    }

    const db = c.get('db')

    const workflow = buildCloseFiscalYearWorkflow({
      findFiscalYearByYear: findFiscalYearByYear(db),
    })

    const result = await workflow({
      input: { year },
      context: { userId: session.userId },
    })

    if (Result.isFailure(result)) {
      return c.json({ message: result.error.message }, 404)
    }

    await saveFiscalYear(db)(result.value.fiscalYear)

    return c.json({
      fiscalYear: toFiscalYearResponse(result.value.fiscalYear),
    })
  })

export default app
