import type { CategoryId } from '@backend/domains/category'
import type { FiscalYear } from '@backend/domains/fiscal-year'
import {
  findCategoriesByIds,
  findCategoryById,
} from '@backend/features/categories/repository'
import { sessionMiddleware } from '@backend/features/session/middleware'
import { zValidator } from '@hono/zod-validator'
import { Result } from '@praha/byethrow'
import { Hono } from 'hono'

import {
  findFiscalYearByYear,
  saveFiscalYear,
} from '../fiscal-years/repository'
import { FiscalYearClosedException } from './exceptions'
import {
  deleteBudgetsByFiscalYearId,
  findBudgetsByFiscalYearId,
  saveBudget,
  saveBudgets,
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

    const command = {
      input: {
        year: body.year,
        items: body.items.map((item) => ({
          categoryId: item.categoryId as CategoryId,
          budgetAmount: item.budgetAmount,
        })),
      },
      context: { userId: session.userId },
    }
    const result = await workflow(command)

    if (Result.isFailure(result)) {
      if (result.error instanceof FiscalYearClosedException) {
        return c.json({ message: result.error.message }, 409)
      }
      return c.json({ message: result.error.message }, 400)
    }

    if (result.value.isNewFiscalYear) {
      await saveFiscalYear(db)(result.value.fiscalYear)
    }
    await deleteBudgetsByFiscalYearId(db)(
      session.userId,
      result.value.fiscalYear.id,
    )
    await saveBudgets(db)(result.value.budgets)

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

    const command = {
      input: {
        year,
        items: body.items.map((item) => ({
          categoryId: item.categoryId as CategoryId,
          budgetAmount: item.budgetAmount,
        })),
      },
      context: { userId: session.userId },
    }
    const result = await workflow(command)

    if (Result.isFailure(result)) {
      if (result.error instanceof FiscalYearClosedException) {
        return c.json({ message: result.error.message }, 409)
      }
      return c.json({ message: result.error.message }, 400)
    }

    if (result.value.isNewFiscalYear) {
      await saveFiscalYear(db)(result.value.fiscalYear)
    }
    await deleteBudgetsByFiscalYearId(db)(
      session.userId,
      result.value.fiscalYear.id,
    )
    await saveBudgets(db)(result.value.budgets)

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

      const categoryId = c.req.param('categoryId') as CategoryId
      const body = c.req.valid('json')
      const db = c.get('db')

      const workflow = buildUpdateBudgetItemWorkflow({
        findFiscalYearByYear: findFiscalYearByYear(db),
        findCategoryById: findCategoryById(db),
        findBudgetsByFiscalYearId: findBudgetsByFiscalYearId(db),
        findCategoriesByIds: findCategoriesByIds(db),
      })

      const command = {
        input: {
          year,
          categoryId,
          budgetAmount: body.budgetAmount,
        },
        context: { userId: session.userId },
      }
      const result = await workflow(command)

      if (Result.isFailure(result)) {
        if (result.error instanceof FiscalYearClosedException) {
          return c.json({ message: result.error.message }, 409)
        }
        return c.json({ message: result.error.message }, 400)
      }

      if (result.value.isNewFiscalYear) {
        await saveFiscalYear(db)(result.value.fiscalYear)
      }
      await saveBudget(db)(result.value.budget)

      const allBudgets = await findBudgetsByFiscalYearId(db)(
        session.userId,
        result.value.fiscalYear.id,
      )

      return c.json({
        fiscalYear: toFiscalYearResponse(result.value.fiscalYear),
        items: allBudgets.map((b) => ({
          categoryId: b.categoryId,
          budgetAmount: b.budgetAmount,
        })),
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
