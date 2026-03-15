import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'

import type { SummaryBarItem } from '../-components/budget-summary-chart'
import type { BudgetItem } from '../-components/category-budget-card'

const UNALLOCATED_COLOR = 'var(--border)'

type BudgetItemRaw = Omit<BudgetItem, 'status'>

// 収入カテゴリ
const INCOME_RAW: BudgetItemRaw[] = [
  {
    categoryId: 'cat-inc-01',
    categoryName: '給与',
    annualBudget: 5_000_000,
    ytdActual: 2_820_000,
    icon: 'wallet' as CategoryIconType,
    color: 'green' as CategoryColor,
  },
  {
    categoryId: 'cat-inc-02',
    categoryName: '副業',
    annualBudget: 120_000,
    ytdActual: 45_000,
    icon: 'briefcase' as CategoryIconType,
    color: 'teal' as CategoryColor,
  },
  {
    categoryId: 'cat-inc-03',
    categoryName: '配当',
    annualBudget: 24_000,
    ytdActual: 5_000,
    icon: 'trending_up' as CategoryIconType,
    color: 'blue' as CategoryColor,
  },
]

// 支出カテゴリ（スクロール確認のために多めに設定）
const EXPENSE_RAW: BudgetItemRaw[] = [
  {
    categoryId: 'cat-exp-01',
    categoryName: '光熱費',
    annualBudget: 36_000,
    ytdActual: 38_000,
    icon: 'zap' as CategoryIconType,
    color: 'yellow' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-02',
    categoryName: '衣服',
    annualBudget: 120_000,
    ytdActual: 100_000,
    icon: 'shirt' as CategoryIconType,
    color: 'pink' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-03',
    categoryName: '医療費',
    annualBudget: 42_000,
    ytdActual: 35_000,
    icon: 'heart_pulse' as CategoryIconType,
    color: 'red' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-04',
    categoryName: '通信費',
    annualBudget: 156_000,
    ytdActual: 130_000,
    icon: 'wifi' as CategoryIconType,
    color: 'blue' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-05',
    categoryName: '食費',
    annualBudget: 264_000,
    ytdActual: 180_000,
    icon: 'utensils' as CategoryIconType,
    color: 'red' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-06',
    categoryName: '外食',
    annualBudget: 96_000,
    ytdActual: 62_000,
    icon: 'coffee' as CategoryIconType,
    color: 'orange' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-07',
    categoryName: '日用品',
    annualBudget: 60_000,
    ytdActual: 35_000,
    icon: 'shopping_cart' as CategoryIconType,
    color: 'teal' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-08',
    categoryName: '娯楽・グッズ',
    annualBudget: 216_000,
    ytdActual: 110_000,
    icon: 'music' as CategoryIconType,
    color: 'purple' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-09',
    categoryName: '美容',
    annualBudget: 84_000,
    ytdActual: 35_000,
    icon: 'heart_pulse' as CategoryIconType,
    color: 'pink' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-10',
    categoryName: '交通費',
    annualBudget: 120_000,
    ytdActual: 42_000,
    icon: 'bus' as CategoryIconType,
    color: 'blue' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-11',
    categoryName: '書籍・教育',
    annualBudget: 48_000,
    ytdActual: 15_000,
    icon: 'book' as CategoryIconType,
    color: 'orange' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-12',
    categoryName: 'サブスク',
    annualBudget: 24_000,
    ytdActual: 7_200,
    icon: 'wifi' as CategoryIconType,
    color: 'teal' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-13',
    categoryName: '保険',
    annualBudget: 360_000,
    ytdActual: 90_000,
    icon: 'tag' as CategoryIconType,
    color: 'green' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-14',
    categoryName: '家賃',
    annualBudget: 960_000,
    ytdActual: 160_000,
    icon: 'house' as CategoryIconType,
    color: 'blue' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-15',
    categoryName: '積立：遠征費',
    annualBudget: 360_000,
    ytdActual: 60_000,
    icon: 'plane' as CategoryIconType,
    color: 'blue' as CategoryColor,
  },
  {
    categoryId: 'cat-exp-16',
    categoryName: '積立：グッズ',
    annualBudget: 120_000,
    ytdActual: 20_000,
    icon: 'gift' as CategoryIconType,
    color: 'purple' as CategoryColor,
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
  color: `var(--category-${item.color})`,
}))

export const expenseSummaryItems: SummaryBarItem[] = [
  ...EXPENSE_RAW.map((item) => ({
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    amount: item.annualBudget,
    color: `var(--category-${item.color})`,
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
