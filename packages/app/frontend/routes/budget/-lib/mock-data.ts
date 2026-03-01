import type { SummaryBarItem } from '../-components/budget-summary-chart'
import type { BudgetItem } from '../-components/category-budget-card'

const UNALLOCATED_COLOR = 'var(--border)'

// 収入カテゴリ
const INCOME_RAW: BudgetItem[] = [
  {
    categoryId: 'mb-inc-01',
    categoryName: '給与',
    annualBudget: 5_000_000,
    ytdActual: 2_820_000,
    color: 'oklch(0.70 0.15 140)',
  },
  {
    categoryId: 'mb-inc-02',
    categoryName: '副業',
    annualBudget: 120_000,
    ytdActual: 45_000,
    color: 'oklch(0.68 0.18 100)',
  },
  {
    categoryId: 'mb-inc-03',
    categoryName: '配当',
    annualBudget: 24_000,
    ytdActual: 5_000,
    color: 'oklch(0.65 0.20 160)',
  },
]

// 支出カテゴリ（スクロール確認のために多めに設定）
type ExpenseRaw = Omit<BudgetItem, 'status'>

const EXPENSE_RAW: ExpenseRaw[] = [
  {
    categoryId: 'mb-exp-01',
    categoryName: '光熱費',
    annualBudget: 36_000,
    ytdActual: 38_000,
    color: 'var(--chart-1)',
  },
  {
    categoryId: 'mb-exp-02',
    categoryName: '衣服',
    annualBudget: 120_000,
    ytdActual: 100_000,
    color: 'var(--chart-2)',
  },
  {
    categoryId: 'mb-exp-03',
    categoryName: '医療費',
    annualBudget: 42_000,
    ytdActual: 35_000,
    color: 'var(--chart-3)',
  },
  {
    categoryId: 'mb-exp-04',
    categoryName: '通信費',
    annualBudget: 156_000,
    ytdActual: 130_000,
    color: 'var(--chart-4)',
  },
  {
    categoryId: 'mb-exp-05',
    categoryName: '食費',
    annualBudget: 264_000,
    ytdActual: 180_000,
    color: 'var(--chart-5)',
  },
  {
    categoryId: 'mb-exp-06',
    categoryName: '外食',
    annualBudget: 96_000,
    ytdActual: 62_000,
    color: 'oklch(0.65 0.20 290)',
  },
  {
    categoryId: 'mb-exp-07',
    categoryName: '日用品',
    annualBudget: 60_000,
    ytdActual: 35_000,
    color: 'oklch(0.72 0.18 350)',
  },
  {
    categoryId: 'mb-exp-08',
    categoryName: '娯楽・グッズ',
    annualBudget: 216_000,
    ytdActual: 110_000,
    color: 'oklch(0.60 0.18 210)',
  },
  {
    categoryId: 'mb-exp-09',
    categoryName: '美容',
    annualBudget: 84_000,
    ytdActual: 35_000,
    color: 'oklch(0.68 0.20 30)',
  },
  {
    categoryId: 'mb-exp-10',
    categoryName: '交通費',
    annualBudget: 120_000,
    ytdActual: 42_000,
    color: 'oklch(0.63 0.16 265)',
  },
  {
    categoryId: 'mb-exp-11',
    categoryName: '書籍・教育',
    annualBudget: 48_000,
    ytdActual: 15_000,
    color: 'oklch(0.60 0.18 340)',
  },
  {
    categoryId: 'mb-exp-12',
    categoryName: 'サブスク',
    annualBudget: 24_000,
    ytdActual: 7_200,
    color: 'oklch(0.72 0.14 220)',
  },
  {
    categoryId: 'mb-exp-13',
    categoryName: '保険',
    annualBudget: 360_000,
    ytdActual: 90_000,
    color: 'oklch(0.58 0.12 280)',
  },
  {
    categoryId: 'mb-exp-14',
    categoryName: '家賃',
    annualBudget: 960_000,
    ytdActual: 160_000,
    color: 'oklch(0.55 0.15 150)',
  },
  {
    categoryId: 'mb-exp-15',
    categoryName: '積立：遠征費',
    annualBudget: 360_000,
    ytdActual: 60_000,
    color: 'oklch(0.60 0.15 200)',
  },
  {
    categoryId: 'mb-exp-16',
    categoryName: '積立：グッズ',
    annualBudget: 120_000,
    ytdActual: 20_000,
    color: 'oklch(0.55 0.15 160)',
  },
]

const calcStatus = (
  ytdActual: number,
  annualBudget: number,
): 'over' | 'warning' | 'ok' => {
  const rate = ytdActual / annualBudget
  return rate >= 1.0 ? 'over' : rate >= 0.8 ? 'warning' : 'ok'
}

export const incomeItems: BudgetItem[] = INCOME_RAW

export const expenseItems: BudgetItem[] = EXPENSE_RAW.slice()
  .sort((a, b) => b.ytdActual / b.annualBudget - a.ytdActual / a.annualBudget)
  .map((item) => ({
    ...item,
    status: calcStatus(item.ytdActual, item.annualBudget),
  }))

const totalIncomeBudget = INCOME_RAW.reduce(
  (sum, item) => sum + item.annualBudget,
  0,
)
const totalExpenseBudget = EXPENSE_RAW.reduce(
  (sum, item) => sum + item.annualBudget,
  0,
)
const unallocatedBudget = totalIncomeBudget - totalExpenseBudget

export const incomeSummaryItems: SummaryBarItem[] = INCOME_RAW.map((item) => ({
  categoryId: item.categoryId,
  categoryName: item.categoryName,
  amount: item.annualBudget,
  color: item.color,
}))

export const expenseSummaryItems: SummaryBarItem[] = [
  ...EXPENSE_RAW.map((item) => ({
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    amount: item.annualBudget,
    color: item.color,
  })),
  ...(unallocatedBudget > 0
    ? [
        {
          categoryId: 'unallocated',
          categoryName: '未割り当て',
          amount: unallocatedBudget,
          color: UNALLOCATED_COLOR,
          labelColor: 'var(--muted-foreground)',
        },
      ]
    : []),
]
