import type { CategoryId } from '@backend/domains/category'
import { findBudgetsByFiscalYearId } from '@backend/features/budgets/repository'
import { findCategories } from '@backend/features/categories/repository'
import { findFiscalYearByYear } from '@backend/features/fiscal-years/repository'
import { sessionMiddleware } from '@backend/features/session/middleware'
import { findTransactionsByFiscalYear } from '@backend/features/transactions/repository'
import { Hono } from 'hono'

// MARK: レスポンス型

type MonthlyActualResponse = {
  month: number
  actual: number
}

type BudgetPageItemResponse = {
  categoryId: string
  categoryName: string
  categoryType: 'income' | 'expense' | 'saving'
  budgetAmount: number
  annualActual: number
  monthlyActuals: MonthlyActualResponse[]
}

type BudgetPageResponse = {
  fiscalYear: {
    id: string
    year: number
    status: 'active' | 'closed'
  }
  items: BudgetPageItemResponse[]
  warnings: {
    exceedsBudget: boolean
  }
}

const app = new Hono<{ Bindings: Env }>()
  .use(sessionMiddleware)
  .get('/:year', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const year = Number(c.req.param('year'))
    if (!Number.isInteger(year) || year <= 0) {
      return c.json({ message: '年度が不正です' }, 400)
    }

    const db = c.get('db')
    const { userId } = session

    const fiscalYear = await findFiscalYearByYear(db)(userId, year)
    if (!fiscalYear) {
      return c.json({ message: `年度${year}が見つかりません` }, 404)
    }

    const [budgets, categories, transactions] = await Promise.all([
      findBudgetsByFiscalYearId(db)(userId, fiscalYear.id),
      findCategories(db)(userId),
      findTransactionsByFiscalYear(db)(userId, year),
    ])

    const categoryMap = new Map(categories.map((cat) => [cat.id, cat]))

    const monthlyActualsByCategory = new Map<CategoryId, Map<number, number>>()
    for (const tx of transactions) {
      const month = tx.transactionDate.month() + 1
      const existing = monthlyActualsByCategory.get(tx.categoryId)
      if (existing) {
        const current = existing.get(month) ?? 0
        existing.set(month, current + tx.amount)
      } else {
        monthlyActualsByCategory.set(
          tx.categoryId,
          new Map([[month, tx.amount]]),
        )
      }
    }

    const items: BudgetPageItemResponse[] = []
    for (const budget of budgets) {
      const category = categoryMap.get(budget.categoryId)
      if (!category) continue

      const monthlyMap =
        monthlyActualsByCategory.get(budget.categoryId) ??
        new Map<number, number>()
      const annualActual = [...monthlyMap.values()].reduce(
        (sum, v) => sum + v,
        0,
      )

      const fiscalMonths = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]
      const monthlyActuals: MonthlyActualResponse[] = fiscalMonths.map(
        (month) => ({
          month,
          actual: monthlyMap.get(month) ?? 0,
        }),
      )

      items.push({
        categoryId: budget.categoryId,
        categoryName: category.name,
        categoryType: category.type,
        budgetAmount: budget.budgetAmount,
        annualActual,
        monthlyActuals,
      })
    }

    let incomeTotal = 0
    let expenseTotal = 0
    for (const item of items) {
      if (item.categoryType === 'income') {
        incomeTotal += item.budgetAmount
      } else if (item.categoryType === 'expense') {
        expenseTotal += item.budgetAmount
      }
    }

    const response: BudgetPageResponse = {
      fiscalYear: {
        id: fiscalYear.id,
        year: fiscalYear.year,
        status: fiscalYear.status,
      },
      items,
      warnings: {
        exceedsBudget: expenseTotal > incomeTotal,
      },
    }

    return c.json(response)
  })

export default app
