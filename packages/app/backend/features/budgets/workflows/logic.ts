import { Result } from '@praha/byethrow'

import { BudgetValidationException } from '../exceptions'

export type BudgetBalanceItem = {
  budgetAmount: number
  categoryType: 'income' | 'expense' | 'saving'
}

export const checkBudgetBalance = (
  items: BudgetBalanceItem[],
): Result.Result<void, BudgetValidationException> => {
  let incomeTotal = 0
  let expenseTotal = 0

  for (const item of items) {
    if (item.categoryType === 'income') {
      incomeTotal += item.budgetAmount
    } else if (item.categoryType === 'expense') {
      expenseTotal += item.budgetAmount
    }
  }

  if (expenseTotal > incomeTotal) {
    return Result.fail(
      new BudgetValidationException(
        `支出予算合計（${expenseTotal}円）が収入予算合計（${incomeTotal}円）を超えています`,
      ),
    )
  }

  return Result.succeed(undefined)
}
