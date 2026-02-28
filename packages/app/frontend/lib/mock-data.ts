import dayjs from '@frontend/lib/date'

export type TransactionType = 'income' | 'expense'

export type Category = {
  id: string
  name: string
  type: TransactionType
  isSaving: boolean
  color: string
}

export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  categoryName: string
  transactionDate: string
  eventId?: string
  eventName?: string
  name: string
}

// 予算は年度単位。表示時は /12 で月次目安を算出する
export type AnnualBudget = {
  categoryId: string
  categoryName: string
  annualBudget: number
  // 当月実績（本来はAPIから取得。モックでは手動設定）
  currentMonthActual: number
}

export type SavingDefinition = {
  id: string
  categoryId: string
  categoryName: string
  type: 'goal' | 'free'
  targetAmount?: number
  deadline?: string
  balance: number
  monthlyGuide?: number
}

export type Event = {
  id: string
  name: string
  dateRange?: { start: string; end?: string }
  totalAmount: number
}

export const categories: Category[] = [
  { id: 'cat-1',  name: '食費',       type: 'expense', isSaving: false, color: 'var(--chart-1)' },
  { id: 'cat-2',  name: '交通費',     type: 'expense', isSaving: false, color: 'var(--chart-2)' },
  { id: 'cat-3',  name: '外食',       type: 'expense', isSaving: false, color: 'var(--chart-3)' },
  { id: 'cat-4',  name: '娯楽・グッズ', type: 'expense', isSaving: false, color: 'var(--chart-4)' },
  { id: 'cat-5',  name: '衣服',       type: 'expense', isSaving: false, color: 'var(--chart-5)' },
  { id: 'cat-6',  name: '日用品',     type: 'expense', isSaving: false, color: 'oklch(0.65 0.2 290)' },
  { id: 'cat-7',  name: '美容',       type: 'expense', isSaving: false, color: 'oklch(0.72 0.18 350)' },
  { id: 'cat-8',  name: '積立：遠征費', type: 'expense', isSaving: true,  color: 'oklch(0.60 0.15 210)' },
  { id: 'cat-9',  name: '積立：グッズ', type: 'expense', isSaving: true,  color: 'oklch(0.55 0.15 150)' },
  { id: 'cat-10', name: '給与',       type: 'income',  isSaving: false, color: 'oklch(0.70 0.15 140)' },
]

export const transactions: Transaction[] = [
  { id: 'tx-1', type: 'income', amount: 282000, categoryId: 'cat-10', categoryName: '給与', transactionDate: '2026-02-03', name: '2月分給与' },
  { id: 'tx-2', type: 'expense', amount: 500, categoryId: 'cat-2', categoryName: '交通費', transactionDate: '2026-02-03', name: '定期外乗車' },
  { id: 'tx-3', type: 'expense', amount: 1850, categoryId: 'cat-1', categoryName: '食費', transactionDate: '2026-02-05', name: 'スーパー' },
  { id: 'tx-4', type: 'expense', amount: 1200, categoryId: 'cat-3', categoryName: '外食', transactionDate: '2026-02-07', name: 'ランチ' },
  { id: 'tx-5', type: 'expense', amount: 30000, categoryId: 'cat-8', categoryName: '積立：遠征費', transactionDate: '2026-02-08', name: '2月分積立' },
  { id: 'tx-6', type: 'expense', amount: 6500, categoryId: 'cat-7', categoryName: '美容', transactionDate: '2026-02-10', name: 'カット・カラー' },
  { id: 'tx-7', type: 'expense', amount: 2200, categoryId: 'cat-1', categoryName: '食費', transactionDate: '2026-02-12', name: 'スーパー' },
  { id: 'tx-8', type: 'expense', amount: 7800, categoryId: 'cat-5', categoryName: '衣服', transactionDate: '2026-02-14', name: 'バレンタインコーデ', eventId: 'ev-1', eventName: 'バレンタインイベント' },
  { id: 'tx-9', type: 'expense', amount: 4200, categoryId: 'cat-4', categoryName: '娯楽・グッズ', transactionDate: '2026-02-15', name: 'ぬいぐるみ', eventId: 'ev-1', eventName: 'バレンタインイベント' },
  { id: 'tx-10', type: 'expense', amount: 1800, categoryId: 'cat-6', categoryName: '日用品', transactionDate: '2026-02-17', name: '薬局' },
  { id: 'tx-11', type: 'expense', amount: 980, categoryId: 'cat-1', categoryName: '食費', transactionDate: '2026-02-18', name: 'コンビニ' },
  { id: 'tx-12', type: 'expense', amount: 2800, categoryId: 'cat-2', categoryName: '交通費', transactionDate: '2026-02-20', name: '春ライブ 新幹線', eventId: 'ev-2', eventName: '春ライブ遠征' },
  { id: 'tx-13', type: 'expense', amount: 8500, categoryId: 'cat-4', categoryName: '娯楽・グッズ', transactionDate: '2026-02-20', name: 'ライブグッズ', eventId: 'ev-2', eventName: '春ライブ遠征' },
  { id: 'tx-14', type: 'expense', amount: 2400, categoryId: 'cat-3', categoryName: '外食', transactionDate: '2026-02-21', name: '遠征ご飯', eventId: 'ev-2', eventName: '春ライブ遠征' },
  { id: 'tx-15', type: 'expense', amount: 1600, categoryId: 'cat-1', categoryName: '食費', transactionDate: '2026-02-24', name: 'スーパー' },
  { id: 'tx-16', type: 'expense', amount: 3200, categoryId: 'cat-3', categoryName: '外食', transactionDate: '2026-02-26', name: '友人と夕飯' },
  { id: 'tx-17', type: 'expense', amount: 1200, categoryId: 'cat-1', categoryName: '食費', transactionDate: '2026-02-28', name: 'コンビニ' },
  // 未来取引
  { id: 'tx-18', type: 'expense', amount: 5500, categoryId: 'cat-4', categoryName: '娯楽・グッズ', transactionDate: '2026-03-05', name: '新グッズ発売', eventId: 'ev-3', eventName: '春グッズ' },
  { id: 'tx-19', type: 'expense', amount: 8000, categoryId: 'cat-2', categoryName: '交通費', transactionDate: '2026-03-20', name: '春遠征 新幹線', eventId: 'ev-2', eventName: '春ライブ遠征' },
  { id: 'tx-20', type: 'expense', amount: 12000, categoryId: 'cat-4', categoryName: '娯楽・グッズ', transactionDate: '2026-03-20', name: '春ライブグッズ予定', eventId: 'ev-2', eventName: '春ライブ遠征' },
  { id: 'tx-21', type: 'expense', amount: 3000, categoryId: 'cat-3', categoryName: '外食', transactionDate: '2026-03-21', name: '遠征飯予定', eventId: 'ev-2', eventName: '春ライブ遠征' },
  { id: 'tx-22', type: 'expense', amount: 15000, categoryId: 'cat-5', categoryName: '衣服', transactionDate: '2026-04-05', name: '春物購入予定' },
]

// 積立カテゴリは予算設定対象外
export const annualBudgets: AnnualBudget[] = [
  { categoryId: 'cat-10', categoryName: '給与', annualBudget: 5000000, currentMonthActual: 282000 },
  { categoryId: 'cat-1',  categoryName: '食費',       annualBudget: 264000,  currentMonthActual: 7830 },
  { categoryId: 'cat-2',  categoryName: '交通費',     annualBudget: 120000,  currentMonthActual: 3300 },
  { categoryId: 'cat-3',  categoryName: '外食',       annualBudget: 96000,   currentMonthActual: 6800 },
  { categoryId: 'cat-4',  categoryName: '娯楽・グッズ', annualBudget: 216000, currentMonthActual: 12700 },
  { categoryId: 'cat-5',  categoryName: '衣服',       annualBudget: 120000,  currentMonthActual: 7800 },
  { categoryId: 'cat-6',  categoryName: '日用品',     annualBudget: 60000,   currentMonthActual: 1800 },
  { categoryId: 'cat-7',  categoryName: '美容',       annualBudget: 84000,   currentMonthActual: 6500 },
]

export const savings: SavingDefinition[] = [
  {
    id: 'sav-1',
    categoryId: 'cat-8',
    categoryName: '遠征費積立',
    type: 'goal',
    targetAmount: 200000,
    deadline: '2026-08-01',
    balance: 90000,
    monthlyGuide: 22000,
  },
  {
    id: 'sav-2',
    categoryId: 'cat-9',
    categoryName: 'グッズ積立',
    type: 'free',
    balance: 35000,
  },
]

export const events: Event[] = [
  {
    id: 'ev-1',
    name: 'バレンタインイベント',
    dateRange: { start: '2026-02-14' },
    totalAmount: 12000,
  },
  {
    id: 'ev-2',
    name: '春ライブ遠征',
    dateRange: { start: '2026-02-20', end: '2026-03-21' },
    totalAmount: 35700,
  },
  {
    id: 'ev-3',
    name: '春グッズ',
    dateRange: { start: '2026-03-05' },
    totalAmount: 5500,
  },
]

export const internalBalance = 1243800
export const TODAY = '2026-02-28'

export const formatCurrency = (amount: number) =>
  `¥${amount.toLocaleString('ja-JP')}`

export const formatDate = (dateStr: string) => {
  const d = dayjs(dateStr)
  return `${d.month() + 1}/${d.date()}`
}
